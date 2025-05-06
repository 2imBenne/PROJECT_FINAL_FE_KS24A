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
        if (filters.keyword && !card.text.toLowerCase().includes(filters.keyword.toLowerCase())) {
          return false;
        }
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
            <button class="kanban-list-action-btn btn-edit-list"><i class="fas fa-ellipsis-h"></i></button>
            <div class="kanban-list-dropdown" style="display:none; position:absolute; right:8px; top:36px; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.15); border-radius:6px; witdh: 200px; z-index:10;">
              <button class="kanban-list-dropdown-rename" style="background:none; border:none; padding:8px 16px; width:100%; text-align:left; cursor:pointer;">Đổi tên list</button>
              <button class="kanban-list-dropdown-delete" style="color:#eb5a46; background:none; border:none; padding:8px 16px; width:100%; text-align:left; cursor:pointer;">Xóa list</button>
            </div>
          </div>
        </div>
        <div class="kanban-cards">
          ${list.cards.map(card => `
            <div class="kanban-card${card.completed ? ' completed' : ''}" data-card-id="${card.id}">
              <span class="kanban-card-content">
                ${card.completed ? '<i class=\'fas fa-check-circle\'></i>' : ''}
                <span class="kanban-card-text">${card.text}</span>
              </span>
              <span class="kanban-card-actions">
                <button class="kanban-card-btn btn-complete-card" title="Toggle complete"><i class="fas fa-check"></i></button>
                <button class="kanban-card-btn btn-edit-card" title="Edit"><i class="fas fa-pen"></i></button>
                <!-- <button class="kanban-card-btn btn-delete-card" title="Delete" style="background: #e74c3c; color: white; border: none; border-radius: 2px; cursor: pointer;">Delete</button> -->
              </span>
            </div>
          `).join('')}
        </div>
        <div class="kanban-add-card-block">
          <button class="btn-show-add-card"><i class="fas fa-plus"></i> Add a card</button>
          <form class="kanban-add-card-form" style="display:none" autocomplete="off">
            <input class="kanban-add-card-input" type="text" placeholder="Enter a title or paste a link" maxlength="100" />
            <div class="kanban-add-card-actions">
              <button type="submit" class="btn-add-card-main">Add card</button>
              <button type="button" class="btn-cancel-add-card"><i class="fas fa-times fa-lg"></i></button>
            </div>
          </form>
        </div>
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

    // Hiển thị form thêm card khi click '+ Add card'
    document.querySelectorAll('.kanban-list').forEach(listEl => {
      const btnShow = listEl.querySelector('.btn-show-add-card');
      const form = listEl.querySelector('.kanban-add-card-form');
      const input = form.querySelector('.kanban-add-card-input');
      const btnCancel = form.querySelector('.btn-cancel-add-card');
      btnShow.addEventListener('click', function() {
        btnShow.style.display = 'none';
        form.style.display = 'block';
        input.value = '';
        input.focus();
      });
      btnCancel.addEventListener('click', function() {
        form.style.display = 'none';
        btnShow.style.display = 'block';
      });
      // Khi submit xong thì ẩn form, hiện lại nút
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        const listId = listEl.getAttribute('data-list-id');
        let lists = getBoardData(boardId);
        lists = lists.map(list => {
          if (list.id === listId) {
            list.cards.push({ id: generateId('card'), text, completed: false });
          }
          return list;
        });
        saveBoardData(boardId, lists);
        renderKanban(boardId);
      });
    });

    // Sửa card trực tiếp
    document.querySelectorAll('.btn-edit-card').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const cardDiv = btn.closest('.kanban-card');
        const listId = cardDiv.closest('.kanban-list').getAttribute('data-list-id');
        const cardId = cardDiv.getAttribute('data-card-id');
        const textSpan = cardDiv.querySelector('.kanban-card-text');
        const oldText = textSpan.textContent;
        // Tạo input inline
        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldText;
        input.className = 'kanban-edit-card-input';
        input.maxLength = 100;
        textSpan.replaceWith(input);
        input.focus();
        input.select();
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', function(ev) {
          if (ev.key === 'Enter') {
            saveEdit();
          } else if (ev.key === 'Escape') {
            cancelEdit();
          }
        });
        function saveEdit() {
          const newText = input.value.trim();
          if (!newText) {
            cancelEdit();
            return;
          }
          let lists = getBoardData(boardId);
          lists = lists.map(list => {
            if (list.id === listId) {
              list.cards = list.cards.map(card => card.id === cardId ? { ...card, text: newText } : card);
            }
            return list;
          });
          saveBoardData(boardId, lists);
          renderKanban(boardId);
        }
        function cancelEdit() {
          input.replaceWith(textSpan);
        }
      });
    });

    // Xóa card trực tiếp
    document.querySelectorAll('.btn-delete-card').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const cardDiv = btn.closest('.kanban-card');
        const listId = cardDiv.closest('.kanban-list').getAttribute('data-list-id');
        const cardId = cardDiv.getAttribute('data-card-id');
        let lists = getBoardData(boardId);
        lists = lists.map(list => {
          if (list.id === listId) {
            list.cards = list.cards.filter(card => card.id !== cardId);
          }
          return list;
        });
        saveBoardData(boardId, lists);
        renderKanban(boardId);
      });
    });

    // Toggle complete card
    document.querySelectorAll('.btn-complete-card').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const cardDiv = btn.closest('.kanban-card');
        const listId = cardDiv.closest('.kanban-list').getAttribute('data-list-id');
        const cardId = cardDiv.getAttribute('data-card-id');
        let lists = getBoardData(boardId);
        lists = lists.map(list => {
          if (list.id === listId) {
            list.cards = list.cards.map(card => card.id === cardId ? { ...card, completed: !card.completed } : card);
          }
          return list;
        });
        saveBoardData(boardId, lists);
        renderKanban(boardId);
      });
    });

    // Sửa list (dropdown click)
    document.querySelectorAll('.btn-edit-list').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const listElement = btn.closest('.kanban-list');
        const dropdown = listElement.querySelector('.kanban-list-dropdown');
        // Toggle dropdown
        const isShow = dropdown.style.display === 'block';
        // Ẩn tất cả dropdown khác
        document.querySelectorAll('.kanban-list-dropdown').forEach(d => d.style.display = 'none');
        dropdown.style.display = isShow ? 'none' : 'block';
        // Đóng dropdown khi click ra ngoài
        function handleClickOutside(event) {
          if (!dropdown.contains(event.target) && event.target !== btn) {
            dropdown.style.display = 'none';
            document.removeEventListener('mousedown', handleClickOutside);
          }
        }
        if (!isShow) document.addEventListener('mousedown', handleClickOutside);
      });
    });
    // Sự kiện xóa list
    document.querySelectorAll('.kanban-list-dropdown-delete').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const listElement = btn.closest('.kanban-list');
        const listId = listElement.getAttribute('data-list-id');
        showConfirmDeleteListModal(boardId, listId);
      });
    });

    // Sự kiện đổi tên list
    document.querySelectorAll('.kanban-list-dropdown-rename').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const listElement = btn.closest('.kanban-list');
        const listId = listElement.getAttribute('data-list-id');
        const lists = getBoardData(boardId);
        const list = lists.find(l => l.id === listId);
        showListModal('Edit list', list.title, boardId, listId);
      });
    });

    // Sự kiện click vào card để mở modal chi tiết
    document.querySelectorAll('.kanban-card').forEach(cardEl => {
      cardEl.addEventListener('click', function(e) {
        e.stopPropagation();
        const cardId = cardEl.getAttribute('data-card-id');
        const listEl = cardEl.closest('.kanban-list');
        const listId = listEl.getAttribute('data-list-id');
        const lists = getBoardData(boardId);
        const list = lists.find(l => l.id === listId);
        const card = list.cards.find(c => c.id === cardId);
        // Gán dữ liệu vào modal
        document.getElementById('taskDetailTitle').value = card.text;
        document.getElementById('taskDetailListName').textContent = list.title;
        document.getElementById('taskDetailDesc').value = card.description || '';
        // Lưu id vào modal để xử lý save/delete
        document.getElementById('modalTaskDetail').setAttribute('data-list-id', listId);
        document.getElementById('modalTaskDetail').setAttribute('data-card-id', cardId);
        // Hiện modal
        document.getElementById('modalTaskDetail').style.display = 'flex';
      });
    });
    // Đóng modal khi bấm Cancel hoặc ngoài modal
    document.getElementById('taskDetailCancel').onclick = function() {
      document.getElementById('modalTaskDetail').style.display = 'none';
    };
    document.getElementById('modalTaskDetail').addEventListener('click', function(e) {
      if (e.target === this) this.style.display = 'none';
    });

    // Validate Description khi bấm Save trong modal task detail
    function validateTaskDetailDesc() {
      const desc = document.getElementById('taskDetailDesc');
      const error = document.getElementById('taskDetailDescError');
      if (!desc.value.trim()) {
        error.style.display = 'block';
        desc.style.border = '1.5px solid #eb5a46';
        desc.focus();
        return false;
      } else {
        error.style.display = 'none';
        desc.style.border = '';
        return true;
      }
    }
    document.getElementById('taskDetailSave').onclick = function() {
      if (!validateTaskDetailDesc()) return;
      const modal = document.getElementById('modalTaskDetail');
      const listId = modal.getAttribute('data-list-id');
      const cardId = modal.getAttribute('data-card-id');
      const newTitle = document.getElementById('taskDetailTitle').value.trim();
      const newDesc = document.getElementById('taskDetailDesc').value;
      let lists = getBoardData(boardId);
      lists = lists.map(list => {
        if (list.id === listId) {
          list.cards = list.cards.map(card =>
            card.id === cardId ? { ...card, text: newTitle, description: newDesc } : card
          );
        }
        return list;
      });
      saveBoardData(boardId, lists);
      modal.style.display = 'none';
      renderKanban(boardId);
    };
    // Cancel và đóng modal không cần validate
    document.getElementById('taskDetailCancel').onclick = function() {
      document.getElementById('modalTaskDetail').style.display = 'none';
    };
    document.getElementById('taskDetailDesc').addEventListener('input', function() {
      validateTaskDetailDesc();
    });

    // Xử lý xóa card khi bấm Delete trong modal task detail (hiện popup confirm)
    document.querySelector('.task-detail-delete').onclick = function() {
      document.getElementById('modalConfirmDeleteCard').style.display = 'flex';
    };
    // Xác nhận xóa card
    document.getElementById('btnDeleteCardYes').onclick = function() {
      const modal = document.getElementById('modalTaskDetail');
      const listId = modal.getAttribute('data-list-id');
      const cardId = modal.getAttribute('data-card-id');
      let lists = getBoardData(boardId);
      lists = lists.map(list => {
        if (list.id === listId) {
          list.cards = list.cards.filter(card => card.id !== cardId);
        }
        return list;
      });
      saveBoardData(boardId, lists);
      document.getElementById('modalConfirmDeleteCard').style.display = 'none';
      modal.style.display = 'none';
      renderKanban(boardId);
    };
    // Hủy xóa card
    document.getElementById('btnDeleteCardCancel').onclick = function() {
      document.getElementById('modalConfirmDeleteCard').style.display = 'none';
    };
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