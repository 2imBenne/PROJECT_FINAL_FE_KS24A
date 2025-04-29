// Trello Clone JS - Responsive Sidebar Toggle

document.addEventListener('DOMContentLoaded', function() {
    console.log('Trello clone page loaded.');

    const menuToggleBtn = document.querySelector('.menu-toggle-btn');
    const sidebarCloseBtn = document.querySelector('.sidebar-close-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    function openSidebar() {
        if (sidebar && overlay) {
            sidebar.classList.add('open');
            overlay.classList.add('visible');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    }

    function closeSidebar() {
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
            document.body.style.overflow = ''; // Restore background scroll
        }
    }

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', openSidebar);
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Đổi ảnh nền từng card (dùng prompt, đổi src của img)
    document.querySelectorAll('.board-card').forEach(card => {
        const changeBtn = card.querySelector('.change-img-btn');
        const img = card.querySelector('.board-img');
        if (changeBtn && img) {
            changeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const link = prompt('Paste image link (URL hoặc data:image/base64):');
                if (link && link.trim()) {
                    img.src = link.trim();
                }
            });
        }
    });

    // Đăng xuất
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    renderBoards();
    setupModalSelectEvents();
    setupModalEvents();
    setupBoardCardEvents();
    setupSidebarFilterEvents();
});

// ===== BOARD LOGIC (CREATE, UPDATE, DELETE, RENDER) =====

// Helper: Lấy danh sách board từ localStorage
function getBoards() {
    let boards = JSON.parse(localStorage.getItem('boards') || '[]');
    // Đảm bảo mỗi board có thuộc tính starred và closed
    boards = boards.map(b => ({...b, starred: !!b.starred, closed: !!b.closed}));
    return boards;
}

// Helper: Lưu danh sách board vào localStorage
function saveBoards(boards) {
    localStorage.setItem('boards', JSON.stringify(boards));
}

// Helper: Tạo id ngẫu nhiên cho board
function generateBoardId() {
    return 'board_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// Render boards cho từng loại: all, starred, closed
function renderBoards(filter = 'all') {
    const boards = getBoards();
    const workspacesSection = document.querySelector('.boards-section:not(.boards-section-starred):not(.boards-section-closed)');
    const starredSection = document.querySelector('.boards-section-starred');
    const closedSection = document.querySelector('.boards-section-closed');
    const workspacesGrid = workspacesSection.querySelector('.boards-grid');
    const starredGrid = starredSection.querySelector('.boards-grid');
    const closedGrid = closedSection.querySelector('.boards-grid');
    if (!workspacesGrid || !starredGrid || !closedGrid) return;

    // Lọc boards
    let workspaceBoards = boards.filter(b => !b.closed);
    let starredBoards = boards.filter(b => b.starred && !b.closed);
    let closedBoards = boards.filter(b => b.closed);

    // Hiển thị/ẩn section theo filter
    if (filter === 'all') {
        workspacesSection.style.display = '';
        // Ẩn Starred section nếu không có board starred
        starredSection.style.display = starredBoards.length > 0 ? '' : 'none';
        closedSection.style.display = 'none';
    } else if (filter === 'starred') {
        workspacesSection.style.display = 'none';
        starredSection.style.display = '';
        closedSection.style.display = 'none';
    } else if (filter === 'closed') {
        workspacesSection.style.display = 'none';
        starredSection.style.display = 'none';
        closedSection.style.display = '';
    }

    // Render Workspaces
    let html = workspaceBoards.map(board => `
        <div class="board-card board-card-image" data-id="${board.id}">
            <div class="board-card-overlay"></div>
            <img class="board-img" src="${board.background}" alt="Board" />
            <div class="board-card-content">
                <h3 class="board-title">${board.title}</h3>
                <div class="board-card-actions" style="display:flex;gap:8px;">
                    <button class="btn btn-edit btn-board-card"><i class="fas fa-pencil-alt"></i> Edit this board</button>
                    <button class="btn btn-delete btn-board-card" style="background:#e74c3c;color:#fff;"><i class="fas fa-trash"></i></button>
                    <button class="btn btn-star btn-board-card" style="color:${board.starred ? '#FFA800' : '#bbb'}"><i class="fas fa-star"></i></button>
                    
                </div>
                <button class="btn btn-close btn-board-card" style=" margin-top: 5px;background:#f1c40f;color:#fff;"><i class="fas fa-box-archive"></i> Close</button>
            </div>
        </div>
    `).join('');
    // Chỉ render nút tạo mới ở Workspaces
    if (filter === 'all') {
        html += `<div class="board-card create-board-card"><button class="btn btn-create-outline">Create new board</button></div>`;
    }
    workspacesGrid.innerHTML = html;

    // Render Starred
    let starredHtml = starredBoards.map(board => `
        <div class="board-card board-card-image" data-id="${board.id}">
            <div class="board-card-overlay"></div>
            <img class="board-img" src="${board.background}" alt="Board" />
            <div class="board-card-content">
                <h3 class="board-title">${board.title}</h3>
                <div class="board-card-actions" style="display:flex;gap:8px;">
                    <button class="btn btn-edit btn-board-card"><i class="fas fa-pencil-alt"></i> Edit this board</button>
                    <button class="btn btn-delete btn-board-card" style="background:#e74c3c;color:#fff;"><i class="fas fa-trash"></i></button>
                    <button class="btn btn-star btn-board-card" style="color:#FFA800"><i class="fas fa-star"></i></button>
                </div>
                                <button class="btn btn-close btn-board-card" style=" margin-top: 5px;background:#f1c40f;color:#fff;"><i class="fas fa-box-archive"></i> Close</button>

            </div>
        </div>
    `).join('');
    starredGrid.innerHTML = starredHtml;

    // Render Closed
    let closedHtml = closedBoards.map(board => `
        <div class="board-card board-card-image" data-id="${board.id}">
            <div class="board-card-overlay"></div>
            <img class="board-img" src="${board.background}" alt="Board" />
            <div class="board-card-content">
                <h3 class="board-title">${board.title}</h3>
                <div class="board-card-actions" style="display:flex;gap:8px;">
                    <button class="btn btn-edit btn-board-card"><i class="fas fa-pencil-alt"></i> Edit this board</button>
                    <button class="btn btn-delete btn-board-card" style="background:#e74c3c;color:#fff;"><i class="fas fa-trash"></i></button>
                    <button class="btn btn-star btn-board-card" style="color:${board.starred ? '#FFA800' : '#bbb'}"><i class="fas fa-star"></i></button>
                </div>
                                <button class="btn btn-close btn-board-card" style=" margin-top: 5px;background:#f1c40f;color:#fff;"><i class="fas fa-box-archive"></i>Re Open</button>

            </div>
        </div>
    `).join('');
    closedGrid.innerHTML = closedHtml;
}

// Hiển thị modal tạo board
function showCreateModal() {
    const modal = document.getElementById('modal-create-board');
    if (modal) {
        modal.style.display = 'flex';
        resetCreateModal();
    }
}

// Ẩn modal tạo board
function hideCreateModal() {
    const modal = document.getElementById('modal-create-board');
    if (modal) {
        modal.style.display = 'none';
        resetCreateModal(); // Reset trạng thái khi đóng modal
    }
}

// Reset modal tạo board
function resetCreateModal() {
    const titleInput = document.getElementById('modal-board-title-input');
    const titleError = document.getElementById('modal-board-title-error');
    const createBtn = document.querySelector('.modal-board-btn-create');

    if (titleInput) titleInput.value = '';
    if (titleError) titleError.style.display = 'none';
    
    document.querySelectorAll('.modal-board-bg-option').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.modal-board-color-option').forEach(btn => btn.classList.remove('selected'));

    // Reset nút Create/Save về trạng thái Create
    if (createBtn) {
        createBtn.textContent = 'Create';
        createBtn.onclick = handleCreateBoard; // Gắn lại sự kiện tạo board
    }
}

// Lấy dữ liệu từ modal tạo board
function getCreateModalData() {
    const title = document.getElementById('modal-board-title-input').value.trim();
    const bgBtn = document.querySelector('.modal-board-bg-option.selected');
    const colorBtn = document.querySelector('.modal-board-color-option.selected');
    return {
        title,
        background: bgBtn ? bgBtn.style.backgroundImage.replace('url("','').replace('")','').replace("url('",'').replace("')",'') : '',
        color: colorBtn ? colorBtn.getAttribute('data-color') : ''
    };
}

// Sự kiện chọn background/color trong modal
function setupModalSelectEvents() {
    document.querySelectorAll('.modal-board-bg-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal-board-bg-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    document.querySelectorAll('.modal-board-color-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal-board-color-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

// Xử lý tạo board
function handleCreateBoard() {
    const data = getCreateModalData();
    if (!data.title) {
        document.getElementById('modal-board-title-error').style.display = 'flex';
        return;
    }
    const boards = getBoards();
    boards.push({
        id: generateBoardId(),
        title: data.title,
        background: data.background || 'https://photo.znews.vn/w660/Uploaded/mdf_eioxrd/2021_07_06/2.jpg',
        color: data.color || '#FFA800'
    });
    saveBoards(boards);
    hideCreateModal();
    renderBoards();
}

// Xử lý update board
function handleUpdateBoard(id) {
    const data = getCreateModalData();
    if (!data.title) {
        document.getElementById('modal-board-title-error').style.display = 'flex';
        return;
    }
    let boards = getBoards();
    boards = boards.map(b => b.id === id ? { ...b, ...data } : b);
    saveBoards(boards);
    hideCreateModal();
    renderBoards();
}

// Modal xác nhận xoá board
let deleteBoardId = null;
function showDeleteConfirmModal(boardId) {
    deleteBoardId = boardId;
    const modal = document.getElementById('modal-confirm-delete');
    if (modal) modal.style.display = 'flex';
}
function hideDeleteConfirmModal() {
    deleteBoardId = null;
    const modal = document.getElementById('modal-confirm-delete');
    if (modal) modal.style.display = 'none';
}
function confirmDeleteBoard() {
    if (!deleteBoardId) return;
    let boards = getBoards();
    boards = boards.filter(b => b.id !== deleteBoardId);
    saveBoards(boards);
    hideDeleteConfirmModal();
    renderBoards(currentFilter);
}

// Sự kiện cho modal create/update
function setupModalEvents() {
    const modal = document.getElementById('modal-create-board');
    // Nút mở modal tạo
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-create-outline')) {
            showCreateModal();
        }
    });
    // Đóng modal khi click vào nút Close, Cancel hoặc vùng ngoài modal
    document.addEventListener('click', function(e) {
        const closeBtn = e.target.closest('.modal-board-close');
        const cancelBtn = e.target.closest('.modal-board-btn-cancel');
        const modalOverlay = e.target === modal;
        if (closeBtn || cancelBtn || modalOverlay) {
            hideCreateModal();
        }
    });
    // Đóng modal khi nhấn phím Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            hideCreateModal();
        }
    });
    // Modal confirm delete
    const confirmModal = document.getElementById('modal-confirm-delete');
    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-confirm-btn-yes')) {
                confirmDeleteBoard();
            }
            if (e.target.classList.contains('modal-confirm-btn-cancel') || e.target === confirmModal) {
                hideDeleteConfirmModal();
            }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && confirmModal.style.display === 'flex') {
                hideDeleteConfirmModal();
            }
        });
    }
}

// Sự kiện cho edit/delete/star/close/reopen/click board
function setupBoardCardEvents() {
    document.querySelectorAll('.boards-section .boards-grid').forEach(grid => {
        grid.addEventListener('click', function(e) {
            const card = e.target.closest('.board-card[data-id]');
            if (!card) return;
            const id = card.getAttribute('data-id');
            // Nếu click vào nút edit, delete, star thì xử lý như cũ
            if (e.target.classList.contains('btn-edit') || e.target.closest('.btn-edit')) {
                const boards = getBoards();
                const board = boards.find(b => b.id === id);
                if (!board) return;
                showCreateModal();
                document.getElementById('modal-board-title-input').value = board.title;
                document.querySelectorAll('.modal-board-bg-option').forEach(btn => {
                    const bgImage = btn.style.backgroundImage.replace('url(\"','').replace('\")','').replace("url('",'').replace("')",'');
                    btn.classList.toggle('selected', bgImage === board.background);
                });
                document.querySelectorAll('.modal-board-color-option').forEach(btn => {
                    btn.classList.toggle('selected', btn.getAttribute('data-color') === board.color);
                });
                const createBtn = document.querySelector('.modal-board-btn-create');
                createBtn.textContent = 'Save';
                createBtn.onclick = function() {
                    handleUpdateBoard(id);
                };
                return;
            }
            if (e.target.classList.contains('btn-delete') || e.target.closest('.btn-delete')) {
                showDeleteConfirmModal(id);
                return;
            }
            if (e.target.classList.contains('btn-star') || e.target.closest('.btn-star')) {
                let boards = getBoards();
                boards = boards.map(b => b.id === id ? { ...b, starred: !b.starred } : b);
                saveBoards(boards);
                renderBoards(currentFilter);
                return;
            }
            // Đóng board hoặc Re Open
            if (e.target.classList.contains('btn-close') || e.target.closest('.btn-close')) {
                if (card.closest('.boards-section-closed')) {
                    let boards = getBoards();
                    boards = boards.map(b => b.id === id ? { ...b, closed: false } : b);
                    saveBoards(boards);
                    currentFilter = 'all';
                    renderBoards(currentFilter);
                    return;
                } else {
                    let boards = getBoards();
                    boards = boards.map(b => b.id === id ? { ...b, closed: true } : b);
                    saveBoards(boards);
                    renderBoards(currentFilter);
                    return;
                }
            }
            // Nếu click vào vùng card (không phải nút), chuyển sang board.html?id=...
            if (e.target === card || e.target.closest('.board-card-content') || e.target.closest('.board-title')) {
                window.location.href = `board.html?id=${id}`;
            }
        });
    });
}

// Sidebar filter
let currentFilter = 'all';
function setupSidebarFilterEvents() {
    const sidebar = document.querySelector('.sidebar-nav');
    if (!sidebar) return;
    sidebar.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        sidebar.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        const linkText = link.textContent.trim(); // Chuẩn hóa text bằng trim()
        console.log('Link text:', linkText); // Debug giá trị sau khi chuẩn hóa
        link.classList.add('active');
        if (linkText === 'Boards') {
            currentFilter = 'all';
            console.log('Filter:', currentFilter);
        } else if (linkText === 'Starred Boards') {
            currentFilter = 'starred';
            console.log('Filter:', currentFilter);
        } else if (linkText === 'Closed Boards') {
            currentFilter = 'closed';
            console.log('Filter:', currentFilter);
        }
        renderBoards(currentFilter);
    });
}