// board.js - Render sidebar boards, board title, kanban lists, and handle modals

document.addEventListener('DOMContentLoaded', function() {
  // Lấy id board từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const boardId = urlParams.get('id');

  // Lấy danh sách board từ localStorage
  function getBoards() {
    let boards = JSON.parse(localStorage.getItem('boards') || '[]');
    return boards.map(b => ({ ...b, starred: !!b.starred, closed: !!b.closed }));
  }

  // Lưu danh sách board vào localStorage
  function saveBoards(boards) {
    localStorage.setItem('boards', JSON.stringify(boards));
  }

  // Lấy dữ liệu lists và tasks của board từ localStorage
  function getBoardData(boardId) {
    const data = JSON.parse(localStorage.getItem(`board_${boardId}`) || '[]');
    return data.map(list => ({
      ...list,
      cards: (list.cards || []).map(card => ({
        ...card,
        completed: !!card.completed
      }))
    }));
  }

  // Lưu dữ liệu lists và tasks của board vào localStorage
  function saveBoardData(boardId, data) {
    localStorage.setItem(`board_${boardId}`, JSON.stringify(data));
  }

  // Tạo id ngẫu nhiên
  function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  // Render danh sách board ở sidebar
  function renderSidebarBoards(currentId) {
    const boards = getBoards();
    const list = document.getElementById('sidebarBoardsList');
    if (!list) return;
    list.innerHTML = `<div class="sidebar-list-header"><span>Your boards</span><button class="btn btn-add-board" title="Add board"><i class="fas fa-plus"></i></button></div>` + 
      boards.map(b => `
        <div class="sidebar-board-item${b.id === currentId ? ' active' : ''}" data-id="${b.id}">
          <img class="sidebar-board-thumb" src="${b.background || ''}" alt="" />
          <span>${b.title}</span>
        </div>
      `).join('');
    // Sự kiện click chuyển board
    list.querySelectorAll('.sidebar-board-item').forEach(item => {
      item.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        if (id !== currentId) {
          window.location.href = `board.html?id=${id}`;
        }
      });
    });
    // Sự kiện thêm board mới
    list.querySelector('.btn-add-board').addEventListener('click', function() {
      showAddBoardModal();
    });
  }

  // Render tiêu đề board và trạng thái starred
  function renderBoardTitle(currentId) {
    const boards = getBoards();
    const board = boards.find(b => b.id === currentId);
    if (!board) return;
    const titleElement = document.getElementById('boardTitle');
    const starBtn = document.getElementById('starBoardBtn');
    titleElement.textContent = board.title;
    if (board.starred) {
      starBtn.classList.add('starred');
      starBtn.querySelector('i').classList.replace('far', 'fas');
    }
    starBtn.addEventListener('click', function() {
      board.starred = !board.starred;
      saveBoards(boards);
      renderSidebarBoards(currentId);
      renderBoardTitle(currentId);
    });
  }

  // Render kanban lists
  function renderKanban(boardId, filters = {}) {
    let lists = getBoardData(boardId);
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    // Áp dụng bộ lọc
    lists = lists.map(list => ({
      ...list,
      cards: list.cards.filter(card => {
        // Lọc theo từ khóa
        if (filters.keyword && !card.text.toLowerCase().includes(filters.keyword.toLowerCase())) {
          return false;
        }
        // Lọc theo trạng thái
        if (filters.statusComplete && !filters.statusIncomplete && !card.completed) {
          return false;
        }
        if (filters.statusIncomplete && !filters.statusComplete && card.completed) {
          return false;
        }
        return true;
      })
    }));

    board.innerHTML = lists.map(list => `
      <div class="kanban-list" data-list-id="${list.id}">
        <div class="kanban-list-header">
          <div class="kanban-list-title">${list.title}</div>
          <div class="kanban-list-actions">
            <button class="kanban-list-action-btn btn-edit-list"><i class="fas fa-pen"></i></button>
            <button class="kanban-list-action-btn btn-delete-list"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="kanban-cards">
          ${list.cards.map(card => `
            <div class="kanban-card${card.completed ? ' completed' : ''}" data-card-id="${card.id}">
              ${card.completed ? '<i class="fas fa-check-circle"></i>' : ''}
              ${card.text}
            </div>
          `).join('')}
        </div>
        <button class="btn-add-card"><i class="fas fa-plus"></i> Add a card</button>
      </div>
    `).join('') + `
      <div class="add-list-container">
        <button class="btn-add-list"><i class="fas fa-plus"></i> Add another list</button>
      </div>
    `;

    setupKanbanEvents(boardId);
  }

  // Sự kiện cho kanban board
  function setupKanbanEvents(boardId) {
    // Thêm list
    document.querySelector('.btn-add-list').addEventListener('click', function() {
      showListModal('Add list', '', boardId);
    });

    // Thêm card
    document.querySelectorAll('.btn-add-card').forEach(btn => {
      btn.addEventListener('click', function() {
        const listId = this.closest('.kanban-list').getAttribute('data-list-id');
        showAddCardModal(listId, boardId, null, 'Add card');
      });
    });

    // Sửa list
    document.querySelectorAll('.btn-edit-list').forEach(btn => {
      btn.addEventListener('click', function() {
        const listElement = this.closest('.kanban-list');
        const listId = listElement.getAttribute('data-list-id');
        const lists = getBoardData(boardId);
        const list = lists.find(l => l.id === listId);
        showListModal('Edit list', list.title, boardId, listId);
      });
    });

    // Xóa list
    document.querySelectorAll('.btn-delete-list').forEach(btn => {
      btn.addEventListener('click', function() {
        const listId = this.closest('.kanban-list').getAttribute('data-list-id');
        showConfirmDeleteListModal(boardId, listId);
      });
    });

    // Sửa card
    document.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('click', function() {
        const listId = this.closest('.kanban-list').getAttribute('data-list-id');
        const cardId = this.getAttribute('data-card-id');
        const lists = getBoardData(boardId);
        const list = lists.find(l => l.id === listId);
        const cardData = list.cards.find(c => c.id === cardId);
        showAddCardModal(listId, boardId, cardData, 'Edit card', cardId);
      });
    });
  }

  // Modal thêm/sửa card
  function showAddCardModal(listId, boardId, cardData = null, action = 'Add card', cardId = null) {
    const modal = document.getElementById('modalAddCard');
    const modalInput = document.getElementById('modalAddCardInput');
    const modalSubmit = document.getElementById('modalAddCardSubmit');
    const modalForm = document.getElementById('modalAddCardForm');

    modalInput.value = cardData ? cardData.text : '';
    modalSubmit.textContent = action;
    modal.style.display = 'flex';
    modalInput.focus();

    modalForm.onsubmit = function(e) {
      e.preventDefault();
      const title = modalInput.value.trim();
      if (!title) return;

      let lists = getBoardData(boardId);
      lists = lists.map(list => {
        if (list.id === listId) {
          if (cardId) {
            // Sửa card
            list.cards = list.cards.map(card =>
              card.id === cardId ? { ...card, text: title } : card
            );
          } else {
            // Thêm card mới
            list.cards.push({
              id: generateId('card'),
              text: title,
              completed: false
            });
          }
        }
        return list;
      });
      saveBoardData(boardId, lists);
      hideModal(modal);
      renderKanban(boardId);
    };

    document.getElementById('modalAddCardCancel').onclick = () => hideModal(modal);
  }

  // Modal thêm/sửa list
  function showListModal(title, listTitle = '', boardId, listId = null) {
    const modal = document.getElementById('modalList');
    const modalTitle = document.getElementById('modalListTitle');
    const modalInput = document.getElementById('modalListInput');
    const modalError = document.getElementById('modalListError');
    const modalForm = document.getElementById('modalListForm');
    const modalSubmit = document.getElementById('modalListSubmit');

    modalTitle.textContent = title;
    modalInput.value = listTitle;
    modalError.style.display = 'none';
    modal.style.display = 'flex';

    modalForm.onsubmit = function(e) {
      e.preventDefault();
      const title = modalInput.value.trim();
      if (!title) {
        modalError.style.display = 'block';
        return;
      }
      let lists = getBoardData(boardId);
      if (listId) {
        lists = lists.map(l => l.id === listId ? { ...l, title } : l);
      } else {
        lists.push({ id: generateId('list'), title, cards: [] });
      }
      saveBoardData(boardId, lists);
      hideModal(modal);
      renderKanban(boardId);
    };

    document.getElementById('modalListCancel').onclick = () => hideModal(modal);
  }

  // Modal xác nhận xóa list
  function showConfirmDeleteListModal(boardId, listId) {
    const modal = document.getElementById('modalConfirmDeleteList');
    modal.style.display = 'flex';

    document.getElementById('btnDeleteList').onclick = function() {
      let lists = getBoardData(boardId);
      lists = lists.filter(l => l.id !== listId);
      saveBoardData(boardId, lists);
      hideModal(modal);
      renderKanban(boardId);
    };

    document.getElementById('btnCancelDeleteList').onclick = () => hideModal(modal);
  }

  // Modal bộ lọc
  function showFilterModal(boardId) {
    const modal = document.getElementById('modalFilter');
    modal.style.display = 'flex';

    const keywordInput = document.getElementById('filterKeywordInput');
    const statusComplete = document.getElementById('filterStatusComplete');
    const statusIncomplete = document.getElementById('filterStatusIncomplete');

    document.getElementById('btnApplyFilter').onclick = function() {
      const filters = {
        keyword: keywordInput.value.trim(),
        statusComplete: statusComplete.checked,
        statusIncomplete: statusIncomplete.checked
      };
      renderKanban(boardId, filters);
      hideModal(modal);
    };

    document.getElementById('btnCancelFilter').onclick = () => {
      renderKanban(boardId);
      hideModal(modal);
    };
  }

  // Modal thêm board mới
  function showAddBoardModal() {
    const modal = document.getElementById('modalAddBoard');
    const modalTitle = document.getElementById('modalAddBoardTitle');
    const modalStarred = document.getElementById('modalAddBoardStarred');
    const modalError = document.getElementById('modalAddBoardError');
    const modalForm = document.getElementById('modalAddBoardForm');
    const backgroundOptions = document.querySelectorAll('.background-option');

    modalTitle.value = '';
    modalStarred.checked = false;
    modalError.style.display = 'none';
    modal.style.display = 'flex';

    let selectedBackground = '#0079bf'; // Mặc định chọn màu đầu tiên
    backgroundOptions.forEach(option => {
      option.classList.remove('selected');
      if (option.getAttribute('data-bg') === selectedBackground) {
        option.classList.add('selected');
      }
      option.addEventListener('click', function() {
        backgroundOptions.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        selectedBackground = this.getAttribute('data-bg');
      });
    });

    modalForm.onsubmit = function(e) {
      e.preventDefault();
      const title = modalTitle.value.trim();
      if (!title) {
        modalError.style.display = 'block';
        return;
      }
      let boards = getBoards();
      const newBoard = {
        id: generateId('board'),
        title,
        starred: modalStarred.checked,
        background: selectedBackground,
        closed: false
      };
      boards.push(newBoard);
      saveBoards(boards);
      saveBoardData(newBoard.id, []); // Tạo dữ liệu rỗng cho board mới
      hideModal(modal);
      window.location.href = `board.html?id=${newBoard.id}`;
    };

    document.getElementById('modalAddBoardCancel').onclick = () => hideModal(modal);
  }

  // Ẩn modal
  function hideModal(modal) {
    modal.style.display = 'none';
  }

  // Đóng board
  document.getElementById('closeBoardBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to close this board?')) {
      let boards = getBoards();
      boards = boards.map(b => b.id === boardId ? { ...b, closed: true } : b);
      saveBoards(boards);
      window.location.href = 'index.html';
    }
  });

  // Mở modal bộ lọc
  document.getElementById('filterBtn').addEventListener('click', function() {
    showFilterModal(boardId);
  });

  // Đăng xuất
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    });
  }

  renderSidebarBoards(boardId);
  renderBoardTitle(boardId);
  renderKanban(boardId);
});