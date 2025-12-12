const API_URL = 'http://localhost:5000/api';
let allCourses = [];
let deleteCourseId = null;

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

// Fetch all courses
async function fetchCourses() {
  try {
    const response = await fetch(`${API_URL}/courses`, {
      headers: getHeaders()
    });

    const data = await response.json();

    if (data.success) {
      allCourses = data.data;
      displayCourses(allCourses);
      populateDepartmentFilter(allCourses);
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    showAlert('Error fetching courses');
  }
}

// Display courses
function displayCourses(courses) {
  const tbody = document.getElementById('coursesTable');
  
  if (courses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-title">No courses found</div>
          <p>Start by adding a new course</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = courses.map(course => `
    <tr>
      <td><strong>${course.courseCode}</strong></td>
      <td>${course.courseName}</td>
      <td>${course.department}</td>
      <td>${course.instructor || 'N/A'}</td>
      <td>${course.credits}</td>
      <td>${course.enrolledStudents.length}</td>
      <td>${course.capacity}</td>
      <td>
        <span class="badge badge-${
          course.status === 'active' ? 'success' : 
          course.status === 'inactive' ? 'warning' : 'info'
        }">
          ${course.status}
        </span>
      </td>
      <td>
        <div class="btn-group">
          <a href="editCourse.html?id=${course._id}" class="btn btn-sm btn-primary">Edit</a>
          <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${course._id}')">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Populate department filter
function populateDepartmentFilter(courses) {
  const departments = [...new Set(courses.map(c => c.department))].sort();
  const departmentFilter = document.getElementById('departmentFilter');
  
  departmentFilter.innerHTML = '<option value="">All Departments</option>' + 
    departments.map(d => `<option value="${d}">${d}</option>`).join('');
}

// Search and filter
function filterCourses() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const departmentFilter = document.getElementById('departmentFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;

  let filtered = allCourses;

  if (searchTerm) {
    filtered = filtered.filter(course => 
      course.courseName.toLowerCase().includes(searchTerm) ||
      course.courseCode.toLowerCase().includes(searchTerm) ||
      course.department.toLowerCase().includes(searchTerm) ||
      (course.instructor && course.instructor.toLowerCase().includes(searchTerm))
    );
  }

  if (departmentFilter) {
    filtered = filtered.filter(course => course.department === departmentFilter);
  }

  if (statusFilter) {
    filtered = filtered.filter(course => course.status === statusFilter);
  }

  displayCourses(filtered);
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterCourses);
document.getElementById('departmentFilter').addEventListener('change', filterCourses);
document.getElementById('statusFilter').addEventListener('change', filterCourses);

document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('departmentFilter').value = '';
  document.getElementById('statusFilter').value = '';
  filterCourses();
});

// Delete modal
const deleteModal = document.getElementById('deleteModal');

function openDeleteModal(courseId) {
  deleteCourseId = courseId;
  deleteModal.classList.add('active');
}

document.getElementById('closeDeleteModal').addEventListener('click', () => {
  deleteModal.classList.remove('active');
  deleteCourseId = null;
});

document.getElementById('cancelDelete').addEventListener('click', () => {
  deleteModal.classList.remove('active');
  deleteCourseId = null;
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  if (!deleteCourseId) return;

  try {
    const response = await fetch(`${API_URL}/courses/${deleteCourseId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await response.json();

    if (data.success) {
      showAlert('Course deleted successfully', 'success');
      deleteModal.classList.remove('active');
      deleteCourseId = null;
      fetchCourses();
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    showAlert('Error deleting course');
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
