// src/app/styles.ts
import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
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

  // Nút chọn Bot
  botSelector: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 10,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderColor: "#FFE4E1",
  },
  botButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  botButtonActive: {
    backgroundColor: "#FFB6C1",
  },
  botButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 13,
  },
  botButtonTextActive: {
    color: "#FFF",
  },

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

// Thêm đoạn này vào DƯỚI CÙNG của file styles.ts
export const markdownStyles = {
  body: {
    fontSize: 15,
    color: "#333",
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  },
  strong: {
    fontWeight: "bold",
    color: "#D81B60", // Màu hồng đậm nhấn nhá cho chữ in đậm
  },
  em: {
    fontStyle: "italic",
  },
  code_inline: {
    backgroundColor: "#FFE4E1",
    padding: 4,
    borderRadius: 4,
    color: "#D81B60",
  },
  bullet_list: {
    marginTop: 4,
    marginBottom: 4,
  },
} as any;
