/**
 * Dashboard & Stats View logic
 */
const dashboard = {
    allData: [],
    filteredData: [],
    currentPage: 1,
    pageSize: 10,

    init: () => {
        // Setup Search Box
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                dashboard.filterTable(term);
            });
        }

        // Setup Pagination Controls
        const pageSizeSelect = document.getElementById('pageSize');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                dashboard.pageSize = parseInt(e.target.value, 10);
                dashboard.currentPage = 1;
                dashboard.renderTable();
            });
        }

        const btnPrev = document.getElementById('btn-prev-page');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (dashboard.currentPage > 1) {
                    dashboard.currentPage--;
                    dashboard.renderTable();
                }
            });
        }

        const btnNext = document.getElementById('btn-next-page');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                const totalPages = Math.ceil(dashboard.filteredData.length / dashboard.pageSize);
                if (dashboard.currentPage < totalPages) {
                    dashboard.currentPage++;
                    dashboard.renderTable();
                }
            });
        }
    },

    loadData: async () => {
        ui.setLoading('view-dashboard', true);

        try {
            // Load list and stats fully
            const dataResult = await api.getAll();
            const statsResult = await api.getStats();

            dashboard.allData = dataResult.contracts || [];
            dashboard.filteredData = [...dashboard.allData];
            dashboard.currentPage = 1;

            // Render Stats Header
            document.getElementById('stat-total').textContent = statsResult.total || 0;
            const valVND = statsResult.totalValue || 0;
            document.getElementById('stat-value').textContent = new Intl.NumberFormat('vi-VN').format(valVND);
            document.getElementById('stat-files').textContent = statsResult.filesCount || 0;

            // Render table
            dashboard.renderTable();
        } catch (error) {
            console.error('Dashboard load failed:', error);
            ui.toast('Lỗi Dashboard', 'Không thể tải danh sách hợp đồng', 'error');
        } finally {
            ui.setLoading('view-dashboard', false);
        }
    },

    /**
     * Clear and rebuild DOM Table
     */
    renderTable: () => {
        const tbody = document.getElementById('table-body');
        const paginationControls = document.getElementById('paginationControls');
        const pageInfo = document.getElementById('page-info');
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (!dashboard.filteredData || dashboard.filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-sec" style="padding: 40px;">Chưa có dữ liệu nào phù hợp.</td></tr>`;
            if (paginationControls) paginationControls.style.display = 'none';
            return;
        }

        // Pagination math
        const totalItems = dashboard.filteredData.length;
        const totalPages = Math.ceil(totalItems / dashboard.pageSize);
        if (dashboard.currentPage > totalPages) dashboard.currentPage = totalPages;

        const startIndex = (dashboard.currentPage - 1) * dashboard.pageSize;
        const endIndex = Math.min(startIndex + dashboard.pageSize, totalItems);
        const pageData = dashboard.filteredData.slice(startIndex, endIndex);

        // Render rows
        pageData.forEach(c => {
            const tr = document.createElement('tr');

            // Format number
            let priceFormatted = "Đang cập nhật";
            if (c.contractValue) {
                const numeric = parseFloat(String(c.contractValue).replace(/,/g, ''));
                if (!isNaN(numeric)) {
                    priceFormatted = new Intl.NumberFormat('vi-VN').format(numeric);
                }
            }

            // Format link or no link
            let linkHtml = '<span class="text-sec text-sm">Không có</span>';
            if (c.fileUrl) {
                linkHtml = `<a href="${c.fileUrl}" target="_blank" class="btn btn-outline" style="padding: 4px 8px; height: auto;" title="Mở file trên Drive"><i class="ph ph-arrow-square-out"></i> Xem</a>`;
            }

            // Project fallback
            const entity = c.projectName || c.investorName || "N/A";

            tr.innerHTML = `
                <td class="font-data"><strong>${c.contractNumber || '---'}</strong></td>
                <td>${entity}</td>
                <td>${c.contractorName || '---'}</td>
                <td class="text-right font-data"><strong>${priceFormatted}</strong></td>
                <td class="text-center">${linkHtml}</td>
            `;

            tbody.appendChild(tr);
        });

        // Update Pagination UI
        if (paginationControls) {
            paginationControls.style.display = 'flex';
            if (pageInfo) {
                pageInfo.textContent = `Hiển thị ${startIndex + 1}-${endIndex} của ${totalItems} Hợp đồng`;
            }
            if (btnPrev) btnPrev.disabled = dashboard.currentPage === 1;
            if (btnNext) btnNext.disabled = dashboard.currentPage === totalPages;
        }
    },

    /**
     * Local client-side filter
     */
    filterTable: (term) => {
        if (!term) {
            dashboard.filteredData = [...dashboard.allData];
        } else {
            dashboard.filteredData = dashboard.allData.filter(c => {
                return (
                    (c.contractNumber || '').toLowerCase().includes(term) ||
                    (c.contractorName || '').toLowerCase().includes(term) ||
                    (c.projectName || '').toLowerCase().includes(term)
                );
            });
        }

        dashboard.currentPage = 1;
        dashboard.renderTable();
    }
};

window.dashboard = dashboard;
