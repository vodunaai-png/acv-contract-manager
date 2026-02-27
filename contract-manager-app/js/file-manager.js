/**
 * File Manager - Read PDF/DOCX/Images and Base64 Conversion
 */
const fileManager = {
    /**
     * Read a `.docx` file using mammoth and return plain text
     */
    readDocxText: async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                    resolve(result.value);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Convert any file to Base64 string for file upload
     * Only extracts the data portion, omitting `data:image/jpeg;base64,`
     */
    toBase64: async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fullBase64 = e.target.result;
                const base64Data = fullBase64.split(',')[1];
                resolve({ base64: base64Data, mimeType: file.type });
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },

    /**
     * File size validation (Max 25MB for Google Apps Script execution time limits)
     */
    validateSize: (file) => {
        const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
        if (file.size > MAX_SIZE) {
            ui.toast('Lỗi tải lên', 'Dung lượng file lớn hơn mức cho phép (25MB)', 'error');
            return false;
        }
        return true;
    }
};

window.fileManager = fileManager;
