/**
 * Admin Settings Logic
 */
const admin = {
    token: null,

    init: () => {
        // Init auth tab triggers
        document.getElementById('btn-admin-login').addEventListener('click', admin.login);
        document.getElementById('admin-password-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') admin.login();
        });
        document.getElementById('btn-admin-logout').addEventListener('click', admin.logout);

        // Tab Switching
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const target = document.getElementById(btn.getAttribute('data-target'));
                if (target) target.classList.add('active');
            });
        });

        // Config Save Handling
        document.getElementById('btn-test-api').addEventListener('click', admin.testApi);
        document.getElementById('btn-save-api-config').addEventListener('click', admin.saveApiSettings);
        document.getElementById('btn-add-dept').addEventListener('click', () => admin.addListRow('dept-list-table'));
        document.getElementById('btn-save-depts').addEventListener('click', () => admin.saveList('dept', 'dept-list-table'));

        document.getElementById('btn-add-investor').addEventListener('click', () => admin.addListRow('investor-list-table'));
        document.getElementById('btn-save-investors').addEventListener('click', () => admin.saveList('investor', 'investor-list-table'));

        document.getElementById('btn-add-partner').addEventListener('click', () => admin.addListRow('partner-list-table'));
        document.getElementById('btn-save-partners').addEventListener('click', () => admin.saveList('partner', 'partner-list-table'));

        document.getElementById('btn-change-password').addEventListener('click', admin.changePassword);

        // Check local storage token
        const t = localStorage.getItem('acv_admin_token');
        if (t) {
            admin.token = t;
            admin.showDashboard();
            admin.loadDataIntoView();
        } else {
            admin.showLogin();
        }
    },

    showLogin: () => {
        document.getElementById('admin-login-view').style.display = 'block';
        document.getElementById('admin-dashboard-view').style.display = 'none';

        // Disable tabs and clear token
        document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.disabled = true);
        admin.token = null;
    },

    showDashboard: () => {
        document.getElementById('admin-login-view').style.display = 'none';
        document.getElementById('admin-dashboard-view').style.display = 'block';
        document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.disabled = false);
    },

    login: async () => {
        const pwd = document.getElementById('admin-password-input').value;
        if (!pwd) return ui.toast('Lỗi', 'Vui lòng nhập mật khẩu admin', 'warning');

        ui.setLoading('view-admin', true, 'Đang xác thực...');
        try {
            const res = await api.verifyAdmin(pwd);
            if (res.success) {
                admin.token = res.token;
                localStorage.setItem('acv_admin_token', res.token);
                ui.toast('Thành công', 'Đăng nhập trang quản trị', 'success');
                admin.showDashboard();
                admin.loadDataIntoView();
                document.getElementById('admin-password-input').value = '';
            } else {
                ui.toast('Lỗi Xác Thực', 'Mật khẩu quản trị không hợp lệ', 'error');
            }
        } catch (e) {
            ui.toast('Lỗi Hệ Thống', 'Không thể kết nối máy chủ', 'error');
        } finally {
            ui.setLoading('view-admin', false);
        }
    },

    logout: () => {
        localStorage.removeItem('acv_admin_token');
        admin.showLogin();
        ui.toast('Đã đăng xuất', 'Kết thúc phiên quản trị', 'info');
    },

    /**
     * Data Mapping from Config memory to Admin View
     */
    loadDataIntoView: () => {
        // API Settings
        document.getElementById('cfg-gemini-key').value = CONFIG.GEMINI_API_KEY || '';
        document.getElementById('cfg-gemini-model').value = CONFIG.GEMINI_MODEL || 'gemini-2.5-flash';
        document.getElementById('cfg-drive-id').value = CONFIG.DRIVE_ROOT_FOLDER_ID || '';
        document.getElementById('cfg-api-url').value = CONFIG.API_URL || '';

        // Rendering Config Lists
        admin.renderListTable('dept-list-table', CONFIG.DEPTS);
        admin.renderListTable('investor-list-table', CONFIG.INVESTORS);
        admin.renderListTable('partner-list-table', CONFIG.PARTNERS);
    },

    renderListTable: (tableId, arr) => {
        const tbody = document.getElementById(tableId);
        tbody.innerHTML = '';
        arr.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" class="form-control" value="${item.code}" placeholder="Mã viết tắt"></td>
                <td><input type="text" class="form-control" value="${item.name}" placeholder="Tên đầy đủ"></td>
                <td><button class="btn btn-outline text-danger" onclick="this.parentElement.parentElement.remove()"><i class="ph ph-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    addListRow: (tableId) => {
        const tbody = document.getElementById(tableId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="form-control" value="" placeholder="Mã viết tắt"></td>
            <td><input type="text" class="form-control" value="" placeholder="Tên đầy đủ"></td>
            <td><button class="btn btn-outline text-danger" onclick="this.parentElement.parentElement.remove()"><i class="ph ph-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    },

    testApi: async () => {
        const apiKey = document.getElementById('cfg-gemini-key').value.trim();
        if (!apiKey) return ui.toast('Lỗi', 'Vui lòng nhập API Key trước khi test', 'warning');

        ui.setLoading('view-admin', true, 'Đang kiểm tra API Key kết nối Google...');
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error?.message || 'API Key không hợp lệ hoặc bị lỗi');
            }

            const models = data.models || [];
            const selectEl = document.getElementById('cfg-gemini-model');
            selectEl.innerHTML = ''; // clear options

            let foundValid = false;
            // Lọc ra các model Gemini hỗ trợ trích xuất văn bản (generateContent)
            models.forEach(m => {
                if (m.name.startsWith('models/gemini') && m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    const opt = document.createElement('option');
                    let shortName = m.name.replace('models/', '');
                    opt.value = shortName;
                    opt.textContent = m.displayName || shortName;
                    selectEl.appendChild(opt);
                    foundValid = true;
                }
            });

            if (!foundValid) {
                ui.toast('Cảnh báo', 'API Key hợp lệ nhưng không tìm thấy model Gemini nào hỗ trợ text', 'warning');
            } else {
                ui.toast('Thành công', 'Đã tải danh sách Model mới nhất từ Google!', 'success');
                // Khôi phục lại config cũ nếu đang có trong danh sách
                if (CONFIG.GEMINI_MODEL) {
                    selectEl.value = CONFIG.GEMINI_MODEL;
                }
            }
        } catch (e) {
            ui.toast('Lỗi', e.message, 'error');
        } finally {
            ui.setLoading('view-admin', false);
        }
    },

    saveApiSettings: async () => {
        const gemini_key = document.getElementById('cfg-gemini-key').value.trim();
        const gemini_model = document.getElementById('cfg-gemini-model').value.trim();
        const drive_id = document.getElementById('cfg-drive-id').value.trim();

        ui.setLoading('view-admin', true, 'Đang lưu cài đặt...');
        try {
            const apiData = { "gemini": gemini_key, "model": gemini_model, "drive_id": drive_id };
            await api.saveConfigSettings(admin.token, apiData);
            ui.toast('Thành công', 'Đã lưu cài đặt API', 'success');

            // Re-sync local cache
            CONFIG.GEMINI_API_KEY = gemini_key;
            CONFIG.GEMINI_MODEL = gemini_model;
            CONFIG.DRIVE_ROOT_FOLDER_ID = drive_id;

            // Update model display on upload page
            const modelDisplay = document.getElementById('display-ai-model');
            if (modelDisplay) modelDisplay.textContent = gemini_model || 'Gemini AI';

        } catch (e) {
            ui.toast('Lỗi', e.message, 'error');
        } finally {
            ui.setLoading('view-admin', false);
        }
    },

    saveList: async (type, tableId) => {
        const tbody = document.getElementById(tableId);
        const rows = tbody.querySelectorAll('tr');
        const listData = [];

        rows.forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            const code = inputs[0].value.trim();
            const name = inputs[1].value.trim();
            if (code && name) {
                listData.push({ code, name });
            }
        });

        ui.setLoading('view-admin', true, 'Đang đồng bộ danh sách...');
        try {
            await api.saveConfigList(admin.token, type, listData);
            ui.toast('Thành công', 'Đã cập nhật danh sách', 'success');

            // Re-sync local cache
            if (type === 'dept') CONFIG.DEPTS = listData;
            else if (type === 'investor') CONFIG.INVESTORS = listData;
            else if (type === 'partner') CONFIG.PARTNERS = listData;

        } catch (e) {
            ui.toast('Lỗi', e.message, 'error');
        } finally {
            ui.setLoading('view-admin', false);
        }
    },

    changePassword: async () => {
        const oldP = document.getElementById('admin-old-pwd').value;
        const newP = document.getElementById('admin-new-pwd').value;
        const confirmP = document.getElementById('admin-confirm-pwd').value;

        if (!oldP || !newP) return ui.toast('Lỗi', 'Vui lòng nhập đủ trường mật khẩu', 'warning');
        if (newP !== confirmP) return ui.toast('Lỗi', 'Mật khẩu xác nhận không khớp', 'error');

        ui.setLoading('view-admin', true, 'Đang đổi mật khẩu...');
        try {
            const res = await api.changePassword(admin.token, oldP, newP);
            ui.toast('Thành công', 'Cập nhật mật khẩu thành công. Vui lòng đăng nhập lại', 'success');
            admin.logout();

            document.getElementById('admin-old-pwd').value = '';
            document.getElementById('admin-new-pwd').value = '';
            document.getElementById('admin-confirm-pwd').value = '';
        } catch (e) {
            ui.toast('Lỗi', e.message || 'Mật khẩu cũ không chính xác', 'error');
        } finally {
            ui.setLoading('view-admin', false);
        }
    }
};

window.admin = admin;
