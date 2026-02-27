const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update header actions buttons (Make sure to replace exactly based on what we saw earlier)
html = html.replace(
    '<button class="btn btn-primary" id="btn-save-form"><i class="ph ph-floppy-disk"></i> Lưu Hệ\r\n                            Thống</button>',
    '<button type="button" class="btn btn-primary" id="btn-new-contract" style="display:none;background:var(--emerald-500);"><i class="ph ph-plus-circle"></i> + Lấy số cho hợp đồng mới</button>\r\n                        <button type="button" class="btn btn-primary" id="btn-save-form"><i class="ph ph-floppy-disk"></i> Tôi đã kiểm tra, lưu thông tin và lấy số HĐ</button>'
);

// Fallback search string if line breaks differ
html = html.replace(
    '<button class="btn btn-primary" id="btn-save-form"><i class="ph ph-floppy-disk"></i> Lưu Hệ\n                            Thống</button>',
    '<button type="button" class="btn btn-primary" id="btn-new-contract" style="display:none;background:var(--emerald-500);"><i class="ph ph-plus-circle"></i> + Lấy số cho hợp đồng mới</button>\n                        <button type="button" class="btn btn-primary" id="btn-save-form"><i class="ph ph-floppy-disk"></i> Tôi đã kiểm tra, lưu thông tin và lấy số HĐ</button>'
);

// Add type="button" to buttons
html = html.replace('<button class="btn btn-secondary" id="btn-clear-form"><i class="ph ph-trash"></i> Làm Mới', '<button type="button" class="btn btn-secondary" id="btn-clear-form"><i class="ph ph-trash"></i> Làm Mới');
html = html.replace('<button class="btn btn-primary mt-24" id="btn-browse-file">', '<button type="button" class="btn btn-primary mt-24" id="btn-browse-file">');

// 2. Extract number-builder-box
const numberBuilderStart = html.indexOf('<!-- Auto Number Builder -->');
const numberBuilderEnd = html.indexOf('<!-- Contract Summary from AI -->');

if (numberBuilderStart > -1 && numberBuilderEnd > -1) {
    const numberBuilderBlock = html.substring(numberBuilderStart, numberBuilderEnd);

    // Remove from old location
    html = html.replace(numberBuilderBlock, '');
    html = html.replace('1. Thông Tin Chung & Đặt Số HĐ', '1. Thông Tin Chung');
    html = html.replace('1. Thông Tin Chung &amp; Đặt Số HĐ', '1. Thông Tin Chung');

    // 3. Move it above AI Extraction Zone
    const aiExtractionStart = html.indexOf('<!-- 1. AI EXTRACTION ZONE -->');
    if (aiExtractionStart > -1) {
        html = html.substring(0, aiExtractionStart) +
            '<form id="contract-form" class="smart-form">\n\n' +
            '<!-- CẤU TRÚC SỐ HỢP ĐỒNG (Moved Top) -->\n' +
            '<div class="form-section glass-panel mb-24">\n' +
            '    <h3 class="section-title"><i class="ph ph-hash"></i> Cấu Trúc Số Hợp Đồng Tự Động</h3>\n' +
            numberBuilderBlock + '\n</div>\n\n' +
            html.substring(aiExtractionStart);
    }
}

// Remove the old <form> opening tag
const oldFormTag1 = '<form id="contract-form" class="smart-form">\r\n\r\n                    <!-- SECTION 1: THÔNG TIN CHUNG -->';
const oldFormTag2 = '<form id="contract-form" class="smart-form">\n\n                    <!-- SECTION 1: THÔNG TIN CHUNG -->';

html = html.replace(oldFormTag1, '<!-- SECTION 1: THÔNG TIN CHUNG -->');
html = html.replace(oldFormTag2, '<!-- SECTION 1: THÔNG TIN CHUNG -->');

fs.writeFileSync('index.html', html);
console.log('Update Script Finished Successfully');
