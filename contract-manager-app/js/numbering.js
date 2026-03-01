/**
 * Auto Numbering Module
 */
const numbering = {
    // Current state parameters
    state: {
        yearPrefix: new Date().getFullYear().toString().slice(-2),
        seqNumber: '001',
        deptCode: '',
        invCode: '',
        ptnCode: ''
    },

    init: () => {
        // Init UI listeners
        const yrSelect = document.getElementById('nb-year');
        const deptSelect = document.getElementById('nb-dept');
        const invSelect = document.getElementById('nb-investor');
        const ptnInput = document.getElementById('nb-partner');

        if (yrSelect) {
            const currentYear = new Date().getFullYear();
            yrSelect.innerHTML = `<option value="${currentYear}">${currentYear}</option>
                                  <option value="${currentYear + 1}">${currentYear + 1}</option>`;

            yrSelect.addEventListener('change', () => {
                numbering.state.yearPrefix = yrSelect.value.toString().slice(-2);
            });
        }

        if (deptSelect) {
            deptSelect.addEventListener('change', () => {
                numbering.state.deptCode = deptSelect.value;
            });
        }

        if (invSelect) {
            invSelect.addEventListener('change', () => {
                numbering.state.invCode = invSelect.value;
            });
        }

        if (ptnInput) {
            ptnInput.addEventListener('input', () => {
                numbering.state.ptnCode = ptnInput.value.trim().toUpperCase();
            });

            // Catch manual edits when user leaves the input field
            ptnInput.addEventListener('blur', () => {
                const contractorInput = document.getElementById('f-contractorName');
                const newCode = ptnInput.value.trim().toUpperCase();
                const contractorName = contractorInput ? contractorInput.value.trim() : '';

                if (newCode && contractorName) {
                    const idx = CONFIG.PARTNERS.findIndex(p => p.name === contractorName);
                    if (idx >= 0) {
                        if (CONFIG.PARTNERS[idx].code !== newCode) {
                            CONFIG.PARTNERS[idx].code = newCode;
                            numbering._syncPartnerToServer(newCode, contractorName);
                        }
                    } else {
                        CONFIG.PARTNERS.push({ code: newCode, name: contractorName });
                        numbering._syncPartnerToServer(newCode, contractorName);
                    }
                }
            });
        }
    },

    getNumberingParams: () => {
        const y = document.getElementById('nb-year');
        const d = document.getElementById('nb-dept');
        const i = document.getElementById('nb-investor');
        const p = document.getElementById('nb-partner');
        return {
            year: y ? y.value : new Date().getFullYear(),
            deptCode: d ? d.value : '',
            invCode: i ? i.value : '',
            ptnCode: p ? p.value.trim().toUpperCase() : ''
        };
    },

    populateDropdowns: () => {
        const deptSelect = document.getElementById('nb-dept');
        const invSelect = document.getElementById('nb-investor');
        const partnerList = document.getElementById('partner-datalist');

        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">-- Chọn đơn vị --</option>';
            CONFIG.DEPTS.forEach(d => {
                deptSelect.innerHTML += `<option value="${d.code}">${d.code} - ${d.name}</option>`;
            });
        }

        if (invSelect) {
            invSelect.innerHTML = '<option value="">-- Chọn Chủ đầu tư --</option>';
            CONFIG.INVESTORS.forEach(i => {
                invSelect.innerHTML += `<option value="${i.code}">${i.code} - ${i.name}</option>`;
            });
        }

        if (partnerList) {
            partnerList.innerHTML = '';
            CONFIG.PARTNERS.forEach(p => {
                const taxInfo = p.tax ? ` — MST: ${p.tax}` : '';
                partnerList.innerHTML += `<option value="${p.code}">${p.name}${taxInfo}</option>`;
            });
        }
    },

    /**
     * Auto generate abbreviation from full name
     */
    generateAbbreviation: (fullName) => {
        if (!fullName) return '';

        // Remove common prefixes
        const prefixes = ["Công ty", "TNHH", "Cổ phần", "CP", "CPXD", "Xây dựng", "XD", "Tư vấn", "TV", "Chi nhánh", "Tập đoàn", "Liên hiệp"];
        let cleanName = fullName;

        let removed;
        do {
            removed = false;
            for (let pref of prefixes) {
                const regex = new RegExp(`^${pref}\\s+`, 'i');
                if (regex.test(cleanName)) {
                    cleanName = cleanName.replace(regex, '');
                    removed = true;
                }
            }
        } while (removed);

        // Extract initials
        const words = cleanName.trim().split(/\s+/);
        let abbr = '';
        words.forEach(w => {
            if (w.length > 0 && /[a-zA-Z]/.test(w[0])) {
                // remove unicode tone marks for abbreviation letter selection
                const normalizedChar = w[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
                // Special check for Ð and Đ
                const c = normalizedChar === 'Đ' || normalizedChar === 'Ð' ? 'D' : normalizedChar;
                if (/[A-Z]/.test(c)) abbr += c;
            }
        });

        if (!abbr) abbr = 'NT'; // Default

        // Check cache in Config for conflicts (append 2, 3...)
        let finalAbbr = abbr;
        let counter = 2;

        // Find existing ones
        const existing = CONFIG.PARTNERS.find(p => p.name === fullName);
        if (existing) {
            finalAbbr = existing.code;
        } else {
            // Check conflict
            while (CONFIG.PARTNERS.find(p => p.code === finalAbbr)) {
                finalAbbr = abbr + counter;
                counter++;
            }
        }

        return finalAbbr;
    },

    autoSetPartner: (contractorName) => {
        if (!contractorName || !contractorName.trim()) return;
        const trimmedName = contractorName.trim();

        // 1. Check cache first
        const existing = CONFIG.PARTNERS.find(p => p.name === trimmedName);
        let abbr;

        if (existing) {
            abbr = existing.code;
        } else {
            // 2. Auto-generate if not in cache
            abbr = numbering.generateAbbreviation(trimmedName);

            // 3. Add to local memory cache (including tax info)
            const taxInput = document.getElementById('f-contractorTax');
            const tax = taxInput ? taxInput.value.trim() : '';
            CONFIG.PARTNERS.push({ code: abbr, name: trimmedName, tax: tax });

            // 4. Sync to server in background
            numbering._syncPartnerToServer(abbr, trimmedName);

            // 5. Notify user
            ui.toast('Mã Đối Tác Mới', `Đã lưu tạm mã "${abbr}" cho "${trimmedName}"`, 'info', 4000);
        }

        // 6. Update UI
        const ptnInput = document.getElementById('nb-partner');
        if (ptnInput) {
            ptnInput.value = abbr;
            numbering.state.ptnCode = abbr;
        }
    },

    /**
     * Non-blocking background sync for new partners
     */
    _syncPartnerToServer: async (code, name) => {
        try {
            // Call the new public 'addPartner' endpoint
            await api.addPartner(code, name);
            console.log(`Partner background sync successful: ${code} = ${name}`);
        } catch (e) {
            console.warn('Partner background sync failed', e);
        }
    }
};

window.numbering = numbering;
