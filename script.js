
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
        
        // Stats elements
        const totalTasksEl = document.getElementById("totalTasks");
        const completedTasksEl = document.getElementById("completedTasks");
        const pendingTasksEl = document.getElementById("pendingTasks");
        const overdueTasksEl = document.getElementById("overdueTasks");
        
        // Filter buttons
        const showAllBtn = document.getElementById("showAll");
        const showPendingBtn = document.getElementById("showPending");
        const showCompletedBtn = document.getElementById("showCompleted");
        
        // Initialize tasks array from localStorage or empty array
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        
        // Current filter state
        let currentFilter = "all";
        
        // Initialize date picker with today's date as min
        taskDueDate.min = new Date().toISOString().split('T')[0];
        
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
            if (!dateString) return "";
            const date = new Date(dateString);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Check if date is today
            if (date.toDateString() === today.toDateString()) {
                return "Today";
            }
            
            // Check if date is tomorrow
            if (date.toDateString() === tomorrow.toDateString()) {
                return "Tomorrow";
            }
            
            // Otherwise return formatted date
            return date.toLocaleDateString('en-US', { 
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
        
        // Save tasks to localStorage
        function saveTasks() {
            localStorage.setItem("tasks", JSON.stringify(tasks));
            updateStats();
        }
        
        // Render tasks based on current filter
        function renderTasks() {
            taskList.innerHTML = "";
            
            if (tasks.length === 0) {
                taskList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No tasks yet</h3>
                        <p>Add your first task above to get started!</p>
                    </div>
                `;
                return;
            }
            
            const searchValue = searchTask.value.toLowerCase();
            const filterValue = filterCategory.value;
            
            let filteredTasks = tasks.filter(task => {
                // Apply search filter
                const matchesSearch = task.text.toLowerCase().includes(searchValue);
                
                // Apply category filter
                const matchesCategory = filterValue === "All" || task.category === filterValue;
                
                // Apply status filter
                let matchesStatus = true;
                if (currentFilter === "pending") {
                    matchesStatus = !task.completed;
                } else if (currentFilter === "completed") {
                    matchesStatus = task.completed;
                }
                
                return matchesSearch && matchesCategory && matchesStatus;
            });
            
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
            
            // Sort tasks: overdue first, then due soon, then by priority
            filteredTasks.sort((a, b) => {
                // First, sort by completion status (pending first)
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                
                // Then by due status
                const aDueStatus = getDueStatus(a.dueDate);
                const bDueStatus = getDueStatus(b.dueDate);
                
                if (aDueStatus === "overdue" && bDueStatus !== "overdue") return -1;
                if (bDueStatus === "overdue" && aDueStatus !== "overdue") return 1;
                if (aDueStatus === "due-soon" && bDueStatus !== "due-soon") return -1;
                if (bDueStatus === "due-soon" && aDueStatus !== "due-soon") return 1;
                
                // Then by priority (High > Medium > Low)
                const priorityOrder = { High: 3, Medium: 2, Low: 1 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                
                // Finally by creation date (newest first)
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // Create task elements
            filteredTasks.forEach((task, index) => {
                const li = document.createElement("li");
                li.className = `task ${task.completed ? "completed" : ""} ${getDueStatus(task.dueDate)}`;
                li.setAttribute("data-id", task.id);
                
                // Format due date for display
                const dueDateDisplay = task.dueDate ? formatDate(task.dueDate) : "No due date";
                
                li.innerHTML = `
                    <div class="task-details">
                        <div class="task-text">${task.text}</div>
                        <div class="task-meta">
                            <span class="task-category">${task.category}</span>
                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                            <span class="task-due-date">
                                <i class="far fa-calendar"></i> ${dueDateDisplay}
                                ${getDueStatus(task.dueDate) === "overdue" ? '<i class="fas fa-exclamation-circle" style="color: var(--danger); margin-left: 5px;"></i>' : ''}
                                ${getDueStatus(task.dueDate) === "due-soon" ? '<i class="fas fa-clock" style="color: var(--warning); margin-left: 5px;"></i>' : ''}
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
                
                completeBtn.addEventListener("click", () => toggleComplete(task.id));
                
                editBtn.addEventListener("click", () => editTask(task.id));
                
                deleteBtn.addEventListener("click", () => deleteTask(task.id));
                
                // Double-click to toggle completion
                li.addEventListener("dblclick", () => toggleComplete(task.id));
                
                // Drag and drop functionality
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handleDragStart);
                li.addEventListener("dragover", handleDragOver);
                li.addEventListener("drop", handleDrop);
                li.addEventListener("dragend", handleDragEnd);
                
                taskList.appendChild(li);
            });
        }
        
        // Drag and drop functionality
        let draggedItem = null;
        
        function handleDragStart(e) {
            draggedItem = this;
            this.style.opacity = "0.5";
        }
        
        function handleDragOver(e) {
            e.preventDefault();
        }
        
        function handleDrop(e) {
            e.preventDefault();
            if (draggedItem !== this) {
                const draggedId = draggedItem.getAttribute("data-id");
                const targetId = this.getAttribute("data-id");
                
                // Find indices of dragged and target tasks
                const draggedIndex = tasks.findIndex(task => task.id == draggedId);
                const targetIndex = tasks.findIndex(task => task.id == targetId);
                
                // Reorder tasks array
                const [draggedTask] = tasks.splice(draggedIndex, 1);
                tasks.splice(targetIndex, 0, draggedTask);
                
                saveTasks();
                renderTasks();
            }
        }
        
        function handleDragEnd(e) {
            this.style.opacity = "1";
        }
        
        // Generate unique ID for tasks
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        
        // Add new task
        function addTask() {
            const text = taskInput.value.trim();
            if (!text) {
                alert("Please enter a task description!");
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
                createdAt: new Date().toISOString()
            };
            
            tasks.unshift(newTask);
            saveTasks();
            renderTasks();
            
            // Reset input fields
            taskInput.value = "";
            taskDueDate.value = "";
            taskInput.focus();
        }
        
        // Toggle task completion
        function toggleComplete(taskId) {
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = !tasks[taskIndex].completed;
                tasks[taskIndex].completedAt = tasks[taskIndex].completed ? new Date().toISOString() : null;
                saveTasks();
                renderTasks();
            }
        }
        
        // Edit task
        function editTask(taskId) {
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex === -1) return;
            
            const task = tasks[taskIndex];
            
            const newText = prompt("Edit task:", task.text);
            if (newText !== null && newText.trim() !== "") {
                tasks[taskIndex].text = newText.trim();
                
                const newCategory = prompt("Edit category (General, Work, Personal, Shopping, Health, Education):", task.category);
                if (newCategory !== null && newCategory.trim() !== "") {
                    tasks[taskIndex].category = newCategory;
                }
                
                const newPriority = prompt("Edit priority (Low, Medium, High):", task.priority);
                if (newPriority !== null && ["Low", "Medium", "High"].includes(newPriority)) {
                    tasks[taskIndex].priority = newPriority;
                }
                
                const newDueDate = prompt("Edit due date (YYYY-MM-DD) or leave empty:", task.dueDate || "");
                if (newDueDate !== null) {
                    tasks[taskIndex].dueDate = newDueDate.trim() || null;
                }
                
                saveTasks();
                renderTasks();
            }
        }
        
        // Delete task with confirmation
        function deleteTask(taskId) {
            if (!confirm("Are you sure you want to delete this task?")) return;
            
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
        }
        
        // Event Listeners
        addTaskBtn.addEventListener("click", addTask);
        
        taskInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") addTask();
        });
        
        searchTask.addEventListener("input", renderTasks);
        filterCategory.addEventListener("change", renderTasks);
        
        showAllBtn.addEventListener("click", () => {
            currentFilter = "all";
            renderTasks();
        });
        
        showPendingBtn.addEventListener("click", () => {
            currentFilter = "pending";
            renderTasks();
        });
        
        showCompletedBtn.addEventListener("click", () => {
            currentFilter = "completed";
            renderTasks();
        });
        
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
                        createdAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
                    },
                    {
                        id: generateId(),
                        text: "Buy groceries",
                        category: "Shopping",
                        priority: "Medium",
                        dueDate: new Date().toISOString().split('T')[0], // Today
                        completed: false,
                        createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
                    },
                    {
                        id: generateId(),
                        text: "Schedule dentist appointment",
                        category: "Health",
                        priority: "Low",
                        dueDate: null,
                        completed: true,
                        createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
                    },
                    {
                        id: generateId(),
                        text: "Read 30 pages of book",
                        category: "Personal",
                        priority: "Medium",
                        dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
                        completed: false,
                        createdAt: new Date(Date.now() - 345600000).toISOString() // 4 days ago
                    }
                ];
                
                tasks = sampleTasks;
                saveTasks();
                renderTasks();
            }
        }
        
        // Initialize app
        function initApp() {
            initTheme();
            addSampleTasks();
            renderTasks();
            updateStats();
        }
        
        // Initialize when page loads
        document.addEventListener("DOMContentLoaded", initApp);
    
