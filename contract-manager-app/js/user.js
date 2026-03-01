/**
 * User Management (localStorage)
 */
const userManager = {
    key: 'acv_user_data',

    /**
     * Get user info from localStorage
     */
    getUser: () => {
        try {
            const data = localStorage.getItem(userManager.key);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    },

    /**
     * Save user info to localStorage
     */
    setUser: (name, dept) => {
        const uInfo = {
            name: name.trim(),
            department: dept.trim(),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(userManager.key, JSON.stringify(uInfo));
        userManager.updateHeader();
        return uInfo;
    },

    /**
     * Return bool indicating if user is registered
     */
    isRegistered: () => {
        return userManager.getUser() !== null;
    },

    /**
     * Show welcome modal on first visit
     */
    checkAndShowWelcome: () => {
        if (!userManager.isRegistered()) {
            document.getElementById('welcome-modal').style.display = 'flex';
            document.getElementById('app-container').style.display = 'none';
        } else {
            document.getElementById('welcome-modal').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            userManager.updateHeader();

            // Set input values in settings modal
            const u = userManager.getUser();
            if (u) {
                document.getElementById('s-user-name').value = u.name;
                document.getElementById('s-user-dept').value = u.department;
            }
        }
    },

    /**
     * Update sidebar header display
     */
    updateHeader: () => {
        const u = userManager.getUser();
        if (u) {
            document.getElementById('display-name').textContent = u.name;
            document.getElementById('display-dept').textContent = u.department;
        }
    },

    /**
     * Bind form logic
     */
    init: () => {
        // Init welcome form
        document.getElementById('welcome-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('user-name').value;
            const dept = document.getElementById('user-dept').value;

            if (name && dept) {
                userManager.setUser(name, dept);
                document.getElementById('welcome-modal').style.display = 'none';
                document.getElementById('app-container').style.animation = 'fadeIn 0.5s ease-in-out';
                document.getElementById('app-container').style.display = 'flex';
                app.initRouter(); // Boot the app router once user exists
            }
        });

        // Settings modal
        document.getElementById('btn-settings').addEventListener('click', () => {
            ui.showModal('settings-modal');
        });
        document.getElementById('close-settings').addEventListener('click', () => {
            ui.hideModal('settings-modal');
        });
        document.getElementById('btn-save-settings').addEventListener('click', () => {
            const name = document.getElementById('s-user-name').value;
            const dept = document.getElementById('s-user-dept').value;
            if (name && dept) {
                userManager.setUser(name, dept);
                ui.hideModal('settings-modal');
                ui.toast('Thành công', 'Thông tin đã được cập nhật', 'success');
            }
        });

        // First check
        userManager.checkAndShowWelcome();
    }
};

window.userManager = userManager;
