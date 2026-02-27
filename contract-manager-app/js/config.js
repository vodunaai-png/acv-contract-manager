/**
 * Dynamic Configuration State
 * Mapped to values downloaded from the 'Config' sheet on Google Apps Script
 */
const CONFIG = {
    // 1. Apps Script URL is the ONLY hardcoded dependency
    API_URL: 'https://script.google.com/macros/s/AKfycbwO2qflYCODkr_s0SUbY-sMXd0I-X6-p-Oe7GzCmVPZob3ZmNLM83pUeo7fOHMVyPIVDQ/exec',

    // 2. These will be loaded dynamically from Apps Script
    GEMINI_API_KEY: '',
    GEMINI_MODEL: 'gemini-2.5-flash',
    DRIVE_ROOT_FOLDER_ID: '',

    // 3. Department, Investor, Partner lists
    DEPTS: [],
    INVESTORS: [],
    PARTNERS: [],

    // 4. Update the Config by mapping API output to memory
    loadPublicConfig: (serverData) => {
        if (!serverData) return;

        // Lists — support both UPPERCASE keys (from current server) and lowercase
        CONFIG.DEPTS = serverData.DEPTS || serverData.depts || [];
        CONFIG.INVESTORS = serverData.INVESTORS || serverData.investors || [];
        CONFIG.PARTNERS = serverData.PARTNERS || serverData.partners || [];

        // API Setup — support both flat format and nested {api: {...}} format
        if (serverData.api) {
            // Nested format: {api: {gemini: '...', model: '...', drive_id: '...'}}
            CONFIG.GEMINI_API_KEY = serverData.api.gemini || '';
            CONFIG.GEMINI_MODEL = serverData.api.model || 'gemini-2.5-flash';
            CONFIG.DRIVE_ROOT_FOLDER_ID = serverData.api.drive_id || '';
        } else {
            // Flat format: {GEMINI_API_KEY: '...', GEMINI_MODEL: '...'}
            if (serverData.GEMINI_API_KEY) CONFIG.GEMINI_API_KEY = serverData.GEMINI_API_KEY;
            if (serverData.GEMINI_MODEL) CONFIG.GEMINI_MODEL = serverData.GEMINI_MODEL;
            if (serverData.DRIVE_ROOT_FOLDER_ID) CONFIG.DRIVE_ROOT_FOLDER_ID = serverData.DRIVE_ROOT_FOLDER_ID;
        }
    }
};

window.CONFIG = CONFIG;
