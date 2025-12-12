const API_URL = 'http://localhost:5000/api';

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return null;
  }
  return token;
}

// Get headers
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${checkAuth()}`
  };
}

// Show alert
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

// Form submission
document.getElementById('addCourseForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Parse schedule days (comma-separated)
  const scheduleDaysInput = document.getElementById('scheduleDays').value;
  const scheduleDays = scheduleDaysInput ? 
    scheduleDaysInput.split(',').map(day => day.trim()) : [];

  const courseData = {
    courseCode: document.getElementById('courseCode').value.toUpperCase(),
    courseName: document.getElementById('courseName').value,
    description: document.getElementById('description').value,
    department: document.getElementById('department').value,
    credits: parseInt(document.getElementById('credits').value),
    instructor: document.getElementById('instructor').value,
    capacity: parseInt(document.getElementById('capacity').value) || 30,
    semester: document.getElementById('semester').value,
    academicYear: document.getElementById('academicYear').value,
    status: document.getElementById('status').value,
    schedule: {
      days: scheduleDays,
      time: document.getElementById('scheduleTime').value
    }
  };

  try {
    const response = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData)
    });

    const data = await response.json();

    if (data.success) {
      showAlert('Course added successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'courses.html';
      }, 1500);
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    console.error('Error adding course:', error);
    showAlert('Error adding course. Please try again.');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});
