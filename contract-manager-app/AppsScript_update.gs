/**
 * ACV Contract Manager - Google Apps Script Backend
 * =====================================================
 * ⚠️  HƯỚNG DẪN CẬP NHẬT:
 * 1. Mở file Google Sheet "ACV Contract Database" của bạn
 * 2. Trên menu: Tiện ích mở rộng (Extensions) > Apps Script 
 * 3. Xóa toàn bộ code cũ, paste toàn bộ file này vào
 * 4. Bấm lưu (Ctrl+S)
 * 5. Deploy > Manage Deployments > Edit (✏️) > Version: New version > Deploy
 * =====================================================
 *
 * CẤU TRÚC 34 CỘT GOOGLE SHEET (Khớp với Header Row 1):
 * A:  Timestamp
 * B:  Người nhập
 * C:  Số HĐ
 * D:  Ngày ký
 * E:  Gói thầu
 * F:  Dự án
 * G:  Tóm tắt thông tin
 * H:  Chủ đầu tư - Tên
 * I:  CĐT - Người đại diện
 * J:  CĐT - MST
 * K:  CĐT - Số TK
 * L:  CĐT - Ngân hàng
 * M:  CĐT - GPĐKKD
 * N:  Nhà thầu - Tên
 * O:  NT - Người đại diện
 * P:  NT - MST
 * Q:  NT - Số TK
 * R:  NT - Ngân hàng
 * S:  NT - GPĐKKD
 * T:  Giá trị HĐ (VND)
 * U:  Giá trị HĐ (Bằng chữ)
 * V:  Thuế VAT (%)
 * W:  Tạm ứng
 * X:  Số lần thanh toán
 * Y:  Điều kiện thanh toán
 * Z:  Hạn quyết toán
 * AA: Hạn thanh lý HĐ
 * AB: Bảo hiểm
 * AC: Bảo hành
 * AD: Thời gian thực hiện HĐ
 * AE: Tiến độ thực hiện
 * AF: Ghi chú
 * AG: URL File đính kèm
 * AH: Bộ phận
 */

// ✅ ID của Google Sheet — Đây là fix chính cho lỗi "getSheetByName null"
var SPREADSHEET_ID = "1OAFe64wyLNjCGDyZeIGkd89vOfM024VfZkeKPgpz7kE";
var SHEET_NAME = "Contracts";
var PARTNER_SHEET = "Partners";
var ADMIN_PASS_HASH_CELL = "Config!B1";
var ADMIN_TOKEN_CELL = "Config!B2";

// =====================================================
// HELPER
// =====================================================
function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name || SHEET_NAME);
}

// =====================================================
// AUTO CONTRACT NUMBER (Server-side)
// =====================================================
function getNextAutoNumber(year) {
  var sheet = getSheet(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var yy = year.toString().slice(-2);
  var maxSeq = 0;

  for (var i = 1; i < data.length; i++) {
    var contractNum = String(data[i][2]); // Cột C: Số HĐ
    if (contractNum && contractNum.indexOf(yy) === 0) {
      var seqPartStr = contractNum.substring(2, 5);
      var seqVal = parseInt(seqPartStr, 10);
      if (!isNaN(seqVal) && seqVal > maxSeq) {
        maxSeq = seqVal;
      }
    }
  }

  var nextSeq = maxSeq + 1;
  var seqStr = ("000" + nextSeq).slice(-3);
  return { yearPrefix: yy, seqNumber: seqStr, fullNext: yy + seqStr };
}

// =====================================================
// MAIN ROUTER
// =====================================================
function doGet(e) {
  var action = e.parameter.action || '';
  var result = {};

  try {
    if (action === 'getPublicConfig') {
      result = handleGetPublicConfig();
    } else if (action === 'getAll') {
      result = handleGetAll();
    } else if (action === 'getStats') {
      result = handleGetStats();
    } else if (action === 'getNextNumber') {
      var year = e.parameter.year || new Date().getFullYear();
      result = getNextAutoNumber(parseInt(year));
    } else {
      result = { error: 'Unknown GET action: ' + action };
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = {};
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    if (action === 'save') {
      result = handleSave(payload);
    } else if (action === 'addPartner') {
      result = handleAddPartner(payload);
    } else if (action === 'verifyAdmin') {
      result = handleVerifyAdmin(payload);
    } else if (action === 'saveConfigSettings') {
      result = handleSaveConfigSettings(payload);
    } else if (action === 'saveConfigList') {
      result = handleSaveConfigList(payload);
    } else if (action === 'changePassword') {
      result = handleChangePassword(payload);
    } else if (action === 'getPublicConfig') {
      result = handleGetPublicConfig();
    } else if (action === 'getAll') {
      result = handleGetAll();
    } else if (action === 'getStats') {
      result = handleGetStats();
    } else if (action === 'getNextNumber') {
      var year = payload.year || new Date().getFullYear();
      result = getNextAutoNumber(parseInt(year));
    } else if (action === 'checkDuplicate') {
      result = handleCheckDuplicate(payload.number);
    } else {
      result = { error: 'Unknown POST action: ' + action };
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================
// HANDLE: SAVE CONTRACT
// =====================================================
function handleSave(payload) {
  var sheet = getSheet(SHEET_NAME);
  var d = payload.data || {};
  var u = payload.user || {};
  var fileInfo = payload.file || null;
  var numbering = payload.numbering || {};
  var fileUrl = "";

  // 1. Upload file to Drive if present
  if (fileInfo && fileInfo.base64 && fileInfo.fileName) {
    try {
      var folder = DriveApp.getRootFolder(); // Đổi thành folder cụ thể nếu muốn
      var blob = Utilities.newBlob(
        Utilities.base64Decode(fileInfo.base64),
        fileInfo.mimeType || 'application/octet-stream',
        fileInfo.fileName
      );
      var driveFile = folder.createFile(blob);
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = driveFile.getUrl();
    } catch (uploadErr) {
      console.warn("File upload failed: " + uploadErr.toString());
    }
  }

  // 2. Generate contract number if not set
  var contractNumber = d.contractNumber;
  if (!contractNumber || contractNumber.trim() === "") {
    var y = parseInt(numbering.year) || new Date().getFullYear();
    var numData = getNextAutoNumber(y);
    var dept = numbering.deptCode || "ĐV";
    var inv  = numbering.invCode  || "CĐT";
    var ptn  = numbering.ptnCode  || "NT";
    contractNumber = numData.fullNext + "/" + dept + "/" + inv + "-" + ptn;
  }

  // 3. Build row — 34 columns, STRICT ORDER matching Sheet headers A→AH
  var row = [
    new Date().toISOString(),            // A: Timestamp
    u.name  || "Unknown",                // B: Người nhập
    contractNumber,                      // C: Số HĐ
    d.signDate              || "",       // D: Ngày ký
    d.bidPackage            || "",       // E: Gói thầu
    d.projectName           || "",       // F: Dự án
    d.contractSummary       || "",       // G: Tóm tắt thông tin
    d.investorName          || "",       // H: Chủ đầu tư - Tên
    d.investorRep           || "",       // I: CĐT - Người đại diện
    d.investorTax           || "",       // J: CĐT - MST
    d.investorAccountNo     || "",       // K: CĐT - Số TK
    d.investorBankName      || "",       // L: CĐT - Ngân hàng
    d.investorBusinessLicense || "",     // M: CĐT - GPĐKKD
    d.contractorName        || "",       // N: Nhà thầu - Tên
    d.contractorRep         || "",       // O: NT - Người đại diện
    d.contractorTax         || "",       // P: NT - MST
    d.contractorAccountNo   || "",       // Q: NT - Số TK
    d.contractorBankName    || "",       // R: NT - Ngân hàng
    d.contractorBusinessLicense || "",   // S: NT - GPĐKKD
    d.contractValue         || "",       // T: Giá trị HĐ (VND)
    d.contractValueText     || "",       // U: Giá trị HĐ (Bằng chữ)
    d.vatRate               || "",       // V: Thuế VAT (%)
    d.advancePayment        || "",       // W: Tạm ứng
    d.paymentCount          || "",       // X: Số lần thanh toán
    d.paymentTerms          || "",       // Y: Điều kiện thanh toán
    d.settlementDeadline    || "",       // Z: Hạn quyết toán
    d.liquidationDeadline   || "",       // AA: Hạn thanh lý HĐ
    d.insurance             || "",       // AB: Bảo hiểm
    d.warranty              || "",       // AC: Bảo hành
    d.contractDuration      || "",       // AD: Thời gian thực hiện HĐ
    d.executionProgress     || "",       // AE: Tiến độ thực hiện
    d.notes                 || "",       // AF: Ghi chú
    fileUrl,                             // AG: URL File đính kèm
    u.dept  || ""                        // AH: Bộ phận
  ];

  sheet.appendRow(row);

  return {
    success: true,
    contractNumber: contractNumber,
    message: "Lưu hợp đồng thành công. Số HĐ: " + contractNumber
  };
}

// =====================================================
// HANDLE: GET ALL CONTRACTS
// =====================================================
function handleGetAll() {
  var sheet = getSheet(SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  var contracts = [];

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0]) continue; // bỏ dòng trống
    contracts.push({
      timestamp:              r[0],
      userName:               r[1],
      contractNumber:         r[2],
      signDate:               r[3],
      bidPackage:             r[4],
      projectName:            r[5],
      contractSummary:        r[6],
      investorName:           r[7],
      investorRep:            r[8],
      investorTax:            r[9],
      investorAccountNo:      r[10],
      investorBankName:       r[11],
      investorBusinessLicense:r[12],
      contractorName:         r[13],
      contractorRep:          r[14],
      contractorTax:          r[15],
      contractorAccountNo:    r[16],
      contractorBankName:     r[17],
      contractorBusinessLicense:r[18],
      contractValue:          r[19],
      contractValueText:      r[20],
      vatRate:                r[21],
      advancePayment:         r[22],
      paymentCount:           r[23],
      paymentTerms:           r[24],
      settlementDeadline:     r[25],
      liquidationDeadline:    r[26],
      insurance:              r[27],
      warranty:               r[28],
      contractDuration:       r[29],
      executionProgress:      r[30],
      notes:                  r[31],
      fileUrl:                r[32],
      userDept:               r[33]
    });
  }

  return { contracts: contracts };
}

// =====================================================
// HANDLE: GET STATS
// =====================================================
function handleGetStats() {
  var sheet = getSheet(SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  var total = 0;
  var totalValue = 0;

  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    total++;
    var val = parseFloat(String(data[i][19]).replace(/[^0-9.]/g, ''));
    if (!isNaN(val)) totalValue += val;
  }

  return { total: total, totalValue: totalValue, filesCount: total };
}

// =====================================================
// HANDLE: GET PUBLIC CONFIG
// =====================================================
function handleGetPublicConfig() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var configSheet = ss.getSheetByName("Config");
  if (!configSheet) {
    return { DEPTS: [], INVESTORS: [], PARTNERS: [], GEMINI_API_KEY: '', GEMINI_MODEL: 'gemini-2.0-flash', API_URL: '' };
  }
  var data = configSheet.getDataRange().getValues();
  var config = {
    GEMINI_API_KEY: '',
    GEMINI_MODEL:   'gemini-2.0-flash',
    DRIVE_ROOT_FOLDER_ID: '',
    API_URL:        '',
    DEPTS:          [],
    INVESTORS:      [],
    PARTNERS:       []
  };

  // Sheet Config structure:
  // Row: A=type, B=code, C=name/value, D=extra
  // api | gemini | <API_KEY>
  // api | model  | <MODEL_NAME>
  // api | drive_id | <FOLDER_ID>
  // dept | KH | Kế hoạch
  // investor | CXR | Cảng HKQT Cam Ranh
  // partner | H79 | Công ty TNHH H79 | <MST>
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var type = String(row[0]).trim().toLowerCase();
    var code = String(row[1] || '').trim();
    var name = String(row[2] || '').trim();
    var extra = String(row[3] || '').trim();

    if (type === 'api' && code === 'gemini')   config.GEMINI_API_KEY = name;
    if (type === 'api' && code === 'model')    config.GEMINI_MODEL = name;
    if (type === 'api' && code === 'drive_id') config.DRIVE_ROOT_FOLDER_ID = name;
    if (type === 'api' && code === 'url')      config.API_URL = name;
    if (type === 'dept')     config.DEPTS.push({ code: code, name: name });
    if (type === 'investor') config.INVESTORS.push({ code: code, name: name });
    if (type === 'partner')  config.PARTNERS.push({ code: code, name: name, tax: extra });
  }

  return config;
}

// =====================================================
// HANDLE: ADD PARTNER
// =====================================================
function handleAddPartner(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var configSheet = ss.getSheetByName("Config");
  if (!configSheet) return { success: false, error: "Config sheet not found" };
  configSheet.appendRow(['PTN', payload.code, payload.name, '']);
  return { success: true };
}

// =====================================================
// HANDLE: ADMIN AUTH
// =====================================================
function handleVerifyAdmin(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var configSheet = ss.getSheetByName("Config");
  var data = configSheet.getDataRange().getValues();
  var storedPass = '';

  // Sheet Config structure: A=type, B=code, C=name/value
  // Password row: A="password", B="admin", C="acv@2025"
  data.forEach(function(r) {
    if (String(r[0]).trim().toLowerCase() === 'password') {
      storedPass = String(r[2]).trim(); // Mật khẩu nằm ở cột C
    }
  });

  if (payload.password === storedPass) {
    var token = Utilities.getUuid();
    return { success: true, token: token };
  }
  return { success: false, error: 'Sai mật khẩu' };
}

function handleSaveConfigSettings(payload) {
  // Implement as needed
  return { success: true };
}

function handleSaveConfigList(payload) {
  // Implement as needed
  return { success: true };
}

function handleChangePassword(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var configSheet = ss.getSheetByName("Config");
  var data = configSheet.getDataRange().getValues();

  // Verify old password first
  var storedPass = '';
  var passRowIndex = -1;
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === 'password') {
      storedPass = String(data[i][2]).trim(); // Cột C
      passRowIndex = i + 1; // 1-indexed for Sheet
      break;
    }
  }

  if (payload.oldPassword !== storedPass) {
    return { success: false, error: 'Mật khẩu cũ không chính xác' };
  }

  // Update new password in column C
  if (passRowIndex > 0) {
    configSheet.getRange(passRowIndex, 3).setValue(payload.newPassword); // Cột C (index 3)
  }

  return { success: true, message: 'Đổi mật khẩu thành công' };
}

function handleCheckDuplicate(contractNumber) {
  var sheet = getSheet(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]) === String(contractNumber)) { // Cột C (index 2) là Số HĐ
      return { exists: true };
    }
  }
  return { exists: false };
}
