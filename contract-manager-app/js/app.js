/**
 * Main Application Orchestrator
 */
const app = {
    currentView: 'dashboard',

    init: async () => {
        // Init Sub-Modules
        userManager.init();
        formManager.init();
        dashboard.init();
        excelExport.init();
        admin.init();
        numbering.init();

        // Load config from server
        try {
            const serverData = await api.getPublicConfig();
            CONFIG.loadPublicConfig(serverData);

            // Populate department lists for User Modals
            const userDeptSelect = document.getElementById('user-dept');
            const sUserDeptSelect = document.getElementById('s-user-dept');
            let optionsHtml = '<option value="">-- Chọn Bộ phận --</option>';
            CONFIG.DEPTS.forEach(d => {
                optionsHtml += `<option value="${d.code}">${d.code} - ${d.name}</option>`;
            });
            if (userDeptSelect) userDeptSelect.innerHTML = optionsHtml;
            if (sUserDeptSelect) sUserDeptSelect.innerHTML = optionsHtml;

            // Trigger dropdown populating in Numbering
            numbering.populateDropdowns();

            // Re-populate admin data if already authenticated (fixes race condition)
            if (admin.token) {
                admin.loadDataIntoView();
            }

            // Update AI model display on upload page
            const modelDisplay = document.getElementById('display-ai-model');
            if (modelDisplay) {
                modelDisplay.textContent = CONFIG.GEMINI_MODEL || 'Gemini AI';
            }
        } catch (e) {
            console.error("Failed to load config", e);
        }

        // 1. Setup Navigation
        document.querySelectorAll('.nav-item').forEach(el => {
            el.addEventListener('click', (e) => {
                const view = el.getAttribute('data-view');
                if (view) {
                    e.preventDefault();
                    app.navigate(view);
                }
            });
        });

        // 2. Setup File Context Upload
        app.setupDragAndDrop();

        // 2.5 Setup Theme Toggle
        app.setupThemeToggle();

        // 3. Admin Shortcut from Welcome Modal
        const btnAdminLogin = document.getElementById('btn-open-admin-login');
        if (btnAdminLogin) {
            btnAdminLogin.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('welcome-modal').style.display = 'none';
                document.getElementById('app-container').style.display = 'flex';
                app.navigate('admin');
            });
        }

        // If user already auth, do first load
        if (userManager.isRegistered()) {
            app.navigate('dashboard');
            app.refreshData();
        }
    },

    initRouter: () => {
        app.navigate('dashboard');
        app.refreshData();
    },

    /**
     * Routing Logic
     */
    navigate: (viewName) => {
        if (!viewName) return;

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.remove('active');
        });

        // Remove active class from nav
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('data-view') === viewName) {
                el.classList.add('active');
            }
        });

        // Show target view
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
            app.currentView = viewName;
        }

        // Logic hook per view
        if (viewName === 'dashboard') {
            app.refreshData();
        } else if (viewName === 'new') {
            // Auto-generate partner code if contractor name is already filled (e.g. by AI)
            const contractorField = document.getElementById('f-contractorName');
            if (contractorField && contractorField.value.trim()) {
                numbering.autoSetPartner(contractorField.value.trim());
            }
        }
    },

    refreshData: () => {
        dashboard.loadData();
    },

    /**
     * File Upload Orchestration
     */
    setupDragAndDrop: () => {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const btnBrowse = document.getElementById('btn-browse-file');

        // Triggers
        btnBrowse.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('click', (e) => {
            if (e.target !== btnBrowse) fileInput.click();
        });

        // Drag events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
            dropZone.addEventListener(evtName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(evtName => {
            dropZone.addEventListener(evtName, () => dropZone.classList.add('dragover'));
        });

        ['dragleave', 'drop'].forEach(evtName => {
            dropZone.addEventListener(evtName, () => dropZone.classList.remove('dragover'));
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length) app.handleFile(files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) app.handleFile(e.target.files[0]);
            fileInput.value = ''; // Reset
        });
    },

    setupThemeToggle: () => {
        const select = document.getElementById('themeSelectDropdown');
        if (!select) return;

        // Load saved theme
        const savedTheme = localStorage.getItem('acv_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        select.value = savedTheme;

        select.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('acv_theme', newTheme);
        });
    },

    /**
     * Coordinate extracting data from uploaded file using AI
     */
    handleFile: async (file) => {
        // Validate
        if (!fileManager.validateSize(file)) return;

        // Show progress view
        document.getElementById('drop-zone').style.display = 'none';
        document.getElementById('extraction-status').style.display = 'block';
        document.getElementById('extract-progress').style.width = '10%';
        document.getElementById('extract-title').textContent = "Đang xử lý tài liệu...";
        document.getElementById('extract-desc').textContent = "Chuẩn bị gửi dữ liệu lên Google Gemini...";

        try {
            document.getElementById('extract-progress').style.width = '40%';

            // Extract via Gemini
            const modelName = CONFIG.GEMINI_MODEL || 'gemini-2.5-flash';
            document.getElementById('extract-desc').textContent = `AI (${modelName}) đang đọc và trích xuất thông tin hợp đồng...`;

            const resultJson = await gemini.extractFile(file);
            document.getElementById('extract-progress').style.width = '90%';

            if (resultJson) {
                // Determine confidence levels based on nulls/empties
                const confidenceHints = gemini.getConfidenceHints(resultJson);

                // Populate form
                document.getElementById('extract-desc').textContent = "Hoàn tất! Đang chuyển dữ liệu vào Form...";

                // Switch contexts
                setTimeout(() => {
                    formManager.setAttachedFile(file);
                    formManager.setData(resultJson, confidenceHints);

                    // Reset UI
                    document.getElementById('drop-zone').style.display = 'block';
                    document.getElementById('extraction-status').style.display = 'none';

                    // Scroll down to the form instead of navigating
                    const formElement = document.getElementById('contract-form');
                    if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }

                    ui.toast('Trích xuất thành công', `Model: ${CONFIG.GEMINI_MODEL || 'gemini-2.5-flash'}. Vui lòng kiểm tra lại các thông tin màu vàng/đỏ`, 'success', 6000);
                }, 1000);
            }

        } catch (error) {
            console.error('File extraction flow failed:', error);
            ui.toast('Lỗi Xử Lý File', 'Có lỗi xảy ra trong quá trình trích xuất.', 'error');

            // Reset UI
            document.getElementById('drop-zone').style.display = 'block';
            document.getElementById('extraction-status').style.display = 'none';
        }
    }
};

// Bootstrap application on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Also expose as global for inline handlers if needed
window.app = app;
