require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const natural = require("natural");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { ChromaClient } = require("chromadb");
const { Langfuse } = require("langfuse");

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. KHỞI TẠO BỘ NÃO SỐ 1: RULE-BASED (NLP)
// ==========================================
const intentsData = JSON.parse(fs.readFileSync("intents.json", "utf8"));
const classifier = new natural.BayesClassifier();
const langfuse = new Langfuse();

console.log("🌸 Đang huấn luyện bộ não Rule-based...");
intentsData.intents.forEach((intent) => {
  intent.patterns.forEach((pattern) =>
    classifier.addDocument(pattern.toLowerCase(), intent.tag),
  );
});
classifier.train();
console.log("✅ Huấn luyện NLP cơ bản hoàn tất!");

// ==========================================
// 2. KHỞI TẠO CÁC CÔNG CỤ AI (GEMINI & CHROMA)
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chroma = new ChromaClient({ path: "http://localhost:8000" });

// Danh sách ưu tiên Model (Đã đưa ra ngoài để tối ưu bộ nhớ)
const fallbackModels = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-pro-latest",
  "gemini-3.5-flash",
];

// Hàm chuyển đổi model tự động (Đã đưa ra ngoài)
async function generateWithFallback(prompt, models) {
  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    try {
      console.log(`🔄 Đang thử gọi AI: [${modelName}]...`);
      const currentModel = genAI.getGenerativeModel({ model: modelName });
      const result = await currentModel.generateContent(prompt);
      console.log(`✅ Thành công chốt đơn với model: [${modelName}]`);
      return result.response.text();
    } catch (error) {
      console.error(`❌ Model [${modelName}] báo bận. Chuyển phương án B!`);
      if (i === models.length - 1) throw error;
    }
  }
}

// ==========================================
// 3. API ROUTER: ĐIỀU PHỐI ĐA BOT (3-in-1)
// ==========================================
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  const botType = req.body.botType || "hybrid"; // Mặc định là SakuraBot

  if (!userMessage || userMessage.trim() === "") {
    return res
      .status(400)
      .json({ response: "Bạn chưa nhập tin nhắn kìa! (・`ω´・)" });
  }

  try {
    // LUỒNG 1: BOT CƠ BẢN (Nhanh, dùng luật cứng)
    if (botType === "basic") {
      console.log("🎯 Chạy luồng Bot Cơ Bản (Rule-based)");

      // Thuật toán Machine Learning phân loại ý định người dùng
      const predictedTag = classifier.classify(userMessage.toLowerCase());
      const matchedIntent = intentsData.intents.find(
        (i) => i.tag === predictedTag,
      );

      // Kiểm tra chéo: Đảm bảo trong câu thực sự có chứa từ khóa
      const isExactKeywordMatch = matchedIntent.patterns.some((pattern) =>
        userMessage.toLowerCase().includes(pattern.toLowerCase()),
      );

      if (isExactKeywordMatch) {
        // Lấy ngẫu nhiên 1 câu trả lời trong mảng responses của intents.json
        const responses = matchedIntent.responses;
        return res.json({
          response: responses[Math.floor(Math.random() * responses.length)],
        });
      } else {
        // Kịch bản dự phòng khi AI tự xây "bó tay"
        return res.json({
          response:
            "Bot cơ bản chưa học được câu này. Bạn hãy thử chuyển sang tab SakuraBot hoặc Trợ lý Đa Năng nhé! 🤖",
        });
      }
    }

    // LUỒNG 2: SAKURABOT (Hybrid RAG)
    if (botType === "hybrid") {
      console.log("🌸 Chạy luồng SakuraBot (Hybrid RAG)");
      const trace = langfuse.trace({
        name: "SakuraBot_RAG_Chat",
        input: userMessage,
      });
      const collection = await chroma.getCollection({
        name: "sakura_knowledge",
      });
      const results = await collection.query({
        queryTexts: [userMessage],
        nResults: 2,
      });
      const context = results.documents[0].join(" | ");

      const prompt = `Ngữ cảnh nội bộ: ${context}\nBạn là SakuraBot. Hãy dựa vào "Ngữ cảnh nội bộ" để trả lời ngắn gọn, dễ thương. Nếu ngữ cảnh không có thông tin, hãy nói khéo léo là bạn chưa biết.\nCâu hỏi: "${userMessage}"`;

      const generation = trace.generation({
        name: "Gemini_Generation",
        model: "hybrid-routing",
        prompt: prompt,
      });
      const aiResponse = await generateWithFallback(prompt, fallbackModels);
      generation.end({ output: aiResponse });

      return res.json({ response: aiResponse });
    }

    // LUỒNG 3: TRỢ LÝ ĐA NĂNG (Thuần Gemini)
    if (botType === "gemini") {
      console.log("🌌 Chạy luồng Trợ lý Đa năng (Gemini Thuần)");
      const trace = langfuse.trace({
        name: "Gemini_Pure_Chat",
        input: userMessage,
      });
      const prompt = `Bạn là một trợ lý AI thông minh, chuyên nghiệp và đa năng. Hãy trả lời câu hỏi sau một cách chi tiết và chính xác: "${userMessage}"`;

      const generation = trace.generation({
        name: "Gemini_Pure_Generation",
        model: "gemini-pure-routing",
        prompt: prompt,
      });
      const aiResponse = await generateWithFallback(prompt, fallbackModels);
      generation.end({ output: aiResponse });

      return res.json({ response: aiResponse });
    }
  } catch (error) {
    console.error("Lỗi API:", error);
    return res.json({
      response: "Hic, hệ thống đang bảo trì một xíu, bạn đợi lát nha (´• ω •`)",
    });
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 API 3-in-1 đang chạy tại http://localhost:${PORT}`),
);
