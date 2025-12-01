// Get elements
const taskInput = document.getElementById("taskInput");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const addTaskBtn = document.getElementById("addTaskBtn");
const searchTask = document.getElementById("searchTask");
const filterCategory = document.getElementById("filterCategory");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");

// Load theme
if(localStorage.getItem("theme") === "dark"){
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
}

// Toggle theme
themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", 
        document.body.classList.contains("dark") ? "dark" : "light"
    );
    themeToggle.textContent = 
        document.body.classList.contains("dark") ? "☀️" : "🌙";
};

// Load tasks
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks(){
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks(){
    taskList.innerHTML = "";

    const searchValue = searchTask.value.toLowerCase();
    const filterValue = filterCategory.value;

    tasks
    .filter(task => task.text.toLowerCase().includes(searchValue))
    .filter(task => filterValue === "All" || task.category === filterValue)
    .forEach((task, index) => {
        const li = document.createElement("li");
        li.className = `task ${task.completed ? "completed" : ""}`;

        li.innerHTML = `
            <div class="task-details">
                <strong>${task.text}</strong>
                <div class="task-category">${task.category}  
                    <span class="task-priority priority-${task.priority}">
                        ${task.priority}
                    </span>
                </div>
            </div>

            <div class="task-options">
                <button onclick="toggleComplete(${index})">✔</button>
                <button onclick="editTask(${index})">✏</button>
                <button onclick="deleteTask(${index})">🗑</button>
            </div>
        `;

        taskList.appendChild(li);
    });
}

addTaskBtn.onclick = () => {
    if(taskInput.value.trim() === "") return alert("Please enter a task!");

    tasks.push({
        text: taskInput.value,
        category: taskCategory.value,
        priority: taskPriority.value,
        completed: false
    });

    saveTasks();
    renderTasks();
    taskInput.value = "";
};

function toggleComplete(i){
    tasks[i].completed = !tasks[i].completed;
    saveTasks();
    renderTasks();
}

function editTask(i){
    let newTask = prompt("Edit Task:", tasks[i].text);
    if(newTask !== null && newTask.trim() !== ""){
        tasks[i].text = newTask;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(i){
    tasks.splice(i, 1);
    saveTasks();
    renderTasks();
}

searchTask.oninput = renderTasks;
filterCategory.onchange = renderTasks;

renderTasks();
