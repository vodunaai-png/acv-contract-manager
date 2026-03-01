/**
 * Form Management
 */
const formManager = {
    currentFile: null,
    currentDocText: null, // Stores extracted text for AI Consultant

    init: () => {
        // Setup clear button
        document.getElementById('btn-clear-form').addEventListener('click', formManager.clear);

        // Setup Submit Handler
        document.getElementById('btn-save-form').addEventListener('click', formManager.save);

        // Setup New Contract Request Handler
        document.getElementById('btn-new-contract').addEventListener('click', () => {
            formManager.clear();
        });

        // Setup AI Consultant Handler
        const btnConsult = document.getElementById('btn-expert-consult');
        if (btnConsult) {
            btnConsult.addEventListener('click', formManager.doConsultation);
        }

        // Auto-format VND
        const valInput = document.getElementById('f-contractValue');
        if (valInput) {
            valInput.addEventListener('blur', (e) => {
                e.target.value = formManager.formatVND(e.target.value);
            });
        }
        const advInput = document.getElementById('f-advancePayment');
        if (advInput) {
            advInput.addEventListener('blur', (e) => {
                e.target.value = formManager.formatVND(e.target.value);
            });
        }
    },

    lockForm: (isLocked) => {
        const formEl = document.getElementById('contract-form');
        const inputs = formEl.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.disabled = isLocked;
        });

        const saveBtn = document.getElementById('btn-save-form');
        const newBtn = document.getElementById('btn-new-contract');
        const clearBtn = document.getElementById('btn-clear-form');
        const browseBtn = document.getElementById('btn-browse-file');

        if (isLocked) {
            if (saveBtn) saveBtn.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'none';
            if (browseBtn) browseBtn.style.display = 'none';
            if (newBtn) newBtn.style.display = 'inline-flex';
        } else {
            if (saveBtn) saveBtn.style.display = 'inline-flex';
            if (clearBtn) clearBtn.style.display = 'inline-flex';
            if (browseBtn) browseBtn.style.display = 'inline-flex';
            if (newBtn) newBtn.style.display = 'none';

            // Auto focus
            const projectInput = document.getElementById('f-projectName');
            if (projectInput) projectInput.focus();
        }
    },

    formatVND: (value) => {
        const num = String(value).replace(/\./g, '').replace(/,/g, '');
        if (isNaN(num) || num === '') return value;
        return new Intl.NumberFormat('vi-VN').format(parseInt(num));
    },

    /**
     * Map JSON data to form inputs
     */
    setData: (data, hints) => {
        const fields = [
            'contractNumber', 'signDate', 'bidPackage', 'projectName', 'contractSummary',
            'investorName', 'investorRep', 'investorTax', 'investorAccountNo', 'investorBankName', 'investorBusinessLicense',
            'contractorName', 'contractorRep', 'contractorTax', 'contractorAccountNo', 'contractorBankName', 'contractorBusinessLicense',
            'contractValue', 'contractValueText', 'vatRate', 'advancePayment', 'paymentCount', 'paymentTerms', 'settlementDeadline', 'liquidationDeadline', 'notes',
            'insurance', 'warranty',
            'contractDuration', 'executionProgress'
        ];

        // Reset conf levels
        document.querySelectorAll('.input-wrapper').forEach(el => {
            el.className = 'input-wrapper';
        });

        fields.forEach(f => {
            const input = document.getElementById(`f-${f}`);
            if (input) {
                // Populate value
                if (data[f] !== undefined && data[f] !== null) {
                    // Format VND cho các trường số tiền khi AI điền
                    if ((f === 'contractValue' || f === 'advancePayment') && data[f]) {
                        input.value = formManager.formatVND(String(data[f]));
                    } else {
                        input.value = data[f];
                    }
                    if (f === 'contractSummary' && data[f] && document.getElementById('summary-group')) {
                        document.getElementById('summary-group').style.display = 'block';
                    }
                }

                // Add Highlight
                if (hints && hints[f]) {
                    const wrapper = input.parentElement;
                    wrapper.classList.remove('conf-high', 'conf-med', 'conf-low');
                    wrapper.classList.add(`conf-${hints[f]}`);
                }
            }
        });

        // Auto-generate partner abbreviation from contractor name
        if (data.contractorName) {
            numbering.autoSetPartner(data.contractorName);
        }
    },

    /**
     * Retrieve all form data as an object matching sheet keys
     */
    getData: () => {
        const data = {};
        const fields = [
            'contractNumber', 'signDate', 'bidPackage', 'projectName', 'contractSummary',
            'investorName', 'investorRep', 'investorTax', 'investorAccountNo', 'investorBankName', 'investorBusinessLicense',
            'contractorName', 'contractorRep', 'contractorTax', 'contractorAccountNo', 'contractorBankName', 'contractorBusinessLicense',
            'contractValue', 'contractValueText', 'vatRate', 'advancePayment', 'paymentCount', 'paymentTerms', 'settlementDeadline', 'liquidationDeadline', 'notes',
            'insurance', 'warranty',
            'contractDuration', 'executionProgress'
        ];

        fields.forEach(f => {
            const input = document.getElementById(`f-${f}`);
            if (input) {
                let val = input.value.trim();
                if (f === 'contractValue') {
                    val = val.replace(/\./g, '');
                }
                if (f === 'contractNumber') {
                    val = ''; // FORCED EMPTY: Để Backend luôn nhận lệnh tự sinh số mới. (FIXME: Bỏ override này khi làm chức năng Edit)
                }
                data[f] = val;
            }
        });
        return data;
    },

    /**
     * Clear all fields and status UI
     */
    clear: () => {
        document.getElementById('contract-form').reset();
        document.querySelectorAll('.input-wrapper').forEach(el => {
            el.className = 'input-wrapper';
        });
        const summaryGrp = document.getElementById('summary-group');
        if (summaryGrp) summaryGrp.style.display = 'none';

        // Reset số HĐ display
        const nbResult = document.getElementById('nb-result');
        if (nbResult) {
            nbResult.textContent = 'Sẽ được tạo tự động sau khi lưu';
            nbResult.style.color = 'var(--text-sec)';
            nbResult.style.fontWeight = 'normal';
        }
        const displayBox = document.getElementById('contract-number-display');
        if (displayBox) {
            displayBox.style.border = 'none';
            displayBox.style.background = 'var(--bg-primary)';
        }

        document.getElementById('ai-status-bar').style.display = 'none';
        document.getElementById('upload-preview-context').style.display = 'none';
        formManager.currentFile = null;
        formManager.currentDocText = null;

        // Unlock form and swap buttons back
        formManager.lockForm(false);

        // Reset expert result box
        const consultBtn = document.getElementById('btn-expert-consult');
        const consultStatus = document.getElementById('consult-status');
        const resultBox = document.getElementById('expert-advice-result');
        if (consultBtn) consultBtn.style.display = 'inline-flex';
        if (consultStatus) consultStatus.style.display = 'none';
        if (resultBox) {
            resultBox.style.display = 'none';
            resultBox.innerHTML = '';
        }

        ui.toast('Đã dọn dẹp form', 'Sẵn sàng nhập hợp đồng mới', 'info', 2000);
    },

    /**
     * Perform Expert Consultation Action
     */
    doConsultation: async () => {
        if (!formManager.currentFile && !formManager.currentDocText) {
            ui.toast('Thiếu dữ liệu', 'Vui lòng tải lên file hợp đồng trước khi nhờ chuyên gia tư vấn.', 'warning');
            return;
        }

        const consultBtn = document.getElementById('btn-expert-consult');
        const consultStatus = document.getElementById('consult-status');
        const resultBox = document.getElementById('expert-advice-result');

        // UI Loading
        consultBtn.style.display = 'none';
        consultStatus.style.display = 'inline-flex';
        resultBox.style.display = 'none';
        resultBox.innerHTML = '';

        try {
            const rawMarkdown = await gemini.consultContract(formManager.currentFile, formManager.currentDocText);

            if (rawMarkdown) {
                // Parse markdown to HTML using marked.js
                const htmlContent = marked.parse(rawMarkdown);
                resultBox.innerHTML = htmlContent;
                resultBox.style.display = 'block';
                ui.toast('Phân tích hoàn tất', 'Chuyên gia đã đưa ra tư vấn. Kéo xuống để xem chi tiết.', 'success');
                // Scroll down to the result
                setTimeout(() => resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
            }
        } catch (error) {
            console.error("Consultation error:", error);
        } finally {
            // Restore button and hide loading
            consultBtn.style.display = 'inline-flex';
            consultStatus.style.display = 'none';
        }
    },

    /**
     * Set file payload for uploading attached item when submitting
     */
    setAttachedFile: (file, fileNameText) => {
        formManager.currentFile = file;

        if (file) {
            document.getElementById('ai-status-bar').style.display = 'flex';
            document.getElementById('upload-preview-context').style.display = 'flex';
            document.getElementById('upload-filename').textContent = fileNameText || file.name;
        }
    },

    /**
     * Save/Submit sequence
     */
    save: async () => {
        // HTML5 Validation constraint check
        const formEl = document.getElementById('contract-form');
        if (!formEl.reportValidity()) return;

        // Collect form data
        const data = formManager.getData();

        // Custom validation check
        if (!data.projectName || !data.investorName || !data.contractorName || !data.contractValue) {
            ui.toast('Lỗi Validate', 'Vui lòng kiểm tra các trường có dấu sao đỏ (*)', 'warning');
            return;
        }

        try {
            ui.setLoading('view-new', true, 'Đang tạo Số HĐ và lưu lên hệ thống...');

            // Get base64 payload if there is file
            let filePayload = null;
            if (formManager.currentFile) {
                const baseData = await fileManager.toBase64(formManager.currentFile);
                filePayload = {
                    base64: baseData.base64,
                    mimeType: baseData.mimeType,
                    fileName: formManager.currentFile.name
                };
            }

            // User info & Numbering info
            const u = userManager.getUser();
            const numberingParams = numbering.getNumberingParams();

            // Perform final submission
            const result = await api.save(data, u, filePayload, numberingParams);

            const generatedNumber = result.contractNumber || 'Không xác định';

            // Cập nhật số HĐ lên form để user thấy trực tiếp
            document.getElementById('f-contractNumber').value = generatedNumber;

            // Hiển thị số HĐ trên giao diện Phần 1
            const nbResult = document.getElementById('nb-result');
            if (nbResult) {
                nbResult.textContent = generatedNumber;
                nbResult.style.color = 'var(--color-emerald, #10b981)';
                nbResult.style.fontWeight = 'bold';
            }

            // Highlight ô hiển thị số HĐ
            const displayBox = document.getElementById('contract-number-display');
            if (displayBox) {
                displayBox.style.border = '2px solid var(--color-emerald, #10b981)';
                displayBox.style.background = 'rgba(16, 185, 129, 0.1)';
            }

            // Lock form and prompt next action
            formManager.lockForm(true);

            // Toast thông báo ngắn - KHÔNG xóa form, KHÔNG chuyển trang
            ui.toast('✅ Lưu Thành Công!',
                `Số HĐ: ${generatedNumber}`,
                'success', 8000);

        } catch (error) {
            ui.toast('Lỗi Lưu Dữ Liệu', error.message, 'error');
        } finally {
            ui.setLoading('view-new', false);
        }
    }
};

window.formManager = formManager;
