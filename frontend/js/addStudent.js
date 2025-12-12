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

// Fetch courses for enrollment
async function fetchCourses() {
  try {
    const response = await fetch(`${API_URL}/courses?status=active`, {
      headers: getHeaders()
    });

    const data = await response.json();

    if (data.success) {
      const select = document.getElementById('enrolledCourses');
      select.innerHTML = data.data.map(course => 
        `<option value="${course._id}">${course.courseCode} - ${course.courseName}</option>`
      ).join('');
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
  }
}

// Form submission
document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const enrolledCoursesSelect = document.getElementById('enrolledCourses');
  const selectedCourses = Array.from(enrolledCoursesSelect.selectedOptions).map(option => option.value);

  const studentData = {
    studentId: document.getElementById('studentId').value,
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    dateOfBirth: document.getElementById('dateOfBirth').value,
    class: document.getElementById('class').value,
    section: document.getElementById('section').value,
    status: document.getElementById('status').value,
    enrolledCourses: selectedCourses,
    address: {
      street: document.getElementById('street').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zipCode: document.getElementById('zipCode').value
    }
  };

  try {
    const response = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(studentData)
    });

    const data = await response.json();

    if (data.success) {
      showAlert('Student added successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'students.html';
      }, 1500);
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    console.error('Error adding student:', error);
    showAlert('Error adding student. Please try again.');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// Initialize
fetchCourses();
