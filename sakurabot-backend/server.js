require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const natural = require('natural');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChromaClient } = require('chromadb');
const { Langfuse } = require('langfuse');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. KHỞI TẠO BỘ NÃO SỐ 1: RULE-BASED (NLP)
// ==========================================
const intentsData = JSON.parse(fs.readFileSync('intents.json', 'utf8'));
const classifier = new natural.BayesClassifier();
const langfuse = new Langfuse();

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
        
        // --- BẮT ĐẦU GIÁM SÁT VỚI LANGFUSE ---
        // 1. Tạo một Trace để theo dõi toàn bộ luồng hội thoại này
        const trace = langfuse.trace({
            name: "SakuraBot_RAG_Chat",
            sessionId: "session_local_test",
            input: userMessage,
        });

        const collection = await chroma.getCollection({ name: "sakura_knowledge" });
        const results = await collection.query({ 
            queryTexts: [userMessage], 
            nResults: 2
        });
        const context = results.documents[0].join(" | ");

        const prompt = `
            Ngữ cảnh nội bộ: ${context}
            Bạn là SakuraBot. Hãy dựa vào thông tin trong "Ngữ cảnh nội bộ" để trả lời câu hỏi của người dùng một cách thân thiện, ngắn gọn và dễ thương nhất (dùng nhiều emoji). Nếu ngữ cảnh không có thông tin, hãy nói khéo léo là bạn chưa biết.
            Câu hỏi: "${userMessage}"
        `;

        // 2. Tạo một Generation để theo dõi riêng phần gọi API Gemini
        const generation = trace.generation({
            name: "Gemini_Generation",
            model: "gemini-flash-latest",
            prompt: prompt,
        });

        const fallbackModels = [
            "gemini-flash-latest",       // Ưu tiên 1: Tốc độ bàn thờ, tự động cập nhật
            "gemini-flash-lite-latest",  // Ưu tiên 2: Bản siêu nhẹ, ít khi bị quá tải
            "gemini-pro-latest",         // Ưu tiên 3: Bản Pro, thông minh nhưng chậm hơn xíu
            "gemini-3.5-flash"           // Ưu tiên 4: Bản ổn định cố định
        ];

        // Hàm tự động chuyển model nếu gặp lỗi
        async function generateWithFallback(prompt, models) {
            for (let i = 0; i < models.length; i++) {
                const modelName = models[i];
                try {
                    console.log(`🔄 Đang thử gọi não AI: [${modelName}]...`);
                    
                    // Khởi tạo model tương ứng trong danh sách
                    const currentModel = genAI.getGenerativeModel({ model: modelName });
                    const result = await currentModel.generateContent(prompt);
                    
                    console.log(`✅ Thành công chốt đơn với model: [${modelName}]`);
                    return result.response.text(); // Trả về text nếu thành công và thoát hàm
                    
                } catch (error) {
                    console.error(`❌ Model [${modelName}] báo bận (Lỗi ${error.status}). Chuyển sang phương án B!`);
                    
                    // Nếu đã thử đến model cuối cùng trong mảng mà vẫn lỗi thì mới chịu thua
                    if (i === models.length - 1) {
                        throw error; 
                    }
                }
            }
        }

        const aiResponse = await generateWithFallback(prompt, fallbackModels);
        
        // 3. Kết thúc giám sát, ghi nhận kết quả thành công
        generation.end({
            output: aiResponse,
        });

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