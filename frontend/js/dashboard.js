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

// Get headers with auth token
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${checkAuth()}`
  };
}

// Display welcome message
function displayWelcome() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    document.getElementById('welcomeMsg').textContent = `Welcome, ${user.username}!`;
  }
}

// Fetch dashboard stats
async function fetchDashboardStats() {
  try {
    const [studentsRes, coursesRes] = await Promise.all([
      fetch(`${API_URL}/students`, { headers: getHeaders() }),
      fetch(`${API_URL}/courses`, { headers: getHeaders() })
    ]);

    const studentsData = await studentsRes.json();
    const coursesData = await coursesRes.json();

    if (studentsData.success && coursesData.success) {
      const students = studentsData.data;
      const courses = coursesData.data;

      // Update stats
      document.getElementById('totalStudents').textContent = students.length;
      document.getElementById('totalCourses').textContent = courses.length;
      document.getElementById('activeStudents').textContent = 
        students.filter(s => s.status === 'active').length;
      document.getElementById('activeCourses').textContent = 
        courses.filter(c => c.status === 'active').length;

      // Display recent students (last 5)
      displayRecentStudents(students.slice(0, 5));

      // Display recent courses (last 5)
      displayRecentCourses(courses.slice(0, 5));
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
}

// Display recent students
function displayRecentStudents(students) {
  const tbody = document.getElementById('recentStudents');
  
  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No students found</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(student => `
    <tr>
      <td>${student.studentId}</td>
      <td>${student.firstName} ${student.lastName}</td>
      <td>${student.email}</td>
      <td>${student.class}</td>
      <td>
        <span class="badge badge-${student.status === 'active' ? 'success' : 'warning'}">
          ${student.status}
        </span>
      </td>
      <td>${student.enrolledCourses.length}</td>
    </tr>
  `).join('');
}

// Display recent courses
function displayRecentCourses(courses) {
  const tbody = document.getElementById('recentCourses');
  
  if (courses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No courses found</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = courses.map(course => `
    <tr>
      <td>${course.courseCode}</td>
      <td>${course.courseName}</td>
      <td>${course.department}</td>
      <td>${course.credits}</td>
      <td>${course.enrolledStudents.length} / ${course.capacity}</td>
      <td>
        <span class="badge badge-${course.status === 'active' ? 'success' : 'warning'}">
          ${course.status}
        </span>
      </td>
    </tr>
  `).join('');
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// Initialize
displayWelcome();
fetchDashboardStats();
