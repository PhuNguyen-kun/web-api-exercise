// Global variables
const API_URL = "https://jsonplaceholder.typicode.com/users";
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 5;
let isEditing = false;
let editingUserId = null;
let userToDelete = null;

// DOM Elements
const usersTableBody = document.getElementById("usersTableBody");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const addUserBtn = document.getElementById("addUserBtn");
const userModal = document.getElementById("userModal");
const deleteModal = document.getElementById("deleteModal");
const userForm = document.getElementById("userForm");
const closeModal = document.getElementById("closeModal");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelBtn = document.getElementById("cancelBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const modalTitle = document.getElementById("modalTitle");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

// Initialize the application
async function init() {
  await fetchUsers();
  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  addUserBtn.addEventListener("click", openAddUserModal);
  closeModal.addEventListener("click", closeUserModal);
  closeDeleteModal.addEventListener("click", closeDeleteConfirmModal);
  cancelBtn.addEventListener("click", closeUserModal);
  cancelDeleteBtn.addEventListener("click", closeDeleteConfirmModal);
  confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
  userForm.addEventListener("submit", handleFormSubmit);
  searchBtn.addEventListener("click", handleSearch);
  clearSearchBtn.addEventListener("click", handleClearSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  prevBtn.addEventListener("click", goToPreviousPage);
  nextBtn.addEventListener("click", goToNextPage);

  // Close modal when clicking outside
  userModal.addEventListener("click", (e) => {
    if (e.target === userModal) closeUserModal();
  });
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) closeDeleteConfirmModal();
  });
}

// Fetch all users from API
async function fetchUsers() {
  try {
    showLoading();
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    allUsers = await response.json();
    filteredUsers = [...allUsers];
    currentPage = 1;
    renderUsers();
    hideLoading();
    hideError();
  } catch (error) {
    hideLoading();
    showError(`Failed to fetch users: ${error.message}`);
    console.error("Error fetching users:", error);
  }
}

// Render users table
function renderUsers() {
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const usersToDisplay = filteredUsers.slice(startIndex, endIndex);

  if (usersToDisplay.length === 0) {
    usersTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px; color: #999;">
                    No users found
                </td>
            </tr>
        `;
  } else {
    usersTableBody.innerHTML = usersToDisplay
      .map(
        (user) => `
            <tr data-user-id="${user.id}">
                <td>${user.id}</td>
                <td>${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.phone)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="openEditUserModal(${
                          user.id
                        })">Edit</button>
                        <button class="btn-delete" onclick="openDeleteConfirmModal(${
                          user.id
                        })">Delete</button>
                    </div>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updatePagination();
}

// Update pagination controls
function updatePagination() {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

// Pagination functions
function goToPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderUsers();
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderUsers();
  }
}

// Search functionality
function handleSearch() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  if (searchTerm === "") {
    filteredUsers = [...allUsers];
  } else {
    filteredUsers = allUsers.filter((user) =>
      user.name.toLowerCase().includes(searchTerm)
    );
  }

  currentPage = 1;
  renderUsers();
}

function handleClearSearch() {
  searchInput.value = "";
  filteredUsers = [...allUsers];
  currentPage = 1;
  renderUsers();
}

// Modal functions
function openAddUserModal() {
  isEditing = false;
  editingUserId = null;
  modalTitle.textContent = "Add New User";
  userForm.reset();
  userModal.classList.remove("hidden");
}

function openEditUserModal(userId) {
  isEditing = true;
  editingUserId = userId;
  modalTitle.textContent = "Edit User";

  const user = allUsers.find((u) => u.id === userId);
  if (user) {
    document.getElementById("userName").value = user.name;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userPhone").value = user.phone;
    userModal.classList.remove("hidden");
  }
}

function closeUserModal() {
  userModal.classList.add("hidden");
  userForm.reset();
  isEditing = false;
  editingUserId = null;
}

function openDeleteConfirmModal(userId) {
  userToDelete = userId;
  deleteModal.classList.remove("hidden");
}

function closeDeleteConfirmModal() {
  deleteModal.classList.add("hidden");
  userToDelete = null;
}

// Form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById("userName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    phone: document.getElementById("userPhone").value.trim(),
  };

  if (isEditing) {
    await updateUser(editingUserId, formData);
  } else {
    await createUser(formData);
  }
}

// Create new user
async function createUser(userData) {
  try {
    showLoading();
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const newUser = await response.json();

    // Manually update UI (JSONPlaceholder doesn't actually create the user)
    // Generate a new ID based on the maximum existing ID
    const maxId = Math.max(...allUsers.map((u) => u.id), 0);
    newUser.id = maxId + 1;

    allUsers.unshift(newUser); // Add to beginning of array
    filteredUsers = [...allUsers];
    currentPage = 1; // Go to first page to see the new user

    renderUsers();
    closeUserModal();
    hideLoading();
    showSuccess("User created successfully!");
  } catch (error) {
    hideLoading();
    showError(`Failed to create user: ${error.message}`);
    console.error("Error creating user:", error);
  }
}

// Update user
async function updateUser(userId, userData) {
  try {
    showLoading();

    // Check if user exists locally
    const index = allUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error("User not found");
    }

    // Only make API call for original users (IDs 1-10)
    // For newly created users (ID > 10), just update locally
    if (userId <= 10) {
      const response = await fetch(`${API_URL}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    }

    // Manually update UI
    allUsers[index] = { ...allUsers[index], ...userData };
    filteredUsers = [...allUsers];
    renderUsers();

    closeUserModal();
    hideLoading();
    showSuccess("User updated successfully!");
  } catch (error) {
    hideLoading();
    showError(`Failed to update user: ${error.message}`);
    console.error("Error updating user:", error);
  }
}

// Delete user
async function handleConfirmDelete() {
  if (!userToDelete) return;

  try {
    showLoading();
    const response = await fetch(`${API_URL}/${userToDelete}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Manually update UI
    allUsers = allUsers.filter((u) => u.id !== userToDelete);
    filteredUsers = filteredUsers.filter((u) => u.id !== userToDelete);

    // Adjust current page if necessary
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }

    renderUsers();
    closeDeleteConfirmModal();
    hideLoading();
    showSuccess("User deleted successfully!");
  } catch (error) {
    hideLoading();
    showError(`Failed to delete user: ${error.message}`);
    console.error("Error deleting user:", error);
  }
}

// UI Helper functions
function showLoading() {
  loadingIndicator.classList.remove("hidden");
}

function hideLoading() {
  loadingIndicator.classList.add("hidden");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  setTimeout(() => {
    errorMessage.classList.add("hidden");
  }, 5000);
}

function hideError() {
  errorMessage.classList.add("hidden");
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.classList.remove("hidden");
  setTimeout(() => {
    successMessage.classList.add("hidden");
  }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally accessible for inline onclick handlers
window.openEditUserModal = openEditUserModal;
window.openDeleteConfirmModal = openDeleteConfirmModal;

// Start the application
init();
