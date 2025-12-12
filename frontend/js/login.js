const API_URL = 'http://localhost:5000/api';

// Show alert message
function showAlert(message, type = 'error') {
  const alertContainer = document.getElementById('alertContainer');
  alertContainer.innerHTML = `
    <div class="alert alert-${type}">
      ${message}
    </div>
  `;

  setTimeout(() => {
    alertContainer.innerHTML = '';
  }, 5000);
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store token and user info
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data));
      
      showAlert('Login successful! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    console.error('Login Error:', error);
    showAlert('An error occurred. Please try again.');
  }
});

// Register modal
const registerModal = document.getElementById('registerModal');
const registerLink = document.getElementById('registerLink');
const closeModal = document.getElementById('closeModal');
const cancelRegister = document.getElementById('cancelRegister');

registerLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
  registerModal.classList.remove('active');
});

cancelRegister.addEventListener('click', () => {
  registerModal.classList.remove('active');
});

// Register form submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password, role: 'admin' })
    });

    const data = await response.json();

    if (data.success) {
      registerModal.classList.remove('active');
      showAlert('Registration successful! Please login.', 'success');
      document.getElementById('registerForm').reset();
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    console.error('Register Error:', error);
    showAlert('An error occurred. Please try again.');
  }
});

// Close modal on outside click
registerModal.addEventListener('click', (e) => {
  if (e.target === registerModal) {
    registerModal.classList.remove('active');
  }
});

// Check if already logged in
if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}
