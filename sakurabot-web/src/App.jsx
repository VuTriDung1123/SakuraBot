import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; // Gọi file CSS vào đây

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Kon'nichiwa! SakuraBot sẵn sàng giúp đỡ bạn nè (✿◠‿◠) 🌸", isBot: true }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Tin nhắn của user
    const userMsg = { id: Date.now(), text: inputText, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Gọi API Backend
      const response = await axios.post('http://localhost:3000/api/chat', {
        message: userMsg.text
      });

      // Delay 500ms cho tự nhiên
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: response.data.response,
          isBot: true
        }]);
        setIsTyping(false);
      }, 500);

    } catch (error) {
      console.error("Lỗi kết nối API:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "Hic, kết nối với server có vấn đề rồi kuro~ (ಥ﹏ಥ)",
        isBot: true
      }]);
    }
  };

  return (
    <div className="sakura-container">
      {/* Header */}
      <div className="sakura-header">
        <div className="sakura-avatar">🌸</div>
        <div>
          <h2 className="sakura-header-title">SakuraBot Assistant</h2>
          <span className="sakura-header-status">• Đang hoạt động dễ thương</span>
        </div>
      </div>

      {/* Vùng Chat */}
      <div className="sakura-chat-area">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`sakura-message-row ${msg.isBot ? 'bot' : 'user'}`}
          >
            {msg.isBot && <div className="sakura-bot-icon">🤖</div>}
            <div className={`sakura-bubble ${msg.isBot ? 'bot-bubble' : 'user-bubble'}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Hiệu ứng gõ chữ */}
        {isTyping && (
          <div className="sakura-message-row bot">
            <div className="sakura-bot-icon">🤖</div>
            <div className="sakura-typing-bubble">
              <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
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
          placeholder="Nhập lời muốn nói với SakuraBot..."
          className="sakura-input"
        />
        <button type="submit" className="sakura-send-button">
          Gửi 💖
        </button>
      </form>
    </div>
  );
}

export default App;