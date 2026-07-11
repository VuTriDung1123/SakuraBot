import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

export default function IndexScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem("@sakurabot_history");
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([
          {
            id: Date.now().toString(),
            text: "Kon'nichiwa! SakuraBot sẵn sàng giúp đỡ bạn nè (✿◠‿◠) 🌸",
            isBot: true,
          },
        ]);
      }
    } catch (e) {
      console.error("Lỗi tải lịch sử:", e);
    }
  };

  const saveChatHistory = async (msgs: Message[]) => {
    try {
      if (msgs.length > 0) {
        await AsyncStorage.setItem("@sakurabot_history", JSON.stringify(msgs));
      }
    } catch (e) {
      console.error("Lỗi lưu lịch sử:", e);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Nhớ thay đổi IP này thành IP máy tính của bạn nếu chạy trên điện thoại thật
      // Ví dụ: http://192.168.1.X:3000/api/chat
      const response = await fetch("http://192.168.1.6:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await response.json();

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: data.response,
            isBot: true,
          },
        ]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "Hic, kết nối mạng có vấn đề kuro~ (ಥ﹏ಥ)",
          isBot: true,
        },
      ]);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[styles.messageRow, item.isBot ? styles.botRow : styles.userRow]}
    >
      {item.isBot && <Text style={styles.botIcon}>🤖</Text>}
      <View
        style={[
          styles.bubble,
          item.isBot ? styles.botBubble : styles.userBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 20 }}>🌸</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>SakuraBot</Text>
          <Text style={styles.headerStatus}>• Đang hoạt động</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {isTyping && (
          <View
            style={[
              styles.messageRow,
              styles.botRow,
              { paddingHorizontal: 15 },
            ]}
          >
            <Text style={styles.botIcon}>🤖</Text>
            <View style={[styles.bubble, styles.botBubble]}>
              <Text>Đang gõ...</Text>
            </View>
          </View>
        )}

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập lời muốn nói..."
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Gửi 💖</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F5" },
  header: {
    backgroundColor: "#FFB6C1",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 40 : 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  headerStatus: { color: "#FFF0F5", fontSize: 12 },
  chatArea: { flex: 1 },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    maxWidth: "85%",
  },
  botRow: { alignSelf: "flex-start" },
  userRow: { alignSelf: "flex-end", justifyContent: "flex-end" },
  botIcon: { fontSize: 16, marginRight: 8, marginBottom: 4 },
  bubble: { padding: 12, borderRadius: 18 },
  botBubble: { backgroundColor: "#FFF0F5", borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: "#FFB6C1", borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, color: "#333" },
  inputArea: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#FFE4E1",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFAF",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#FFC0CB",
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#FFB6C1",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonText: { color: "#FFF", fontWeight: "bold" },
});
