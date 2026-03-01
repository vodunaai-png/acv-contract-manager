# Task: ACV Contract Manager App

## Mục tiêu / Objective
Khởi chạy và quản lý ứng dụng quản lý hợp đồng ACV. Đảm bảo ứng dụng hoạt động ổn định và các tính năng được hoàn thiện theo yêu cầu.

## Trạng thái hiện tại / Current Status
- [x] Khám phá mã nguồn dự án.
- [ ] Thiết lập môi trường chạy ứng dụng.
- [ ] Kiểm tra lỗi runtime và console log.
- [ ] Hoàn thiện các tính năng còn tồn đọng (Edit/Delete, Proxy API, v.v.).

## Công việc cần làm / Pending Tasks
- [ ] Chạy local server để phục vụ file tĩnh.
- [ ] Mở ứng dụng trong trình duyệt.
- [ ] Xác minh kết nối với Apps Script API.
- [ ] Thực hiện các Tasks trong `.antigravity_session.json`:
    - [ ] Thêm chức năng Sửa/Xóa hợp đồng (Edit/Delete).
    - [ ] Chuyển các cuộc gọi Gemini API qua Apps Script để bảo mật.
    - [ ] Thêm biểu đồ Dashboard (Chart.js).
    - [ ] Tối ưu giao diện mobile.
    - [ ] Refactor CSS inline.
    - [ ] Thêm phân trang (Pagination).
    - [ ] Thêm bộ lọc khoảng ngày (Date range filter).

## Agent Skill Proposal: Contract Management App Launcher & Debugger
- **Capabilities**: 
    - Quản lý web server local để phục vụ file tĩnh.
    - Tương tác với ứng dụng qua browser subagent để kiểm tra tính năng.
    - Giám sát console logs để phát hiện lỗi khi khởi chạy.
    - Xác minh tích hợp Google Apps Script.
