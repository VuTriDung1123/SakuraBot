// src/app/useChatLogic.ts
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

// Cấu hình 3 con bot (giống hệt trên Web)
export const botProfiles = {
  basic: {
    name: "Tự Xây (NLP)",
    avatar: "🤖",
    status: "Xử lý bằng luật tự code",
  },
  hybrid: {
    name: "Sakura (RAG)",
    avatar: "🌸",
    status: "AI Lai + Dữ liệu nội bộ",
  },
  gemini: {
    name: "Đa Năng (API)",
    avatar: "🌌",
    status: "Thuần sức mạnh Gemini",
  },
};

type BotType = "basic" | "hybrid" | "gemini";

export const useChatLogic = () => {
  const [currentBot, setCurrentBot] = useState<BotType>("hybrid");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Bộ nhớ độc lập cho 3 bot
  const [chatHistories, setChatHistories] = useState<
    Record<BotType, Message[]>
  >({
    basic: [
      {
        id: "1",
        text: "Chào bạn! Mình là AI TỰ XÂY. Bạn cần gì?",
        isBot: true,
      },
    ],
    hybrid: [
      {
        id: "2",
        text: "Kon'nichiwa! SakuraBot hệ HYBRID đây! 🌸",
        isBot: true,
      },
    ],
    gemini: [
      {
        id: "3",
        text: "Xin chào! Mình là AI TÍCH HỢP. Mình biết tuốt mọi thứ!",
        isBot: true,
      },
    ],
  });

  // Tải lịch sử từ AsyncStorage khi mở app
  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem("@sakurabot_histories_v2");
        if (saved) setChatHistories(JSON.parse(saved));
      } catch (e) {
        console.error("Lỗi tải lịch sử:", e);
      }
    };
    loadData();
  }, []);

  // Lưu lịch sử mỗi khi chatHistories thay đổi
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          "@sakurabot_histories_v2",
          JSON.stringify(chatHistories),
        );
      } catch (e) {
        console.error("Lỗi lưu lịch sử:", e);
      }
    };
    saveData();
  }, [chatHistories]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
    };

    setChatHistories((prev) => ({
      ...prev,
      [currentBot]: [...prev[currentBot], userMsg],
    }));

    setInputText("");
    setIsTyping(true);

    try {
      // Thay IP của bạn vào đây (VD: 192.168.1.X)
      const response = await fetch("http://192.168.1.6:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, botType: currentBot }),
      });

      const data = await response.json();

      setTimeout(() => {
        setChatHistories((prev) => ({
          ...prev,
          [currentBot]: [
            ...prev[currentBot],
            { id: Date.now().toString(), text: data.response, isBot: true },
          ],
        }));
        setIsTyping(false);
      }, 500);
    } catch (error) {
      setIsTyping(false);
      setChatHistories((prev) => ({
        ...prev,
        [currentBot]: [
          ...prev[currentBot],
          {
            id: Date.now().toString(),
            text: "Mất kết nối server rồi 😭",
            isBot: true,
          },
        ],
      }));
    }
  };

  return {
    currentBot,
    setCurrentBot,
    chatHistories,
    inputText,
    setInputText,
    isTyping,
    handleSendMessage,
  };
};
