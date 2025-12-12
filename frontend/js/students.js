const API_URL = 'http://localhost:5000/api';
let allStudents = [];
let deleteStudentId = null;

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

// Fetch all students
async function fetchStudents() {
  try {
    const response = await fetch(`${API_URL}/students`, {
      headers: getHeaders()
    });

    const data = await response.json();

    if (data.success) {
      allStudents = data.data;
      displayStudents(allStudents);
      populateClassFilter(allStudents);
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    showAlert('Error fetching students');
  }
}

// Display students
function displayStudents(students) {
  const tbody = document.getElementById('studentsTable');
  
  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-title">No students found</div>
          <p>Start by adding a new student</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(student => `
    <tr>
      <td>${student.studentId}</td>
      <td>${student.firstName} ${student.lastName}</td>
      <td>${student.email}</td>
      <td>${student.phone}</td>
      <td>${student.class} ${student.section || ''}</td>
      <td>${student.enrolledCourses.length}</td>
      <td>
        <span class="badge badge-${
          student.status === 'active' ? 'success' : 
          student.status === 'inactive' ? 'warning' : 'info'
        }">
          ${student.status}
        </span>
      </td>
      <td>
        <div class="btn-group">
          <a href="editStudent.html?id=${student._id}" class="btn btn-sm btn-primary">Edit</a>
          <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${student._id}')">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Populate class filter
function populateClassFilter(students) {
  const classes = [...new Set(students.map(s => s.class))].sort();
  const classFilter = document.getElementById('classFilter');
  
  classFilter.innerHTML = '<option value="">All Classes</option>' + 
    classes.map(c => `<option value="${c}">${c}</option>`).join('');
}

// Search and filter
function filterStudents() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const classFilter = document.getElementById('classFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;

  let filtered = allStudents;

  if (searchTerm) {
    filtered = filtered.filter(student => 
      student.firstName.toLowerCase().includes(searchTerm) ||
      student.lastName.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm) ||
      student.class.toLowerCase().includes(searchTerm)
    );
  }

  if (classFilter) {
    filtered = filtered.filter(student => student.class === classFilter);
  }

  if (statusFilter) {
    filtered = filtered.filter(student => student.status === statusFilter);
  }

  displayStudents(filtered);
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterStudents);
document.getElementById('classFilter').addEventListener('change', filterStudents);
document.getElementById('statusFilter').addEventListener('change', filterStudents);

document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('classFilter').value = '';
  document.getElementById('statusFilter').value = '';
  filterStudents();
});

// Delete modal
const deleteModal = document.getElementById('deleteModal');

function openDeleteModal(studentId) {
  deleteStudentId = studentId;
  deleteModal.classList.add('active');
}

document.getElementById('closeDeleteModal').addEventListener('click', () => {
  deleteModal.classList.remove('active');
  deleteStudentId = null;
});

document.getElementById('cancelDelete').addEventListener('click', () => {
  deleteModal.classList.remove('active');
  deleteStudentId = null;
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  if (!deleteStudentId) return;

  try {
    const response = await fetch(`${API_URL}/students/${deleteStudentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await response.json();

    if (data.success) {
      showAlert('Student deleted successfully', 'success');
      deleteModal.classList.remove('active');
      deleteStudentId = null;
      fetchStudents();
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    showAlert('Error deleting student');
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
fetchStudents();
