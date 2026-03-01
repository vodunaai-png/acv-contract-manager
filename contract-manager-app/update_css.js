const fs = require('fs');

const css = `
/* CSS: ACV Clarity Design System
   Theme: Light Mode Default + Accessible Minimalism */

:root, [data-theme="light"] {
    /* Base Colors - Light Theme Default */
    --bg-primary: #F8FAFC;
    --bg-secondary: #FFFFFF;
    --bg-card: #FFFFFF;
    --border: #E2E8F0;
    --text-primary: #0F172A;
    --text-sec: #475569;
    
    /* Accents (Trust Blue) */
    --color-primary: #0369A1;
    --color-primary-hover: #075985;
    --blue-500: #0369A1;
    --blue-hover: #075985;
    
    /* Semantic Colors */
    --emerald-500: #10B981;
    --amber-500: #F59E0B;
    --red-500: #EF4444;

    /* Confidence Highlights */
    --conf-high: rgba(16, 185, 129, 0.1);
    --conf-med: rgba(245, 158, 11, 0.1);
    --conf-low: rgba(239, 68, 68, 0.1);

    /* Typography */
    --font-ui: 'Source Sans 3', sans-serif;
    --font-heading: 'Lexend', sans-serif;
    --font-data: 'IBM Plex Mono', monospace;

    /* Layout & Utilities */
    --radius: 6px;
    --radius-sm: 4px;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    --transition: all 0.2s ease-in-out;
    --spacing-unit: 8px;
}

[data-theme="dark"] {
    /* Base Colors - Dark Theme Override */
    --bg-primary: #0F172A;
    --bg-secondary: #1E293B;
    --bg-card: #1E293B;
    --border: #334155;
    --text-primary: #F8FAFC;
    --text-sec: #94A3B8;
    
    /* Dark Theme Adjustments */
    --color-primary: #3B82F6;
    --color-primary-hover: #60A5FA;
    --blue-500: #3B82F6;
    --blue-hover: #60A5FA;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
}

/* ==========================================================
   RESET & BASE STYLES
========================================================= */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

body {
    font-family: var(--font-ui);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.5;
    overflow-x: hidden;
    transition: background-color var(--transition), color var(--transition);
}

h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: 600;
}

/* Base App Background (replaces glow-bg) */
.app-background {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    z-index: -1;
    background-color: var(--bg-primary);
    transition: background-color var(--transition);
}

/* Utility Extracted Classes (from inline styles refactor) */
.text-sec { color: var(--text-sec); }
.text-emerald { color: var(--emerald-500); }
.text-amber { color: var(--amber-500); }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.mt-4 { margin-top: 4px; }
.mt-12 { margin-top: 12px; }
.mt-24 { margin-top: 24px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.px-16 { padding-left: 16px; padding-right: 16px; }
.flex-1 { flex: 1; }
.w-100 { width: 100%; }
.w-60 { width: 60px; }
.w-100 { width: 100px; }
.w-150 { width: 150px; }
.max-w-400 { max-width: 400px; }
.max-w-500 { max-width: 500px; }
.gap-8 { gap: 8px; }
.flex-gap-8 { display: flex; gap: 8px; }
.whitespace-nowrap { white-space: nowrap; }
.opacity-60 { opacity: 0.6; }
.flex-between-center { display: flex; justify-content: space-between; align-items: center; }
.flex-center-y-32 { display: flex; align-items: center; justify-content: center; margin: 32px 0; }
.divider-line { flex: 1; border: none; border-top: 1px dashed var(--border); }
.divider-text { padding: 0 16px; color: var(--text-sec); font-weight: 500; }
.text-center { text-align: center; }
.hidden { display: none !important; }

/* Custom extracted components */
.preview-context-box {
    background: var(--bg-primary);
    padding: 16px;
    border-radius: var(--radius);
    border: 1px dashed var(--border);
}
.partner-code-box {
    background: var(--bg-secondary);
    padding: 12px;
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid var(--border);
}
.partner-code-value {
    font-size: 1.25em;
    color: var(--text-sec);
    font-weight: 500;
}
.summary-textarea {
    font-family: var(--font-ui);
    line-height: 1.6;
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-left: 3px solid var(--emerald-500);
    resize: vertical;
    width: 100%;
    padding: 12px;
    border-radius: var(--radius-sm);
}
.admin-login-container { display: flex; flex-direction: column; align-items: center; padding-top: 60px; }
.admin-login-box { width: 100%; max-width: 400px; padding: 32px; text-align: center; }
.admin-login-icon { font-size: 3em; color: var(--color-primary); margin-bottom: 16px; }

/* ==========================================================
   APP LAYOUT & GLASS PANELS -> Now Solid Panels
========================================================= */
.app-container {
    display: flex;
    min-height: 100vh;
}

.glass-panel, .solid-panel {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    transition: background var(--transition), border var(--transition);
}

/* ==========================================================
   SIDEBAR
========================================================= */
.sidebar {
    width: 280px;
    position: fixed;
    height: 100vh;
    top: 0; left: 0;
    display: flex;
    flex-direction: column;
    padding: 24px 0;
    border-right: 1px solid var(--border);
    border-radius: 0;
    z-index: 100;
    background: var(--bg-secondary);
}

.sidebar-header {
    padding: 0 24px 32px;
    display: flex;
    align-items: center;
    gap: 12px;
}
.sidebar-header .logo-icon {
    font-size: 28px;
    color: var(--color-primary);
}
.logo-text {
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 1.2rem;
    letter-spacing: -0.5px;
}
.logo-text .acv { color: var(--color-primary); }
.logo-text .sub { color: var(--text-sec); font-weight: 500; }

.sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px;
}
.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: var(--text-sec);
    text-decoration: none;
    border-radius: var(--radius);
    font-weight: 500;
    transition: var(--transition);
    cursor: pointer;
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: 1rem;
    text-align: left;
}
.nav-item i { font-size: 20px; }
.nav-item:hover {
    background: rgba(3, 105, 161, 0.08); /* Primary color low opacity */
    color: var(--color-primary);
}
.nav-item.active {
    background: var(--bg-primary); /* Or a very light primary shade */
    color: var(--color-primary);
    border-left: 3px solid var(--color-primary);
}

.sidebar-footer {
    padding: 0 16px;
}
.user-badge {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--bg-primary);
    cursor: pointer;
    transition: var(--transition);
    border: 1px solid var(--border);
}
.user-badge:hover {
    background: var(--bg-card);
    border-color: var(--color-primary);
}
.avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(3, 105, 161, 0.1);
    color: var(--color-primary);
    display: flex; align-items: center; justify-content: center;
}
.user-info { flex: 1; overflow: hidden; }
.user-info .name {
    display: block; font-weight: 600; font-size: 0.9rem;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.user-info .dept {
    display: block; font-size: 0.75rem; color: var(--text-sec);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ==========================================================
   MAIN CONTENT
========================================================= */
.main-content {
    flex: 1;
    margin-left: 280px;
    padding: 32px 40px;
    max-width: 1400px;
}

.view-section { display: none; animation: fadeIn 0.3s ease; }
.view-section.active { display: block; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.view-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
}
.view-header h1 {
    font-size: 1.8rem; margin-bottom: 4px; color: var(--text-primary);
}
.view-desc { color: var(--text-sec); }
.header-actions { display: flex; gap: 12px; }

/* ==========================================================
   DASHBOARD STATS
========================================================= */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
}
.stat-card {
    display: flex;
    align-items: center;
    padding: 24px;
    gap: 20px;
}
.stat-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
}
.stat-blue { background: rgba(3, 105, 161, 0.1); color: var(--color-primary); }
.stat-emerald { background: rgba(16, 185, 129, 0.1); color: var(--emerald-500); }
.stat-amber { background: rgba(245, 158, 11, 0.1); color: var(--amber-500); }

.stat-data h3 {
    font-size: 0.85rem; color: var(--text-sec);
    text-transform: uppercase; font-weight: 600; font-family: var(--font-ui);
}
.stat-data h2 {
    font-size: 1.8rem; margin-top: 4px; font-family: var(--font-data);
}

/* ==========================================================
   DATA TABLE
========================================================= */
.content-panel { padding: 24px; }
.table-toolbar {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px; gap: 16px;
    flex-wrap: wrap;
}
.search-box {
    position: relative; flex: 1; max-width: 400px;
}
.search-box i {
    position: absolute; left: 16px; top: 50%;
    transform: translateY(-50%); color: var(--text-sec);
}
.search-box input {
    width: 100%; height: 40px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0 16px 0 44px;
    color: var(--text-primary); font-family: var(--font-ui);
    transition: var(--transition);
}
.search-box input:focus {
    outline: none; border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--conf-high);
}

.table-container { overflow-x: auto; }
.data-table {
    width: 100%; border-collapse: collapse; text-align: left;
}
.data-table th {
    padding: 12px 16px; font-size: 0.85rem;
    color: var(--text-sec); font-weight: 600; text-transform: uppercase;
    border-bottom: 2px solid var(--border); font-family: var(--font-ui);
}
.data-table td {
    padding: 16px; border-bottom: 1px solid var(--border);
    font-size: 0.95rem; vertical-align: middle;
}
.data-table tbody tr { transition: var(--transition); cursor: pointer; }
.data-table tbody tr:hover { background: var(--bg-primary); }

.text-right { text-align: right; }

.font-data { font-family: var(--font-data); }

/* Pagination Controls */
.pagination-controls { border-top: 1px solid var(--border); padding-top: 16px; }

/* ==========================================================
   FORMS & INPUTS
========================================================= */
.form-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;
}
.form-section { padding-bottom: 24px; border-bottom: 1px dashed var(--border); margin-bottom: 24px; }
.form-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.form-section h3 {
    font-size: 1.1rem; color: var(--color-primary); margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px; font-family: var(--font-heading);
}

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.9rem; font-weight: 500; color: var(--text-sec); }
.form-control, select, textarea {
    height: 44px; padding: 0 16px; font-family: inherit; font-size: 0.95rem;
    background: var(--bg-primary); color: var(--text-primary);
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    transition: var(--transition);
}
textarea { height: auto; padding: 12px 16px; resize: vertical; }
.form-control:focus, select:focus, textarea:focus {
    outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--conf-high);
}
.form-control:read-only { background: var(--border); opacity: 0.7; cursor: not-allowed; }

/* Data source confidence styling */
.ai-source-success { border-left: 3px solid var(--emerald-500); background: var(--conf-high); }
.ai-source-warning { border-left: 3px solid var(--amber-500); background: var(--conf-med); }

/* ==========================================================
   UPLOAD ZONE
========================================================= */
.upload-container {
    padding: 40px; text-align: center; border: 2px dashed var(--border);
    background: var(--bg-primary); transition: var(--transition);
}
.upload-container.dragover {
    border-color: var(--color-primary); background: rgba(3, 105, 161, 0.05);
}
.upload-icon { font-size: 48px; color: var(--color-primary); margin-bottom: 16px; }
.upload-hint { color: var(--text-sec); font-size: 0.95rem; margin-top: 8px; }
.upload-limit { color: var(--text-sec); font-size: 0.8rem; margin-top: 4px; opacity: 0.7; }

/* Status Bar */
.ai-status-bar {
    background: var(--bg-primary); padding: 16px 24px; display: flex; align-items: center; gap: 16px;
    border-left: 4px solid var(--blue-500); border-radius: var(--radius);
}
.status-spinner { animation: spin 1s linear infinite; font-size: 24px; color: var(--blue-500); }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ==========================================================
   BUTTONS
========================================================= */
.btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 8px; height: 44px; padding: 0 20px;
    font-family: var(--font-ui); font-weight: 500; font-size: 0.95rem;
    border-radius: var(--radius-sm); border: none; cursor: pointer;
    transition: var(--transition);
}
.btn:hover { background: var(--border); }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); color: #fff; }
.btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); }
.btn-secondary:hover:not(:disabled) { background: var(--bg-primary); border: 1px solid var(--color-primary); }
.btn-outline { background: transparent; color: var(--text-primary); border: 1px solid var(--border); }
.btn-outline:hover:not(:disabled) { background: var(--bg-primary); border: 1px solid var(--color-primary); }
.btn-block { width: 100%; }

/* ==========================================================
   MODALS & TOASTS
========================================================= */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
    background: var(--bg-card); width: 90%; max-width: 500px;
    padding: 32px; border-radius: var(--radius); border: 1px solid var(--border);
    box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

/* Toast Container */
#toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 12px; }
.toast {
    display: flex; align-items: center; gap: 12px; padding: 16px 20px;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text-primary);
    box-shadow: var(--shadow); width: 320px;
    transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast.show { transform: translateX(0); }
.toast-icon { font-size: 24px; }
.toast-success .toast-icon { color: var(--emerald-500); }
.toast-error .toast-icon { color: var(--red-500); }
.toast-info .toast-icon { color: var(--color-primary); }

/* ==========================================================
   RESPONSIVE DESIGN 
========================================================= */
@media (max-width: 1024px) {
    .sidebar { width: 240px; }
    .main-content { margin-left: 240px; padding: 24px; }
}

@media (max-width: 768px) {
    .app-container { flex-direction: column; }
    .sidebar { 
        width: 100%; height: auto; position: static; 
        padding: 16px; border-right: none; border-bottom: 1px solid var(--border);
    }
    .main-content { margin-left: 0; padding: 16px; }
    .form-grid { grid-template-columns: 1fr; }
    .table-container { padding-bottom: 16px; }
    .table-toolbar { flex-direction: column; align-items: stretch; }
}
`;

fs.writeFileSync('css/styles.css', css);
console.log('Saved css/styles.css');
