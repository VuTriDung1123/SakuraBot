const express = require('express');
const cors = require('cors');
const fs = require('fs');
const natural = require('natural');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Đọc dữ liệu intents
const intentsData = JSON.parse(fs.readFileSync('intents.json', 'utf8'));

// 2. Khởi tạo bộ phân loại văn bản (Text Classifier)
const classifier = new natural.BayesClassifier();

// 3. Huấn luyện (Train) mô hình NLP với dữ liệu từ intents.json
console.log("🌸 Đang huấn luyện bộ não cho SakuraBot...");
intentsData.intents.forEach(intent => {
    intent.patterns.forEach(pattern => {
        // Đưa tất cả văn bản về chữ thường để đồng nhất dữ liệu
        classifier.addDocument(pattern.toLowerCase(), intent.tag);
    });
});

// Chạy hàm huấn luyện
classifier.train();
console.log("✅ Huấn luyện hoàn tất!");

// 4. Khởi tạo API Endpoint để nhận tin nhắn
app.post('/api/chat', (req, res) => {
    const userMessage = req.body.message;
    
    // Validate dữ liệu đầu vào
    if (!userMessage || userMessage.trim() === "") {
        return res.status(400).json({ 
            response: "Bạn chưa nhập tin nhắn kìa! (・`ω´・)" 
        });
    }

    // Tiền xử lý tin nhắn người dùng và phân tích để tìm tag (intent) có xác suất cao nhất
    const predictedTag = classifier.classify(userMessage.toLowerCase());
    
    // Truy xuất câu trả lời dựa trên tag vừa tìm được
    const matchedIntent = intentsData.intents.find(i => i.tag === predictedTag);
    
    // Xử lý Fallback (Khi bot không chắc chắn hoặc không có dữ liệu)
    let botResponse = "Xin lỗi, SakuraBot chưa hiểu ý bạn lắm (´• ω •`). Bạn nói lại bằng cách khác được không?"; 
    
    if (matchedIntent) {
        // Random 1 câu trả lời trong mảng responses để tạo cảm giác tự nhiên, không bị rập khuôn
        const responses = matchedIntent.responses;
        botResponse = responses[Math.floor(Math.random() * responses.length)];
    }

    // Trả kết quả về cho Client
    res.json({ response: botResponse });
});

// 5. Khởi động Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 SakuraBot API Server đang chạy tại http://localhost:${PORT}`);
    console.log(`Gửi POST request đến http://localhost:${PORT}/api/chat để test!`);
});