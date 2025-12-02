// DOM Elements
const taskInput = document.getElementById("taskInput");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");
const addTaskBtn = document.getElementById("addTaskBtn");
const searchTask = document.getElementById("searchTask");
const filterCategory = document.getElementById("filterCategory");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
const emptyState = document.getElementById("emptyState");
const exportBtn = document.getElementById("exportBtn");

// Stats elements
const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const pendingTasksEl = document.getElementById("pendingTasks");
const overdueTasksEl = document.getElementById("overdueTasks");

// Filter buttons
const showAllBtn = document.getElementById("showAll");
const showPendingBtn = document.getElementById("showPending");
const showCompletedBtn = document.getElementById("showCompleted");
const showOverdueBtn = document.getElementById("showOverdue");

// Control buttons
const clearCompletedBtn = document.getElementById("clearCompleted");
const sortByDateBtn = document.getElementById("sortByDate");
const sortByPriorityBtn = document.getElementById("sortByPriority");

// Modal elements
const editModal = document.getElementById("editModal");
const closeModalBtn = document.querySelector(".close-modal");
const cancelEditBtn = document.getElementById("cancelEdit");
const saveEditBtn = document.getElementById("saveEdit");
const editTaskText = document.getElementById("editTaskText");
const editTaskCategory = document.getElementById("editTaskCategory");
const editTaskPriority = document.getElementById("editTaskPriority");
const editTaskDueDate = document.getElementById("editTaskDueDate");

// Initialize tasks array from localStorage or empty array
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Current filter state
let currentFilter = "all";
let currentSort = "date";

// Current task being edited
let currentEditTaskId = null;

// Initialize date picker with today's date as min
function initDatePicker() {
    const today = new Date().toISOString().split('T')[0];
    taskDueDate.min = today;
    editTaskDueDate.min = today;
}

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove("dark-theme");
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Toggle theme
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    if (document.body.classList.contains("dark-theme")) {
        localStorage.setItem("theme", "dark");
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem("theme", "light");
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    // Count overdue tasks
    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(task => 
        !task.completed && task.dueDate && task.dueDate < today
    ).length;
    
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
    overdueTasksEl.textContent = overdue;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format time if needed (for future enhancement)
    const timeFormat = dateString.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {};
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
        return "Today" + (timeFormat ? `, ${date.toLocaleTimeString([], timeFormat)}` : "");
    }
    
    // Check if date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow" + (timeFormat ? `, ${date.toLocaleTimeString([], timeFormat)}` : "");
    }
    
    // Check if date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday" + (timeFormat ? `, ${date.toLocaleTimeString([], timeFormat)}` : "");
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
}

// Determine if task is due soon or overdue
function getDueStatus(dueDate) {
    if (!dueDate) return "";
    
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    
    // Calculate difference in days
    const diffTime = due - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "overdue";
    if (diffDays <= 2) return "due-soon";
    return "";
}

// Generate unique ID for tasks
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    updateStats();
    toggleEmptyState();
}

// Toggle empty state visibility
function toggleEmptyState() {
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        taskList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        taskList.style.display = 'block';
    }
}

// Render tasks based on current filter and sort
function renderTasks() {
    taskList.innerHTML = "";
    
    // If no tasks, show empty state
    if (tasks.length === 0) {
        toggleEmptyState();
        return;
    }
    
    const searchValue = searchTask.value.toLowerCase();
    const filterValue = filterCategory.value;
    
    let filteredTasks = tasks.filter(task => {
        // Apply search filter
        const matchesSearch = task.text.toLowerCase().includes(searchValue) || 
                             task.category.toLowerCase().includes(searchValue);
        
        // Apply category filter
        const matchesCategory = filterValue === "All" || task.category === filterValue;
        
        // Apply status filter
        let matchesStatus = true;
        if (currentFilter === "pending") {
            matchesStatus = !task.completed;
        } else if (currentFilter === "completed") {
            matchesStatus = task.completed;
        } else if (currentFilter === "overdue") {
            const today = new Date().toISOString().split('T')[0];
            matchesStatus = !task.completed && task.dueDate && task.dueDate < today;
        }
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Sort tasks
    filteredTasks.sort((a, b) => {
        if (currentSort === "priority") {
            // Sort by priority (High > Medium > Low)
            const priorityOrder = { High: 3, Medium: 2, Low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
        }
        
        // Default sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // If no tasks match the filter, show empty state
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No tasks found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    // Create task elements
    filteredTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task ${task.completed ? "completed" : ""} ${getDueStatus(task.dueDate)}`;
        li.setAttribute("data-id", task.id);
        li.setAttribute("draggable", true);
        
        // Format due date for display
        const dueDateDisplay = formatDate(task.dueDate);
        const dueStatus = getDueStatus(task.dueDate);
        
        // Determine which icon to show for due date
        let dueIcon = '';
        if (dueStatus === "overdue") {
            dueIcon = '<i class="fas fa-exclamation-circle overdue-icon"></i>';
        } else if (dueStatus === "due-soon") {
            dueIcon = '<i class="fas fa-clock due-icon"></i>';
        }
        
        li.innerHTML = `
            <div class="task-details">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    <span class="task-category">${task.category}</span>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    <span class="task-due-date">
                        <i class="far fa-calendar"></i> ${dueDateDisplay}
                        ${dueIcon}
                    </span>
                </div>
            </div>
            <div class="task-options">
                <button class="complete-btn" title="Mark as ${task.completed ? 'pending' : 'complete'}">
                    <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                </button>
                <button class="edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners for task actions
        const completeBtn = li.querySelector(".complete-btn");
        const editBtn = li.querySelector(".edit-btn");
        const deleteBtn = li.querySelector(".delete-btn");
        
        completeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleComplete(task.id);
        });
        
        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openEditModal(task.id);
        });
        
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
        
        // Double-click to toggle completion
        li.addEventListener("dblclick", () => toggleComplete(task.id));
        
        // Drag and drop functionality
        li.addEventListener("dragstart", handleDragStart);
        li.addEventListener("dragover", handleDragOver);
        li.addEventListener("drop", handleDrop);
        li.addEventListener("dragend", handleDragEnd);
        
        taskList.appendChild(li);
    });
    
    toggleEmptyState();
}

// Drag and drop functionality
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.innerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    const afterElement = getDragAfterElement(taskList, e.clientY);
    const draggable = document.querySelector(".dragging");
    
    if (afterElement == null) {
        taskList.appendChild(draggable);
    } else {
        taskList.insertBefore(draggable, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedItem !== this) {
        // Reorder tasks based on DOM position
        const taskItems = Array.from(taskList.children);
        const newTaskOrder = taskItems.map(item => {
            const taskId = item.getAttribute("data-id");
            return tasks.find(task => task.id === taskId);
        }).filter(task => task !== undefined);
        
        tasks = newTaskOrder;
        saveTasks();
    }
}

function handleDragEnd() {
    this.classList.remove("dragging");
    // Re-render to ensure consistency
    renderTasks();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".task:not(.dragging)")];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        showNotification("Please enter a task description!", "warning");
        taskInput.focus();
        return;
    }
    
    const newTask = {
        id: generateId(),
        text: text,
        category: taskCategory.value,
        priority: taskPriority.value,
        dueDate: taskDueDate.value || null,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    
    // Reset input fields
    taskInput.value = "";
    taskDueDate.value = "";
    taskInput.focus();
    
    showNotification("Task added successfully!", "success");
}

// Toggle task completion
function toggleComplete(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].completedAt = tasks[taskIndex].completed ? new Date().toISOString() : null;
        saveTasks();
        renderTasks();
        
        const status = tasks[taskIndex].completed ? "completed" : "marked as pending";
        showNotification(`Task ${status}!`, "success");
    }
}

// Open edit modal
function openEditModal(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    currentEditTaskId = taskId;
    
    // Populate modal fields
    editTaskText.value = task.text;
    editTaskCategory.value = task.category;
    editTaskPriority.value = task.priority;
    editTaskDueDate.value = task.dueDate || "";
    
    // Show modal
    editModal.style.display = "flex";
}

// Close edit modal
function closeEditModal() {
    editModal.style.display = "none";
    currentEditTaskId = null;
    
    // Reset form
    editTaskText.value = "";
    editTaskCategory.value = "General";
    editTaskPriority.value = "Low";
    editTaskDueDate.value = "";
}

// Save edited task
function saveEditedTask() {
    if (!currentEditTaskId) return;
    
    const taskIndex = tasks.findIndex(task => task.id === currentEditTaskId);
    if (taskIndex === -1) return;
    
    const newText = editTaskText.value.trim();
    if (!newText) {
        showNotification("Task description cannot be empty!", "warning");
        editTaskText.focus();
        return;
    }
    
    tasks[taskIndex].text = newText;
    tasks[taskIndex].category = editTaskCategory.value;
    tasks[taskIndex].priority = editTaskPriority.value;
    tasks[taskIndex].dueDate = editTaskDueDate.value || null;
    
    saveTasks();
    renderTasks();
    closeEditModal();
    
    showNotification("Task updated successfully!", "success");
}

// Delete task with confirmation
function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
    
    showNotification("Task deleted successfully!", "info");
}

// Clear all completed tasks
function clearCompletedTasks() {
    if (!confirm("Are you sure you want to clear all completed tasks?")) return;
    
    const completedCount = tasks.filter(task => task.completed).length;
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    
    showNotification(`Cleared ${completedCount} completed task(s)`, "info");
}

// Export tasks to JSON file
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification("Tasks exported successfully!", "success");
}

// Show notification
function showNotification(message, type) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles for notification
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            color: var(--text-color);
            padding: 15px 20px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-hover);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            border-left: 4px solid var(--primary-color);
            animation: slideIn 0.3s ease-out;
            transform: translateX(0);
        }
        
        .notification-success {
            border-left-color: var(--success);
        }
        
        .notification-warning {
            border-left-color: var(--warning);
        }
        
        .notification-info {
            border-left-color: var(--info);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 22px;
            color: var(--text-secondary);
            cursor: pointer;
            line-height: 1;
            transition: var(--transition);
        }
        
        .notification-close:hover {
            color: var(--danger);
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
        style.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
            style.remove();
        }
    }, 5000);
}

// Add sample tasks if empty
function addSampleTasks() {
    if (tasks.length === 0) {
        const sampleTasks = [
            {
                id: generateId(),
                text: "Complete project proposal",
                category: "Work",
                priority: "High",
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                completed: false,
                createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                completedAt: null
            },
            {
                id: generateId(),
                text: "Buy groceries for the week",
                category: "Shopping",
                priority: "Medium",
                dueDate: new Date().toISOString().split('T')[0], // Today
                completed: false,
                createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                completedAt: null
            },
            {
                id: generateId(),
                text: "Schedule dentist appointment",
                category: "Health",
                priority: "Low",
                dueDate: null,
                completed: true,
                createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                completedAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            },
            {
                id: generateId(),
                text: "Read 30 pages of book",
                category: "Personal",
                priority: "Medium",
                dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
                completed: false,
                createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
                completedAt: null
            }
        ];
        
        tasks = sampleTasks;
        saveTasks();
        renderTasks();
        showNotification("Sample tasks loaded! Start by adding your own tasks.", "info");
    }
}

// Update filter buttons active state
function updateFilterButtons() {
    // Remove active class from all filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to current filter button
    let activeButton;
    switch(currentFilter) {
        case "all":
            activeButton = showAllBtn;
            break;
        case "pending":
            activeButton = showPendingBtn;
            break;
        case "completed":
            activeButton = showCompletedBtn;
            break;
        case "overdue":
            activeButton = showOverdueBtn;
            break;
        default:
            activeButton = showAllBtn;
    }
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Initialize app
function initApp() {
    initTheme();
    initDatePicker();
    addSampleTasks();
    renderTasks();
    updateStats();
    updateFilterButtons();
    
    // Event Listeners
    addTaskBtn.addEventListener("click", addTask);
    
    taskInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTask();
    });
    
    searchTask.addEventListener("input", renderTasks);
    filterCategory.addEventListener("change", renderTasks);
    
    // Filter buttons
    showAllBtn.addEventListener("click", () => {
        currentFilter = "all";
        updateFilterButtons();
        renderTasks();
    });
    
    showPendingBtn.addEventListener("click", () => {
        currentFilter = "pending";
        updateFilterButtons();
        renderTasks();
    });
    
    showCompletedBtn.addEventListener("click", () => {
        currentFilter = "completed";
        updateFilterButtons();
        renderTasks();
    });
    
    showOverdueBtn.addEventListener("click", () => {
        currentFilter = "overdue";
        updateFilterButtons();
        renderTasks();
    });
    
    // Control buttons
    clearCompletedBtn.addEventListener("click", clearCompletedTasks);
    
    sortByDateBtn.addEventListener("click", () => {
        currentSort = "date";
        renderTasks();
        showNotification("Sorted by date", "info");
    });
    
    sortByPriorityBtn.addEventListener("click", () => {
        currentSort = "priority";
        renderTasks();
        showNotification("Sorted by priority", "info");
    });
    
    // Export button
    exportBtn.addEventListener("click", exportTasks);
    
    // Modal events
    closeModalBtn.addEventListener("click", closeEditModal);
    cancelEditBtn.addEventListener("click", closeEditModal);
    saveEditBtn.addEventListener("click", saveEditedTask);
    
    // Close modal when clicking outside
    editModal.addEventListener("click", (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && editModal.style.display === "flex") {
            closeEditModal();
        }
    });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initApp);