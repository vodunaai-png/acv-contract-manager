/**
 * Gemini AI Extraction Service
 * Uses Google Gemini REST API (gemini-2.0-flash)
 */
const gemini = {
    /**
     * Common instruction prompt for Gemini
     * Enforcing exact JSON structure 
     */
    _getSystemInstruction: () => {
        return `Bạn là chuyên gia phân tích hợp đồng và đấu thầu theo luật pháp Việt Nam.
Nhiệm vụ: Trích xuất 30 trường dữ liệu giao dịch từ văn bản hợp đồng.
Bắt buộc trả về ĐÚNG ĐỊNH DẠNG JSON sau. BẮT BUỘC chỉ trả về nội dung bên trong {} (raw JSON), không dùng Markdown code block.
QUY TẮC QUAN TRỌNG:
- Với trường số (contractValue, vatRate, paymentCount): Nếu không tìm thấy thì để null.
- Với TẤT CẢ các trường text khác: Nếu không tìm thấy thông tin thì BẮT BUỘC ghi "Không có thông tin". TUYỆT ĐỐI KHÔNG ĐỂ null hay chuỗi rỗng cho trường text.

{
    "signDate": "YYYY-MM-DD",
    "bidPackage": "Tên gói thầu",
    "projectName": "Tên dự án hoặc công trình",
    "contractSummary": "Liệt kê 10 mục thông tin chính dạng danh sách có đánh số, mỗi mục trên 1 dòng:\n1. Loại HĐ: [...]\n2. Số lượng điều khoản: [...]\n3. Bảo lãnh thực hiện HĐ: [...]\n4. Bảo lãnh tạm ứng: [...]\n5. Bảo hiểm: [...]\n6. Bảo hành: [...]\n7. Thời gian thực hiện HĐ: [...]\n8. Thời gian thực hiện gói thầu: [...]\n9. Nguồn vốn: [...]\n10. Điểm chú ý khác: [...]",
    "investorName": "Tên Chủ đầu tư (Bên A)",
    "investorRep": "Người đại diện (chỉ Tên)",
    "investorTax": "Mã số thuế Chủ đầu tư",
    "investorAccountNo": "Số tài khoản CĐT",
    "investorBankName": "Tên ngân hàng CĐT",
    "investorBusinessLicense": "Số GPĐKKD CĐT",
    "contractorName": "Tên Nhà thầu (Bên B)",
    "contractorRep": "Người đại diện Nhà thầu",
    "contractorTax": "Mã số thuế Nhà thầu",
    "contractorAccountNo": "Số tài khoản Nhà thầu",
    "contractorBankName": "Tên ngân hàng Nhà thầu",
    "contractorBusinessLicense": "Số GPĐKKD Nhà thầu",
    "contractValue": "Tổng giá trị hợp đồng BẰNG SỐ (chỉ số nguyên, ví dụ: 1200000000)",
    "contractValueText": "Giá trị hợp đồng BẰNG CHỮ",
    "vatRate": "Thuế suất VAT BẰNG SỐ (ví dụ 8 hoặc 10)",
    "advancePayment": "Thông tin tạm ứng (ví dụ: 30% giá trị hợp đồng)",
    "paymentCount": "Số lần thanh toán BẰNG SỐ",
    "paymentTerms": "Tóm tắt ngắn gọn các hình thức và đợt thanh toán",
    "settlementDeadline": "Thời hạn quyết toán",
    "liquidationDeadline": "Thời hạn thanh lý HĐ",
    "notes": "Các ghi chú ngắn quan trọng khác. Nếu contractValue (số) và contractValueText (chữ) không khớp nhau, ghi cảnh báo ở đây",
    "insurance": "Tổng hợp chi tiết các quy định về bảo hiểm trong hợp đồng",
    "warranty": "Tổng hợp chi tiết thời hạn và điều kiện bảo hành",
    "contractDuration": "Thời gian thực hiện hợp đồng (ví dụ: 60 ngày)",
    "executionProgress": "Tổng hợp chi tiết tất cả thông tin về các mốc thời gian, tiến độ thực hiện hợp đồng và gói thầu, bao gồm các giai đoạn, điều kiện nghiệm thu và các mốc quan trọng"
}`;
    },

    /**
     * Resilient Fetch with Exponential Backoff
     */
    _fetchWithRetry: async (url, payload, maxRetries = 3) => {
        let delayMs = 2000;
        for (let i = 0; i < maxRetries; i++) {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                return await res.json();
            }

            const errText = await res.text();
            let errObj = {};
            try { errObj = JSON.parse(errText); } catch (e) { }

            // Check for overload (503) or rate limit (429)
            if (res.status === 503 || res.status === 429) {
                if (i < maxRetries - 1) {
                    console.warn(`Gemini API ${res.status}.Retrying in ${delayMs / 1000}s...`);
                    ui.toast('Máy chủ AI Đang Quá Tải', `Đang kết nối lại sau ${delayMs / 1000} giây, xin chờ... (Lần thử ${i + 1}/${maxRetries - 1})`, 'info', delayMs);
                    await new Promise(r => setTimeout(r, delayMs));
                    delayMs *= 2; // Exponential backoff
                    continue;
                } else {
                    throw new Error(`Máy chủ Google đang bảo trì hoặc quá tải(${res.status}).Vui lòng nhập dữ liệu thủ công hoặc thử lại sau 15 phút.`);
                }
            } else {
                // Formatting other errors cleanly
                const msg = errObj.error?.message || errText;
                throw new Error(`Google API từ chối kết nối(Mã lỗi ${res.status}): ${msg} `);
            }
        }
    },

    /**
     * Send Plain Text to Gemini
     */
    _extractFromText: async (text) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

        const payload = {
            systemInstruction: {
                parts: [{ text: gemini._getSystemInstruction() }]
            },
            contents: [{
                role: "user",
                parts: [{ text: `Văn bản hợp đồng:\n${text}` }]
            }],
            generationConfig: {
                temperature: 0.1, // Low temp for extraction consistency
                responseMimeType: "application/json"
            }
        };

        const data = await gemini._fetchWithRetry(url, payload);
        let jsonStr = data.candidates[0].content.parts[0].text;
        jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return gemini._normalizeExtractedData(JSON.parse(jsonStr));
    },

    /**
     * Send Base64 Image/PDF to Gemini Vision
     */
    _extractFromInlineData: async (base64, mimeType) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

        const payload = {
            systemInstruction: {
                parts: [{ text: gemini._getSystemInstruction() }]
            },
            contents: [{
                role: "user",
                parts: [
                    {
                        inlineData: {
                            data: base64,
                            mimeType: mimeType
                        }
                    },
                    { text: "Hãy đọc văn bản trên và trích xuất thành tệp JSON." }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        };

        const data = await gemini._fetchWithRetry(url, payload);
        let jsonStr = data.candidates[0].content.parts[0].text;
        jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return gemini._normalizeExtractedData(JSON.parse(jsonStr));
    },

    /**
     * Post-process: Ensure all text fields have 'Không có thông tin' instead of null
     */
    _normalizeExtractedData: (data) => {
        const numericFields = ['contractValue', 'vatRate', 'paymentCount'];
        for (const [key, val] of Object.entries(data)) {
            if (numericFields.includes(key)) continue;
            if (val === null || val === '' || String(val).trim() === '') {
                data[key] = 'Không có thông tin';
            }
        }
        return data;
    },

    /**
     * Main Entry: Analyze File (orchestrates text or vision model)
     */
    extractFile: async (file) => {
        try {
            if (file.name.endsWith('.docx')) {
                // Read via mammoth
                const text = await fileManager.readDocxText(file);
                // Chunk text if it's too huge, but usually Gemini flash limits are massive (1M tokens)
                return await gemini._extractFromText(text);

            } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                // Direct vision API
                const { base64, mimeType } = await fileManager.toBase64(file);
                return await gemini._extractFromInlineData(base64, mimeType);

            } else {
                throw new Error("Định dạng file không được hỗ trợ để AI phân tích. Chỉ chấp nhận .docx, .pdf, ảnh.");
            }
        } catch (error) {
            console.error('Gemini extraction failed:', error);
            ui.toast('Lỗi Trích Xuất', error.message || 'AI phân tích thất bại, bạn vui lòng nhập tay.', 'error', 10000);
            return null; // Return null so form can just open empty
        }
    },

    /**
     * Simple Confidence Scorer based on completion percentage for styling highlights
     */
    getConfidenceHints: (extractedJson) => {
        const hints = {};
        for (const [key, val] of Object.entries(extractedJson)) {
            if (val === null || val === "" || String(val).trim() === "" || val === "Không có thông tin") {
                hints[key] = "low"; // Red
            } else if (['accountNo', 'bankName', 'advancePayment', 'paymentTerms', 'duration', 'value'].some(k => key.toLowerCase().includes(k.toLowerCase()))) {
                hints[key] = "med"; // Yellow (always verify financial terms)
            } else {
                hints[key] = "high"; // Green
            }
        }
        return hints;
    }
};

window.gemini = gemini;
