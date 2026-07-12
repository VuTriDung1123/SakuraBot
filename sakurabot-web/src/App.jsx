import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import ReactMarkdown from "react-markdown";

// Đổi tên và concept cho chuẩn 3 kiến trúc AI
const botProfiles = {
  basic: {
    name: "TỰ XÂY (NLP)",
    avatar: "🤖",
    status: "Xử lý bằng luật tự code",
    colorClass: "theme-basic",
  },
  hybrid: {
    name: "HYBRID (RAG)",
    avatar: "🌸",
    status: "AI Lai + Dữ liệu nội bộ",
    colorClass: "theme-hybrid",
  },
  gemini: {
    name: "TÍCH HỢP (API)",
    avatar: "🌌",
    status: "Thuần sức mạnh Gemini",
    colorClass: "theme-gemini",
  },
};

function App() {
  const [currentBot, setCurrentBot] = useState("hybrid");

  // TÁCH RIÊNG BỘ NHỚ: Cấp cho mỗi bot một mảng tin nhắn riêng biệt
  const [chatHistories, setChatHistories] = useState({
    basic: [
      {
        id: 1,
        text: "Chào bạn! Mình là AI TỰ XÂY từ con số 0 bằng thuật toán Naive Bayes. Bạn cần gì?",
        isBot: true,
      },
    ],
    hybrid: [
      {
        id: 2,
        text: "Kon'nichiwa! SakuraBot hệ HYBRID lai giữa AI và Dữ liệu nội bộ đây! 🌸",
        isBot: true,
      },
    ],
    gemini: [
      {
        id: 3,
        text: "Xin chào! Mình là AI TÍCH HỢP gọi trực tiếp từ Google. Mình biết tuốt mọi thứ!",
        isBot: true,
      },
    ],
  });

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Kích hoạt cuộn xuống khi bộ nhớ của bot hiện tại thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [chatHistories, currentBot, isTyping]);

  // Đổi bot: Chỉ thay đổi key, React sẽ tự lấy đúng bộ nhớ ra hiển thị
  const handleSwitchBot = (botKey) => {
    setCurrentBot(botKey);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now(), text: inputText, isBot: false };

    // Lưu tin nhắn của user vào đúng "cuốn sổ" của con bot đang mở
    setChatHistories((prev) => ({
      ...prev,
      [currentBot]: [...prev[currentBot], userMsg],
    }));

    setInputText("");
    setIsTyping(true);

    try {
      const response = await axios.post("http://localhost:3000/api/chat", {
        message: userMsg.text,
        botType: currentBot, // Gửi cờ báo hiệu cho Backend biết đang nói chuyện với bot nào
      });

      setTimeout(() => {
        // Lưu tin nhắn trả lời của bot vào đúng "cuốn sổ" tương ứng
        setChatHistories((prev) => ({
          ...prev,
          [currentBot]: [
            ...prev[currentBot],
            { id: Date.now(), text: response.data.response, isBot: true },
          ],
        }));
        setIsTyping(false);
      }, 500);
    } catch (error) {
      // In lỗi ra màn hình console để sau này dễ debug
      console.error("Lỗi kết nối API:", error);

      setIsTyping(false);
      setChatHistories((prev) => ({
        ...prev,
        [currentBot]: [
          ...prev[currentBot],
          {
            id: Date.now(),
            text: "Hic, server bị lỗi kết nối rồi kuro~ (ಥ﹏ಥ)",
            isBot: true,
          },
        ],
      }));
    }
  };

  const activeProfile = botProfiles[currentBot];
  const currentMessages = chatHistories[currentBot]; // Trích xuất đúng danh sách tin nhắn để render

  return (
    <div className={`sakura-container ${activeProfile.colorClass}`}>
      {/* Header */}
      <div className="sakura-header">
        <div className="sakura-avatar">{activeProfile.avatar}</div>
        <div>
          <h2 className="sakura-header-title">{activeProfile.name}</h2>
          <span className="sakura-header-status">• {activeProfile.status}</span>
        </div>
      </div>

      {/* Thanh chọn Bot */}
      <div className="bot-selector">
        <button
          className={currentBot === "basic" ? "active" : ""}
          onClick={() => handleSwitchBot("basic")}
        >
          🤖 Tự Xây
        </button>
        <button
          className={currentBot === "hybrid" ? "active" : ""}
          onClick={() => handleSwitchBot("hybrid")}
        >
          🌸 Hybrid
        </button>
        <button
          className={currentBot === "gemini" ? "active" : ""}
          onClick={() => handleSwitchBot("gemini")}
        >
          🌌 Tích Hợp
        </button>
      </div>

      {/* Vùng Chat */}
      <div className="sakura-chat-area">
        {/* Render danh sách tin nhắn của riêng con bot đang chọn */}
        {currentMessages.map((msg) => (
          <div
            key={msg.id}
            className={`sakura-message-row ${msg.isBot ? "bot" : "user"}`}
          >
            {msg.isBot && (
              <div className="sakura-bot-icon">{activeProfile.avatar}</div>
            )}
            <div
              className={`sakura-bubble ${msg.isBot ? "bot-bubble" : "user-bubble"}`}
            >
              {msg.isBot ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="sakura-message-row bot">
            <div className="sakura-bot-icon">{activeProfile.avatar}</div>
            <div className="sakura-typing-bubble">
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Vùng Nhập liệu */}
      <form onSubmit={handleSendMessage} className="sakura-input-area">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Hỏi ${activeProfile.name}...`}
          className="sakura-input"
        />
        <button type="submit" className="sakura-send-button">
          Gửi
        </button>
      </form>
    </div>
  );
}

export default App;
