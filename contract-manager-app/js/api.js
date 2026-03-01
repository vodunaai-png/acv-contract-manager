/**
 * Google Apps Script API Client V2
 */
const api = {
    /**
     * Get public config (depts, investors, partners, api settings)
     */
    getPublicConfig: async () => {
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getPublicConfig' })
            });
            if (!res.ok) throw new Error("Network response was not ok");
            return await res.json();
        } catch (error) {
            console.error('API getPublicConfig failed:', error);
            throw new Error('Mất kết nối với máy chủ. Vui lòng kiểm tra API URL.');
        }
    },

    /**
     * Get next auto contract number
     */
    getNextNumber: async (year) => {
        try {
            const payload = { action: 'getNextNumber' };
            if (year) payload.year = year;
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (error) {
            console.error('API getNextNumber failed:', error);
            return null;
        }
    },

    /**
     * Get all contracts (for table)
     */
    getAll: async () => {
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getAll' })
            });
            return await res.json();
        } catch (error) {
            console.error('API getAll failed:', error);
            return { contracts: [] };
        }
    },

    getStats: async () => {
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getStats' })
            });
            return await res.json();
        } catch (error) {
            console.error('API getStats failed:', error);
            return { total: 0, totalValue: 0, filesCount: 0 };
        }
    },

    /**
     * Check duplication
     */
    checkDuplicate: async (contractNumber) => {
        if (!contractNumber) return { exists: false };
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'checkDuplicate', number: contractNumber })
            });
            return await res.json();
        } catch (error) {
            console.error('API checkDuplicate failed:', error);
            return { exists: false };
        }
    },

    /**
     * Save new contract
     */
    save: async (formDataObj, userObj, filePayloadObj, numberingParams) => {
        const payload = {
            action: 'save',
            data: formDataObj,
            user: userObj,
            file: filePayloadObj, // {base64, mimeType, fileName}
            numbering: numberingParams
        };

        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.error) {
            throw new Error(result.error);
        }
        return result;
    },

    /**
     * Fast-sync new partner without admin token
     */
    addPartner: async (code, name) => {
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addPartner', code, name })
            });
            return await res.json();
        } catch (error) {
            console.error('API addPartner failed:', error);
            return { success: false };
        }
    },

    // ===================================
    // ADMIN ENDPOINTS
    // ===================================
    verifyAdmin: async (password) => {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'verifyAdmin', password })
        });
        return await res.json();
    },

    saveConfigSettings: async (token, apiData) => {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveConfigSettings', token, apiData })
        });
        return await res.json();
    },

    saveConfigList: async (token, type, list) => {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveConfigList', token, type, list })
        });
        return await res.json();
    },

    changePassword: async (token, oldPassword, newPassword) => {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'changePassword', token, oldPassword, newPassword })
        });
        return await res.json();
    }
};

window.api = api;
