// --- Khởi tạo dữ liệu admin mẫu nếu chưa có ---
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_USER = {
    id: 1,
    username: 'admin',
    email: ADMIN_EMAIL,
    password: 'admin123',
    created_at: new Date().toISOString(),
    boards: [],
};

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}
function setUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}
function ensureAdmin() {
    let users = getUsers();
    if (!users.find(u => u.email === ADMIN_EMAIL)) {
        users.push(ADMIN_USER);
        setUsers(users);
    }
}
ensureAdmin();

// --- Toast ---
function showToast(type, title, message) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✔️' : '❌'}</span>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <div>${message.replace(/\n/g, '<br>')}</div>
        </div>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;
    toast.querySelector('.toast-close').onclick = () => toast.remove();
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// --- Đăng ký ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = registerForm['email'].value.trim();
        const username = registerForm['username'].value.trim();
        const password = registerForm['password'].value;
        const alertBox = document.getElementById('register-alert');
        alertBox.style.display = 'none';

        let errors = [];
        if (!email) errors.push('Email không được bỏ trống');
        if (!username) errors.push('Tên đăng nhập không được bỏ trống');
        if (!password) errors.push('Mật khẩu không được bỏ trống');
        if (email && !validateEmail(email)) errors.push('Email không đúng định dạng');
        if (password && password.length < 8) errors.push('Mật khẩu tối thiểu 8 ký tự');
        let users = getUsers();
        if (users.find(u => u.email === email)) errors.push('Email đã tồn tại');
        if (errors.length) {
            showToast('error', 'Error', errors.join('<br>'));
            return;
        }
        // Add user
        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            created_at: new Date().toISOString(),
            boards: [],
        };
        users.push(newUser);
        setUsers(users);
        showToast('success', 'Thành công', 'Đăng ký thành công! Đang chuyển hướng...');
        setTimeout(() => {
            window.location.href = 'login.html?register=success';
        }, 1200);
    });
}

// --- Đăng nhập ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = loginForm['email'].value.trim();
        const password = loginForm['password'].value;
        const alertBox = document.getElementById('login-alert');
        alertBox.style.display = 'none';
        let errors = [];
        if (!email) errors.push('Email không được bỏ trống');
        if (!password) errors.push('Mật khẩu không được bỏ trống');
        if (errors.length) {
            showToast('error', 'Error', errors.join('<br>'));
            return;
        }
        let users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            showToast('error', 'Error', 'Email hoặc mật khẩu không đúng');
            return;
        }
        // Đăng nhập thành công
        localStorage.setItem('currentUser', JSON.stringify(user));
        showToast('success', '', 'Đăng nhập thành công');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);
    });
    // Hiển thị thông báo đăng ký thành công nếu có
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'success') {
        showToast('success', '', 'Đăng ký thành công! Vui lòng đăng nhập.');
    }
}

function validateEmail(email) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
} 