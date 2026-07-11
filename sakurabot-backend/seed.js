require("dotenv").config();
const { ChromaClient } = require("chromadb");

// Kết nối với server Chroma vừa bật ở Bước 1
const chroma = new ChromaClient({ path: "http://localhost:8000" });

async function seedData() {
  console.log("🌸 Đang kết nối với cơ sở dữ liệu Vector (ChromaDB)...");

  // 1. Tạo một ngăn chứa dữ liệu (Collection)
  // getOrCreateCollection đảm bảo nếu chưa có thì tạo mới, có rồi thì dùng tiếp
  const collection = await chroma.getOrCreateCollection({
    name: "sakura_knowledge",
  });

  // 2. CHUẨN BỊ TÀI LIỆU (Tất tần tật những gì bạn muốn bot biết)
  // Ở hệ thống thực tế, phần này sẽ đọc từ file PDF, Word, hoặc cào từ Website.
  // Ở đây ta dùng mảng text để demo.
  const documents = [
    "Người sáng lập và phát triển hệ thống SakuraBot là Vũ Trí Dũng, sinh viên năm 3 chuyên ngành Kỹ thuật Phần mềm tại UTH (Đại học GTVT TP.HCM). Định hướng nghề nghiệp chính là Mobile Developer.",
    "Một trong những dự án cá nhân nổi bật của hệ thống là Student Life Manager - ứng dụng theo dõi thói quen cho sinh viên. Hệ thống này sử dụng SharedPreferences để lưu trữ dữ liệu tạm thời nhằm tối ưu hóa quá trình phát triển thay vì dùng DataStore.",
    "Dự án DuckTrack là ứng dụng quản lý thời gian sử dụng kỹ thuật game hóa (gamification), bao gồm các tính năng như kỹ thuật Pomodoro và trồng cây ảo để tăng hiệu suất làm việc.",
    "Sở thích ăn uống nội bộ: Thường xuyên ăn Bánh Mì Hà Nội và hay mua sắm đồ ăn nhanh tại các chuỗi cửa hàng tiện lợi như GS25 và Ministop.",
  ];

  // Tạo ID tự động cho từng đoạn tài liệu
  const ids = documents.map((_, index) => `doc_${index + 1}`);

  console.log("📦 Đang mã hóa tài liệu thành Vector và nhét vào ChromaDB...");

  // 3. Nhét toàn bộ vào Database (Upsert: Có thì cập nhật, chưa có thì thêm mới)
  await collection.upsert({
    ids: ids,
    documents: documents,
  });

  console.log("✅ Hoàn tất! Đã nạp toàn bộ tri thức vào bộ não RAG.");
}

// Chạy hàm
seedData().catch(console.error);
