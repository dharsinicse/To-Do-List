function addTask() {
  const input = document.getElementById("taskInput");
  const category = document.getElementById("categorySelect").value;
  const dateInput = document.getElementById("calendar");
  const important = document.getElementById("importantCheckbox").checked;
  const taskText = input.value.trim();
  const selectedDate = dateInput.value;

  if (!taskText) {
    alert("Please enter a task.");
    return;
  }
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  if (tasks.some(t => t.text.toLowerCase() === taskText.toLowerCase())) {
    alert("Task already exists!");
    return;
  }

  const sound = document.getElementById("bubbleSound");
  sound.currentTime = 0;
  sound.play();
  const button = document.querySelector("button[type='submit']");
  button.classList.add("bubble-effect");
  setTimeout(() => button.classList.remove("bubble-effect"), 600);

  const task = {
    text: taskText,
    category,
    date: selectedDate,
    important,
    status: 'to-do'
  };
  
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();

  input.value = "";
  dateInput.value = "";
  document.getElementById("importantCheckbox").checked = false;
}

let currentFilter = null;
function addDragAndDrop(li, index) {
  li.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', index);
    li.classList.add('dragging');
  });
  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
  });
  li.addEventListener('dragover', e => {
    e.preventDefault();
    li.classList.add('over');
  });
  li.addEventListener('dragleave', () => {
    li.classList.remove('over');
  });
  li.addEventListener('drop', e => {
    e.preventDefault();
    li.classList.remove('over');
    const from = +e.dataTransfer.getData('text/plain');
    const to = index;
    reorderTasks(from, to);
  });
}

function reorderTasks(from, to) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const [moved] = tasks.splice(from, 1);
  tasks.splice(to, 0, moved);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

document.getElementById('filterAll').onclick = () => { currentFilter = null; renderTasks(); };
document.getElementById('filterImportant').onclick = () => { currentFilter = task => task.important; renderTasks(); };
document.getElementById('filterToDo').onclick = () => { currentFilter = task => task.status === 'to-do'; renderTasks(); };
document.getElementById('filterActive').onclick = () => { currentFilter = task => task.status === 'active'; renderTasks(); };
document.getElementById('filterDone').onclick = () => { currentFilter = task => task.status === 'done'; renderTasks(); };
document.getElementById('resetFilters').onclick = () => { currentFilter = null; renderTasks(); };

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  if (currentFilter) {
    tasks = tasks.filter(currentFilter);
  }

  tasks.forEach((task, index) => {
    let dateDisplay = '';
    if (task.date) {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      const formattedDate = new Date(task.date).toLocaleDateString('en-GB', options);
      dateDisplay = `<span class="task-date">${formattedDate.replace(/,/g, '')}</span>`;
    }

    let reminder = '';
    if (task.date) {
      const today = new Date();
      const dueDate = new Date(task.date);
      const oneDay = 1000 * 60 * 60 * 24;
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      const diff = dueDate.getTime() - today.getTime();
      if (diff === 0) {
        reminder = '<span class="reminder today">Due Today!</span>';
      } else if (diff === oneDay) {
        reminder = '<span class="reminder soon">Due Tomorrow</span>';
      } else if (diff < 0) {
        reminder = '<span class="reminder overdue">Overdue</span>';
      }
    }

    const li = document.createElement("li");
    li.draggable = true;
    if (task.status === "done") {
      li.classList.add("status-completed");
    } else if (task.status === "active") {
      li.classList.add("status-inactive");
    } else {
      li.classList.add("status-todo");
    }

    li.innerHTML = `
      <span class="drag-handle">≡</span>
      <div class="task-left">
        <span class="task-category">${task.category}</span>
        <span class="task-text">${task.important ? '⚠ ' : ''}${task.text}</span>
      </div>
      <div class="task-right">
        ${dateDisplay}
        ${reminder}
        <select class="status-dropdown" onchange="changeStatus(${index}, this.value)">
          <option value="to-do" ${task.status === 'to-do' ? 'selected' : ''}>To-Do</option>
          <option value="active" ${task.status === 'active' ? 'selected' : ''}>In-active</option>
          <option value="done" ${task.status === 'done' ? 'selected' : ''}>Completed</option>
        </select>
        <div class="icons">
          <i class="fas fa-edit" onclick="editTask(${index})"></i>
          <i class="fas fa-trash-alt" onclick="deleteTask(${index})"></i>
        </div>
      </div>
    `;
    addDragAndDrop(li, index);
    taskList.appendChild(li);
  });

  updateProgress();
}

function updateProgress() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const circle = document.querySelector(".progress-circle .progress");
  const text = document.getElementById("progressText");
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  text.textContent = `${percent}%`;
}

function toggleCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.style.display = (calendar.style.display === "block") ? "none" : "block";
}
function onDateChange(input) {
  input.style.display = "none";
}

function deleteTask(index) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.splice(index, 1);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}
function editTask(index) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const newTaskText = prompt("Edit task:", tasks[index].text);
  if (newTaskText && newTaskText.trim() !== "") {
    tasks[index].text = newTaskText.trim();
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }
}

function changeStatus(index, newStatus) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks[index].status = newStatus;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

document.addEventListener("DOMContentLoaded", () => {
  renderTasks();
  document.getElementById("taskForm").addEventListener("submit", function (e) {
    e.preventDefault();
    addTask();
  });
});