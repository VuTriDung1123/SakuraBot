const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Đặt đường dẫn tới thư mục chứa dataset
const datasetFolder = path.join(__dirname, "my_local_datasets");
const outputFile = path.join(__dirname, "massive_intents.json");

// Danh sách các file muốn cho bot "ăn" trọn
const targetFiles = [
  "AlekseyKorshuk_persona-chat_train.jsonl",
  "Ahren09_empathetic_dialogues_train.jsonl",
  "databricks_databricks-dolly-15k_train.jsonl",
  "Brendan_multiwoz_turns_v22_train.jsonl",
  "mutiyama_alt_train.jsonl",
];

async function processMassiveData() {
  console.log("🔥 KHỞI ĐỘNG SIÊU MÁY ĐÀO DỮ LIỆU (CHẾ ĐỘ KHÔNG GIỚI HẠN)...");
  console.log(
    "⚠️ Cảnh báo: Sẽ mất khá nhiều thời gian để quét hàng triệu dòng dữ liệu.",
  );

  const writeStream = fs.createWriteStream(outputFile, { flags: "w" });
  writeStream.write('{\n  "intents": [\n');

  let isFirstIntent = true;
  let globalTagCounter = 1;

  for (const fileName of targetFiles) {
    const filePath = path.join(datasetFolder, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Bỏ qua (không tìm thấy): ${fileName}`);
      continue;
    }

    console.log(`\n⏳ Đang càn quét TOÀN BỘ file: ${fileName}`);
    const readStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    let lineCount = 0;
    let addedCount = 0;

    for await (const line of rl) {
      // ĐÃ GỠ BỎ HOÀN TOÀN LỆNH BREAK GIỚI HẠN TẠI ĐÂY!

      try {
        const data = JSON.parse(line);
        let pattern = "";
        let response = "";

        // Nhận diện cấu trúc Dolly-15k
        if (data.instruction && data.response) {
          pattern = data.instruction;
          response = data.response;
        }
        // Nhận diện cấu trúc Empathetic/Persona
        else if (data.prompt) {
          pattern = data.prompt;
          response = data.utterance || "Mình hiểu cảm giác của bạn lúc này.";
        }
        // Nhận diện cấu trúc MultiWOZ (Dữ liệu hội thoại tác vụ)
        else if (data.dialogue && data.dialogue.length > 0) {
          pattern = data.dialogue[0].text;
          response =
            data.dialogue[1]?.text || "Hệ thống đã ghi nhận thông tin của bạn.";
        }
        // Nhận diện cấu trúc ALT (Việt - Nhật)
        else if (
          data.translation &&
          data.translation.vi &&
          data.translation.ja
        ) {
          pattern = data.translation.vi;
          response = `(Bản dịch tiếng Nhật): ${data.translation.ja}`;
        }

        if (pattern && response) {
          const intent = {
            tag: `massive_tag_${globalTagCounter}`,
            patterns: [pattern],
            responses: [response],
          };

          const prefix = isFirstIntent ? "" : ",\n";
          writeStream.write(prefix + "    " + JSON.stringify(intent));
          isFirstIntent = false;
          globalTagCounter++;
          addedCount++;
        }
      } catch (e) {
        // Bỏ qua dòng lỗi định dạng (rất ít khi xảy ra)
      }
      lineCount++;

      // Log tiến độ cho đỡ sốt ruột
      if (lineCount % 20000 === 0) {
        console.log(`   ...Đã quét ${lineCount} dòng...`);
      }
    }
    console.log(
      `✅ Đã VÉT SẠCH ${lineCount} dòng từ ${fileName}. Lấy được ${addedCount} mẫu câu.`,
    );
  }

  writeStream.write("\n  ]\n}\n");
  writeStream.end();

  console.log(
    `\n🎉 HOÀN TẤT! Đã đóng gói tổng cộng ${globalTagCounter - 1} bộ ý định vào file massive_intents.json.`,
  );
  console.log(`📦 Kích thước file này có thể lên tới hàng trăm MB!`);
}

processMassiveData();
