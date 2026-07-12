require("dotenv").config();
const { ChromaClient } = require("chromadb");

const chroma = new ChromaClient({ path: "http://localhost:8000" });

async function seedData() {
  console.log("🌸 Đang kết nối với cơ sở dữ liệu Vector (ChromaDB)...");

  const collection = await chroma.getOrCreateCollection({
    name: "sakura_knowledge",
  });

  // KHO TÀNG TRI THỨC ĐƯỢC MỞ RỘNG (GHI CHÚ CHI TIẾT TỪ A-Z)
  const documents = [
    "1. THÔNG TIN CÁ NHÂN SÁNG LẬP VIÊN: Người sáng lập hệ thống SakuraBot là Vũ Trí Dũng (sinh ngày 23/11/2005). Hiện đang là sinh viên năm 3 chuyên ngành Công nghệ Phần mềm tại trường UTH (Đại học GTVT TP.HCM) với thành tích học tập GPA đạt 3.3/4.0.",
    "2. ĐỊNH HƯỚNG NGHỀ NGHIỆP: Định hướng phát triển chuyên sâu là một Developer mảng Mobile, Game",
    "3. KỸ NĂNG LẬP TRÌNH DI ĐỘNG: Thành thạo việc phát triển ứng dụng bằng ngôn ngữ Kotlin cho hệ điều hành Android và sử dụng Dart cho framework Flutter.",
    "4. KỸ NĂNG QUẢN TRỊ MẠNG & CLOUD: Có nền tảng kiến thức vững chắc về mạng máy tính, đặc biệt là các giao thức mạng Cisco (bao gồm STP, VLAN, OSPF, kiến trúc SD-WAN) và có kinh nghiệm thực hành lab trên Google Cloud Platform (GCP). Khi làm báo cáo mô phỏng SD-WAN bằng Cisco Packet Tracer, quy chuẩn định dạng luôn bắt buộc tiêu đề phải bắt đầu từ phần 'Lời mở đầu'.",
    "5. DỰ ÁN 'STUDENT LIFE MANAGER': Đây là một dự án ứng dụng cá nhân dùng để theo dõi thói quen (habit-tracking) dành cho sinh viên. Đặc điểm kỹ thuật nổi bật của dự án này là quyết định sử dụng SharedPreferences để lưu trữ dữ liệu tạm thời (thay vì dùng DataStore) nhằm tối ưu hóa sự đơn giản và tốc độ trong giai đoạn đầu phát triển.",
    "6. DỰ ÁN 'DUCKTRACK': Một ứng dụng quản lý thời gian nhóm, ứng dụng triệt để kỹ thuật game hóa (gamification). Ứng dụng kết hợp đồng hồ đếm ngược Pomodoro với tính năng 'trồng cây ảo' để tạo động lực và tăng hiệu suất làm việc.",
    "7. ĐỘI NGŨ PHÁT TRIỂN & CỘNG SỰ: Các dự án học thuật thường được thực hiện trong môi trường làm việc nhóm sôi nổi với các cộng sự cốt cán",
    "8. DỰ ÁN WEB TỔNG HỢP: Đã tự tay thiết kế và triển khai một trang web portfolio cá nhân hỗ trợ đa ngôn ngữ (Việt, Anh, Nhật) chạy trên nền tảng Vercel. Có mục tiêu học tập tiếng Anh (luyện thi IELTS) và thuật ngữ IT tiếng Nhật.",
    "9. PHONG CÁCH THIẾT KẾ (UI/UX): Cực kỳ ưa chuộng phong cách thiết kế mang âm hưởng Anime, cụ thể là thẩm mỹ 'Kawaii' hoặc 'Sakura' với bảng màu hồng phấn (Pink) làm chủ đạo để mang lại cảm giác dễ chịu, thân thiện cho người dùng.",
    "10. SỞ THÍCH GIẢI TRÍ & GAMING: Thích chơi Minecraft, thử nghiệm các cơ chế trong Roblox Studio và chơi các tựa game nhịp điệu (rhythm games). Là một người chơi hệ game Gacha với các tựa game yêu thích như Blue Archive, Genshin Impact. Thường xuyên theo dõi giải đấu thể thao điện tử Tứ Phương Đại Chiến (Liên Quân Mobile) và chơi GeoGuessr.",
    "11. THÓI QUEN TIÊU DÙNG & ĂN UỐNG: Khi cần nạp năng lượng, thường xuyên ghé mua đồ ăn tại các cửa hàng tiện lợi như GS25, Ministop, hoặc mua Bánh Mì Hà Nội.",
  ];

  const ids = documents.map((_, index) => `doc_${index + 1}`);

  console.log("📦 Đang nhồi toàn bộ kiến thức vào Vector Database...");

  await collection.upsert({
    ids: ids,
    documents: documents,
  });

  console.log("✅ Hoàn tất! SakuraBot giờ đã có một bộ nhớ cực kỳ sâu sắc.");
}

seedData().catch(console.error);
