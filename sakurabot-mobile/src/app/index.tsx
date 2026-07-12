// src/app/index.tsx

import React, { useRef } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { styles, markdownStyles } from "./styles";
import { useChatLogic, botProfiles, Message } from "./useChatLogic";

export default function IndexScreen() {
  // Lấy toàn bộ logic từ Custom Hook
  const {
    currentBot,
    setCurrentBot,
    chatHistories,
    inputText,
    setInputText,
    isTyping,
    handleSendMessage,
  } = useChatLogic();

  const flatListRef = useRef<FlatList>(null);
  const activeProfile = botProfiles[currentBot];
  const currentMessages = chatHistories[currentBot];

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[styles.messageRow, item.isBot ? styles.botRow : styles.userRow]}
    >
      {item.isBot && <Text style={styles.botIcon}>{activeProfile.avatar}</Text>}
      <View
        style={[
          styles.bubble,
          item.isBot ? styles.botBubble : styles.userBubble,
        ]}
      >
        {item.isBot ? (
          <Markdown style={markdownStyles}>{item.text}</Markdown>
        ) : (
          <Text style={styles.messageText}>{item.text}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 20 }}>{activeProfile.avatar}</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>{activeProfile.name}</Text>
          <Text style={styles.headerStatus}>• {activeProfile.status}</Text>
        </View>
      </View>

      {/* 2. Thanh Chọn Bot */}
      <View style={styles.botSelector}>
        {(Object.keys(botProfiles) as Array<keyof typeof botProfiles>).map(
          (key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.botButton,
                currentBot === key && styles.botButtonActive,
              ]}
              onPress={() => setCurrentBot(key)}
            >
              <Text
                style={[
                  styles.botButtonText,
                  currentBot === key && styles.botButtonTextActive,
                ]}
              >
                {botProfiles[key].avatar} {botProfiles[key].name.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      {/* 3. Vùng Chat */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={currentMessages}
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
            <Text style={styles.botIcon}>{activeProfile.avatar}</Text>
            <View style={[styles.bubble, styles.botBubble]}>
              <Text>Đang gõ...</Text>
            </View>
          </View>
        )}

        {/* 4. Vùng Nhập Liệu */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Hỏi ${activeProfile.name}...`}
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
