/**
 * UI Utilities (Toasts, Modals, Loaders)
 */
const ui = {
    /**
     * Show a toast notification
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     * @param {string} type - 'success', 'error', 'info', or 'warning'
     * @param {number} duration - ms to show (default 5000)
     */
    toast: (title, message, type = 'info', duration = 5000) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = 'ph-info';
        if (type === 'success') icon = 'ph-check-circle';
        if (type === 'error') icon = 'ph-warning-circle';
        if (type === 'warning') icon = 'ph-warning';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="ph ${icon}"></i>
            </div>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('closing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, duration);
    },

    /**
     * Show/hide full page loading overlay or section loading
     */
    setLoading: (elementId, isLoading, text = 'Đang tải dữ liệu...') => {
        const el = document.getElementById(elementId);
        if (!el) return;

        if (isLoading) {
            // Keep original content but disable it visually
            el.dataset.originalOpacity = el.style.opacity || '1';
            el.style.opacity = '0.5';
            el.style.pointerEvents = 'none';
        } else {
            el.style.opacity = el.dataset.originalOpacity;
            el.style.pointerEvents = 'auto';
        }
    },

    /**
     * Handle modal visibility
     */
    showModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    hideModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
};

window.ui = ui;
