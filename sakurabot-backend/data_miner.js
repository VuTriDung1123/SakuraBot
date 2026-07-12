const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Đường dẫn tới file intents hiện tại và file dataset vừa tải
const intentsPath = path.join(__dirname, "intents.json");
const datasetPath = path.join(
  __dirname,
  "my_local_datasets",
  "Ahren09_empathetic_dialogues_train.jsonl",
);

async function mineData() {
  console.log("⛏️ Khởi động Máy đào dữ liệu...");

  // 1. Đọc file intents.json hiện tại
  let intentsData = { intents: [] };
  if (fs.existsSync(intentsPath)) {
    intentsData = JSON.parse(fs.readFileSync(intentsPath, "utf8"));
  }

  // 2. Chuẩn bị một "Giỏ chứa" các câu mệt mỏi/áp lực từ Dataset
  const stressPatterns = new Set();
  const greetingPatterns = new Set();

  if (fs.existsSync(datasetPath)) {
    console.log("📖 Đang đọc tập dữ liệu Empathetic Dialogues...");
    const fileStream = fs.createReadStream(datasetPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineCount = 0;
    for await (const line of rl) {
      if (lineCount > 1000) break; // Chỉ quét 1000 dòng đầu tiên cho nhẹ máy

      try {
        const data = JSON.parse(line);
        // Lọc các ngữ cảnh buồn bã, áp lực hoặc mệt mỏi
        if (
          data.context &&
          ["sad", "tired", "stressed", "anxious"].includes(data.context)
        ) {
          stressPatterns.add(data.prompt);
        }
        // Lọc các câu chào hỏi vui vẻ
        if (
          data.context &&
          ["joyful", "excited", "greeting"].includes(data.context)
        ) {
          greetingPatterns.add(data.prompt);
        }
      } catch (e) {
        // Bỏ qua dòng lỗi
      }
      lineCount++;
    }
  } else {
    console.log("⚠️ Không tìm thấy file dataset, sẽ sử dụng dữ liệu mẫu.");
    stressPatterns.add("Tôi mệt quá");
    stressPatterns.add("Nhiều bài tập quá không biết làm sao");
    stressPatterns.add("Chạy deadline đuối luôn");
  }

  // 3. Đóng gói thành các Intent mới với câu trả lời được cá nhân hóa
  const newIntents = [
    {
      tag: "stress_management",
      patterns: Array.from(stressPatterns).slice(0, 50), // Lấy top 50 câu hay nhất
      responses: [
        "Bạn nghỉ ngơi một chút nhé! Hay là mình bật đếm ngược Pomodoro 25 phút, vừa học vừa trồng cây ảo cho đỡ chán nha 🌸",
        "Đừng ép bản thân quá sức kuro~ Hãy thử chia nhỏ công việc ra và hoàn thành từng chút một. Cây ảo của bạn đang chờ được tưới nước đó!",
        "Mệt mỏi là chuyện bình thường mà. Bạn ra ngoài uống miếng nước, đi dạo một vòng rồi vào set Pomodoro chiến tiếp nhé! (✿◠‿◠)",
      ],
    },
    {
      tag: "app_features",
      patterns: [
        "app này có tính năng gì",
        "giới thiệu ứng dụng",
        "làm sao để tập trung",
        "ứng dụng theo dõi thói quen",
      ],
      responses: [
        "Hệ thống của chúng mình là một ứng dụng quản lý thời gian cực kỳ thú vị! Nó kết hợp kỹ thuật Pomodoro và game hóa (trồng cây ảo) để giúp bạn duy trì thói quen học tập mà không bị nhàm chán đó nha 💖",
        "Ứng dụng giúp bạn theo dõi thói quen mỗi ngày. Bật mí nhỏ là tụi mình ưu tiên tốc độ cực nhanh để bạn lưu trữ dữ liệu tạm thời mà không lo giật lag đâu! 🌸",
      ],
    },
  ];

  // 4. Hợp nhất dữ liệu mới vào file cũ (tránh trùng lặp tag)
  newIntents.forEach((newIntent) => {
    const existingIndex = intentsData.intents.findIndex(
      (i) => i.tag === newIntent.tag,
    );
    if (existingIndex >= 0) {
      // Nối thêm patterns mới vào tag đã có
      intentsData.intents[existingIndex].patterns = [
        ...new Set([
          ...intentsData.intents[existingIndex].patterns,
          ...newIntent.patterns,
        ]),
      ];
    } else {
      intentsData.intents.push(newIntent);
    }
  });

  // 5. Ghi đè lại file intents.json
  fs.writeFileSync(intentsPath, JSON.stringify(intentsData, null, 2), "utf8");
  console.log(
    `✅ Đã bòn rút thành công! File intents.json vừa được bơm thêm ${stressPatterns.size} mẫu câu giao tiếp tự nhiên.`,
  );
}

mineData();
