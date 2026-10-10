# MathQuiz Pro - Hệ Thống Tạo Đề & Thi Trắc Nghiệm Toán Học Online

Hệ thống web hiện đại giúp Giáo viên tạo đề thi trắc nghiệm Toán học trực tuyến từ file PDF, giữ nguyên hình vẽ hình học / đồ thị bằng công cụ cắt ảnh trực quan, hiển thị công thức Toán học chuẩn $\LaTeX$ (KaTeX), và tự động đồng bộ kết quả vào Google Sheets theo thời gian thực.

---

## 🌟 Các Tính Năng Nổi Bật

### 1. Dành Cho Giáo Viên (Quản Trị Viên)
- **Tạo Đề Từ File PDF Bằng AI (Google Studio Gemini API)**: Tự động trích xuất đề thi, phân tách 4 phương án A, B, C, D, nhận diện công thức toán học sang chuẩn $\LaTeX$, lấy đáp án và lời giải chi tiết.
- **Công Cụ Cắt & Gán Ảnh Trực Quan (Snipping Tool)**: Xem file PDF song song, kéo chuột khoanh vùng hình học/đồ thị trên trang PDF để cắt ảnh và gán thẳng vào câu hỏi.
- **Chỉnh Sửa Toàn Diện**: Sửa nội dung câu hỏi, đổi đáp án đúng, thêm/xóa câu hỏi, xem trước công thức KaTeX theo thời gian thực.
- **Cấu Hình Phòng Thi**:
  - Hẹn giờ làm bài (ví dụ: 45 phút, 90 phút).
  - Hạn chót nộp bài (ngày, giờ hết hạn).
  - Tính năng **Đảo đề**: Tự động đảo thứ tự câu hỏi và thứ tự đáp án (A, B, C, D).
  - Tùy chọn cho phép học sinh xem điểm ngay và xem lời giải chi tiết sau khi nộp.
  - Phân quyền giao đề cho từng lớp (12A1, 12A2...) hoặc toàn bộ học sinh.
- **Quản Lý Học Sinh**: Cấp Mã học sinh và Mật khẩu, nhập nhanh danh sách học sinh từ Excel.
- **Bảng Điểm & Đồng Bộ Google Sheets**: Tự động gửi kết quả làm bài của học sinh về Google Sheet qua Apps Script Webhook; xuất file CSV/Excel.

### 2. Dành Cho Học Sinh
- **Đăng Nhập Riêng Biệt**: Đăng nhập bằng Mã học sinh và Mật khẩu do giáo viên cấp.
- **Phòng Thi Trực Tuyến**:
  - Đồng hồ đếm ngược thông minh (cảnh báo khi dưới 5 phút, tự động nộp bài khi hết giờ).
  - Hiển thị công thức Toán học $\LaTeX$ sắc nét và hình vẽ đính kèm.
  - Bảng điều hướng câu hỏi: Đã làm, Chưa làm, Cắm cờ xem lại.
- **Chấm Điểm Tức Thì**: Biết điểm số ngay sau khi nộp, hiệu ứng chúc mừng (confetti), xem lại bài làm và lời giải chi tiết.

---

## 🚀 Hướng Dẫn Đưa Lên GitHub & Triển Khai Online

### Bước 1: Đưa Dự Án Lên GitHub
1. Truy cập [GitHub](https://github.com) và tạo một repository mới (ví dụ: `math-quiz-portal`).
2. Mở Terminal tại thư mục này và chạy các lệnh:
   ```bash
   git remote add origin https://github.com/<TÊN_TAI_KHOAN_CỦA_BẠN>/math-quiz-portal.git
   git branch -M main
   git push -u origin main
   ```

### Bước 2: Triển Khai Web Miễn Phí (Vercel)
1. Đăng nhập vào [Vercel](https://vercel.com) bằng tài khoản GitHub.
2. Chọn **"Add New Project"** -> Chọn repository `math-quiz-portal`.
3. Nhấn **"Deploy"**. Vercel sẽ tự động build và cấp cho bạn một đường link web online (ví dụ: `https://math-quiz-portal.vercel.app`) để học sinh và giáo viên truy cập bất kỳ đâu!

---

## 🔑 Tài Khoản Đăng Nhập Mặc Định

| Vai trò | Thông tin đăng nhập | Ghi chú |
| :--- | :--- | :--- |
| **Giáo Viên** | Mật khẩu: `admin` | Có thể đổi trong mục **Cài đặt** |
| **Học Sinh 1** | Mã: `HS1201` / Mật khẩu: `123` | Lớp 12A1 (Nguyễn Văn An) |
| **Học Sinh 2** | Mã: `HS1202` / Mật khẩu: `123` | Lớp 12A1 (Trần Thị Thảo) |
| **Học Sinh 3** | Mã: `HS1203` / Mật khẩu: `123` | Lớp 12A2 (Lê Tuấn Hùng) |

---

## 📋 Cài Đặt Kết Nối Google Sheets
1. Mở file **Google Sheet** của bạn -> Vào menu **Tiện ích mở rộng** (Extensions) -> **Apps Script**.
2. Dán đoạn mã sau vào:
```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Thời Gian Nộp", "Mã Học Sinh", "Họ Và Tên", "Lớp", 
        "Tên Bài Thi", "Điểm Số", "Số Câu Đúng", "Tổng Số Câu", 
        "Thời Gian Làm", "Chi Tiết Đáp Án"
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#e0f2fe");
    }
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("vi-VN"),
      data.studentId || "",
      data.studentName || "",
      data.studentClass || "",
      data.examTitle || "",
      data.score !== undefined ? data.score : "",
      data.correctCount !== undefined ? data.correctCount : "",
      data.totalCount !== undefined ? data.totalCount : "",
      data.timeSpent || "",
      data.answersDetail || ""
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```
3. Nhấn **Triển khai** (Deploy) -> **Tùy chọn triển khai mới** (New deployment) -> Chọn **Ứng dụng web** (Web app).
4. Mục **Ai có quyền truy cập** (Who has access) chọn: **Bất kỳ ai** (Anyone) -> Nhấn **Triển khai**.
5. Copy URL nhận được và dán vào mục **Cài đặt** trên web!
