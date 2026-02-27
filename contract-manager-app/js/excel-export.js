/**
 * Excel Export using SheetJS
 */
const excelExport = {
    init: () => {
        document.getElementById('nav-export').addEventListener('click', (e) => {
            e.preventDefault();
            excelExport.run();
        });
    },

    run: async () => {
        ui.toast('Đang xuất Excel...', 'Hệ thống đang tải toàn bộ dữ liệu...', 'info', 2000);

        try {
            // Lấy toàn bộ data thay vì chỉ data đang filter
            const result = await api.getAll();
            const data = result.contracts;

            if (!data || data.length === 0) {
                ui.toast('Trống', 'Không có dữ liệu để xuất', 'warning');
                return;
            }

            // Map data
            const headers = [
                "Người nhập", "Bộ phận", "Số HĐ", "Ngày ký", "Gói thầu", "Dự án", "Tóm tắt HĐ",
                "Chủ đầu tư - Tên", "CĐT - Đại diện", "CĐT - MST", "CĐT - Số TK", "CĐT - Ngân hàng", "CĐT - GPĐKKD",
                "Nhà thầu - Tên", "NT - Đại diện", "NT - MST", "NT - Số TK", "NT - Ngân hàng", "NT - GPĐKKD",
                "Giá hợp đồng (VND)", "Giá HĐ (Bằng chữ)", "VAT (%)", "Tạm ứng", "Số lần thanh toán",
                "Điều kiện thanh toán", "Hạn quyết toán", "Hạn thanh lý", "Bảo hiểm", "Bảo hành",
                "Thời gian thực hiện HĐ", "Tiến độ thực hiện", "Ghi chú", "File URL"
            ];

            const rows = data.map(c => ({
                "Người nhập": c.userName,
                "Bộ phận": c.userDept,
                "Số HĐ": c.contractNumber,
                "Ngày ký": c.signDate,
                "Gói thầu": c.bidPackage,
                "Dự án": c.projectName,
                "Tóm tắt HĐ": c.contractSummary,
                "Chủ đầu tư - Tên": c.investorName,
                "CĐT - Đại diện": c.investorRep,
                "CĐT - MST": c.investorTax,
                "CĐT - Số TK": c.investorAccountNo,
                "CĐT - Ngân hàng": c.investorBankName,
                "CĐT - GPĐKKD": c.investorBusinessLicense,
                "Nhà thầu - Tên": c.contractorName,
                "NT - Đại diện": c.contractorRep,
                "NT - MST": c.contractorTax,
                "NT - Số TK": c.contractorAccountNo,
                "NT - Ngân hàng": c.contractorBankName,
                "NT - GPĐKKD": c.contractorBusinessLicense,
                "Giá hợp đồng (VND)": c.contractValue,
                "Giá HĐ (Bằng chữ)": c.contractValueText,
                "VAT (%)": c.vatRate,
                "Tạm ứng": c.advancePayment,
                "Số lần thanh toán": c.paymentCount,
                "Điều kiện thanh toán": c.paymentTerms,
                "Hạn quyết toán": c.settlementDeadline,
                "Hạn thanh lý": c.liquidationDeadline,
                "Bảo hiểm": c.insurance,
                "Bảo hành": c.warranty,
                "Thời gian thực hiện HĐ": c.contractDuration,
                "Tiến độ thực hiện": c.executionProgress,
                "Ghi chú": c.notes,
                "File URL": c.fileUrl
            }));

            // Tạo workbook
            const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Contracts");

            // Tải file
            const timestamp = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(workbook, `ACV_Contracts_Export_${timestamp}.xlsx`);

            ui.toast('Thành công', 'Đã tải xuống file Excel', 'success');
        } catch (err) {
            console.error(err);
            ui.toast('Lỗi Xuất File', 'Không thể tạo file Excel lúc này', 'error');
        }
    }
};

window.excelExport = excelExport;
