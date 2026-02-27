const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. html tag
html = html.replace('<html lang="vi">', '<html lang="vi" data-theme="light">');

// 2. fonts
const oldFontsPattern = /<link[^>]*family=Inter[^>]*JetBrains\+Mono[^>]*rel="stylesheet"[^>]*>/i;
const newFonts = `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Lexend:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">`;
html = html.replace(oldFontsPattern, newFonts);

// 3. inline styles mapping
const styleReplacements = {
    'style="color: var(--text-sec);"': 'class="text-sec"',
    'style="display: flex; align-items: center; justify-content: center; margin: 32px 0;"': 'class="flex-center-y-32"',
    'style="flex: 1; border: none; border-top: 1px dashed var(--border);"': 'class="divider-line"',
    'style="padding: 0 16px; color: var(--text-sec); font-weight: 500;"': 'class="divider-text"',
    'style="background: rgba(10, 14, 26, 0.4); padding: 16px; border-radius: 8px; border: 1px dashed var(--border);"': 'class="preview-context-box"',
    'style="font-size: 0.8em; color: var(--text-sec);"': 'class="text-sm text-sec"',
    'style="background: var(--bg-primary); padding: 12px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between;"': 'class="partner-code-box"',
    'style="font-size: 1.25em; color: var(--text-sec); font-weight: normal;"': 'class="partner-code-value"',
    'style="color: var(--emerald-500)"': 'class="text-emerald"',
    'style="font-family: inherit; line-height: 1.6; background: rgba(16, 185, 129, 0.05); color: var(--text-primary); border: 1px dashed var(--emerald-500); resize: none;"': 'class="summary-textarea"',
    'style="display: flex; flex-direction: column; align-items: center; padding-top: 60px;"': 'class="admin-login-container"',
    'style="width: 100%; max-width: 400px; padding: 32px; text-align: center;"': 'class="admin-login-box"',
    'style="font-size: 3em; color: var(--color-blue); margin-bottom: 16px;"': 'class="admin-login-icon"',
    'style="color: var(--color-amber)"': 'class="text-amber"',
    'style="max-width: 400px;"': 'class="max-w-400"',
    'style="gap: 8px;"': 'class="gap-8"',
    'style="display: flex; gap: 8px;"': 'class="flex-gap-8"',
    'style="flex: 1;"': 'class="flex-1"',
    'style="white-space: nowrap;"': 'class="whitespace-nowrap"',
    'style="font-size: 0.8rem; color: var(--text-sec); margin-top: 4px;"': 'class="text-xs text-sec mt-4"',
    'style="opacity: 0.6"': 'class="opacity-60"',
    'style="display: flex; justify-content: space-between; align-items: center;"': 'class="flex-between-center"',
    'style="width: 150px"': 'class="w-150"',
    'style="width: 60px"': 'class="w-60"',
    'style="width: 100px"': 'class="w-100"',
    'style="max-width: 500px"': 'class="max-w-500"'
};

for (const [oldStyle, newClass] of Object.entries(styleReplacements)) {
    // Escape standard chars or just straight replace using split/join to replace all occurrences
    html = html.split(oldStyle).join(newClass);
}

// Ensure old style string like class="foo" style="..." are merged properly.
// Example: `<a href="..." class="text-sm" class="text-sec">` isn't valid, but it will work for most browsers. 
// A better way is to do manual `className +=` but for simplicity, we'll fix it by merging classes if they appear adjacent.
html = html.replace(/class="([^"]+)"\s*class="([^"]+)"/g, 'class="$1 $2"');

// 4. Add pagination controls
const paginationHTML = `
                    <div class="pagination-controls mt-24 flex-between-center" id="paginationControls" style="display:none;">
                        <span class="text-sec text-sm" id="page-info">Hiển thị 1-10 của 24 Hợp đồng</span>
                        <div class="flex-gap-8 align-center">
                            <select id="pageSize" class="form-control flex-1" style="min-width:70px; padding:4px 8px; height:auto;">
                                <option value="10">10 / trang</option>
                                <option value="25">25 / trang</option>
                                <option value="50">50 / trang</option>
                                <option value="100">100 / trang</option>
                            </select>
                            <button class="btn btn-outline" id="btn-prev-page" title="Trang trước"><i class="ph ph-caret-left"></i></button>
                            <button class="btn btn-outline" id="btn-next-page" title="Trang sau"><i class="ph ph-caret-right"></i></button>
                        </div>
                    </div>`;

// Insert after table-container
html = html.replace('</div>\n                </div>\n            </section>', '</div>' + paginationHTML + '\n                </div>\n            </section>');

// 5. Add Theme toggle button
const themeToggleHTML = `
            <div class="sidebar-theme-toggle mb-16 px-16">
                <button id="themeToggleBtn" class="nav-item w-100 flex-between-center">
                    <span><i class="ph ph-sun" id="themeIcon"></i> Sáng / Tối</span>
                </button>
            </div>
`;
// Insert before sidebar-footer
html = html.replace('<div class="sidebar-footer">', themeToggleHTML + '\n            <div class="sidebar-footer">');

// Convert glow-blob to a generic background
html = html.replace('<div class="glow-bg">', '<div class="app-background">');
html = html.replace(/<div class="glow-blob blob-\d"><\/div>/g, '');

fs.writeFileSync('index.html', html);
console.log('Refactored index.html');
