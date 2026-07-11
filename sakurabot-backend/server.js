require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const natural = require('natural');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChromaClient } = require('chromadb');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. KHỞI TẠO BỘ NÃO SỐ 1: RULE-BASED (NLP)
// ==========================================
const intentsData = JSON.parse(fs.readFileSync('intents.json', 'utf8'));
const classifier = new natural.BayesClassifier();

console.log("🌸 Đang huấn luyện bộ não Rule-based...");
intentsData.intents.forEach(intent => {
    intent.patterns.forEach(pattern => classifier.addDocument(pattern.toLowerCase(), intent.tag));
});
classifier.train();
console.log("✅ Huấn luyện NLP cơ bản hoàn tất!");

// ==========================================
// 2. KHỞI TẠO BỘ NÃO SỐ 2: LLM & CHROMA (RAG)
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const chroma = new ChromaClient({ path: "http://localhost:8000" });

// ==========================================
// 3. API ROUTER: ĐIỀU PHỐI (ORCHESTRATION)
// ==========================================
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    
    if (!userMessage || userMessage.trim() === "") {
        return res.status(400).json({ response: "Bạn chưa nhập tin nhắn kìa! (・`ω´・)" });
    }

    // 3.1. Đi qua Cổng 1: Kiểm tra bằng NLP cơ bản
    const predictedTag = classifier.classify(userMessage.toLowerCase());
    const matchedIntent = intentsData.intents.find(i => i.tag === predictedTag);
    
    // BẢN VÁ LỖI: Kiểm tra xem câu của người dùng có thực sự chứa từ khóa trong pattern không
    const isExactKeywordMatch = matchedIntent.patterns.some(pattern => 
        userMessage.toLowerCase().includes(pattern.toLowerCase())
    );
    
    const basicTags = ["greeting", "goodbye", "thanks", "identity"];
    
    // ĐIỀU KIỆN MỚI: Tag phải thuộc nhóm cơ bản VÀ thực sự chứa từ khóa khớp
    if (basicTags.includes(predictedTag) && isExactKeywordMatch) {
        console.log("🎯 Xử lý bằng Rule-based NLP");
        const responses = matchedIntent.responses;
        const botResponse = responses[Math.floor(Math.random() * responses.length)];
        return res.json({ response: botResponse });
    }

    // 3.2. Đi qua Cổng 2: Xử lý bằng LLM + Chroma (RAG)
    try {
        console.log("🧠 Đang gọi AI LLM (Gemini) xử lý câu hỏi...");
        
        // 1. Chui vào ChromaDB lấy tài liệu liên quan nhất
        const collection = await chroma.getOrCreateCollection({ name: "sakura_knowledge" });
        const results = await collection.query({ 
            queryTexts: [userMessage], 
            nResults: 2 // Lấy 2 đoạn tài liệu khớp nhất
        });
        
        // 2. Gộp các tài liệu tìm được lại làm ngữ cảnh
        const context = results.documents[0].join(" | ");

        // 3. Gửi cho Gemini đọc tài liệu và trả lời
        const prompt = `
            Ngữ cảnh nội bộ: ${context}
            
            Bạn là SakuraBot. Hãy dựa vào thông tin trong "Ngữ cảnh nội bộ" để trả lời câu hỏi của người dùng một cách thân thiện, ngắn gọn và dễ thương nhất (dùng nhiều emoji). Nếu ngữ cảnh không có thông tin, hãy nói khéo léo là bạn chưa biết.
            
            Câu hỏi: "${userMessage}"
        `;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        
        return res.json({ response: aiResponse });

    } catch (error) {
        console.error("Lỗi AI API:", error);
        return res.json({ response: "Hic, bộ não AI của mình đang bảo trì một xíu, bạn đợi lát nha (´• ω •`)" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 SakuraBot Hybrid API đang chạy tại http://localhost:${PORT}`);
});