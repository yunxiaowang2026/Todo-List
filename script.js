// 获取 DOM 元素
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');

// 【新增】定义 Local Storage 的键名
const STORAGE_KEY = 'todo-app-tasks';

// ==========================================
// 【新增】核心功能函数
// ==========================================

// 1. 抽离创建任务 DOM 的逻辑，方便复用
function createTaskElement(text) {
    const li = document.createElement('li');
    li.className = 'task-item';

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;'; 
    deleteBtn.title = 'Aufgabe löschen';

    li.appendChild(span);
    li.appendChild(deleteBtn);
    
    return li;
}

// 2. 将当前页面的任务保存到 Local Storage
function saveTasks() {
    const tasks = [];
    // 获取当前页面上所有的任务项
    const taskItems = todoList.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        // 提取文本内容
        const text = item.querySelector('.task-text').textContent;
        tasks.push(text);
    });
    
    // 转换为 JSON 字符串并保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// 3. 页面加载时从 Local Storage 读取任务
function loadTasks() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    // 如果没有数据，直接返回，不报错
    if (!savedData) return;

    try {
        const tasks = JSON.parse(savedData);
        
        // 如果是有效的数组且有数据
        if (Array.isArray(tasks) && tasks.length > 0) {
            tasks.forEach(text => {
                // 复用创建函数，渲染到页面
                const li = createTaskElement(text);
                todoList.appendChild(li);
            });
            // 隐藏空状态提示
            emptyState.style.display = 'none';
        }
    } catch (e) {
        // 防止 Local Storage 中的数据损坏导致 JSON 解析报错
        console.error("Local Storage 数据解析失败:", e);
    }
}

// ==========================================
// 原有业务逻辑 (微调)
// ==========================================

// 添加任务的核心逻辑
function addTask() {
    const text = todoInput.value.trim();
    
    if (text === '') {
        todoInput.focus();
        return;
    }

    if (emptyState) {
        emptyState.style.display = 'none';
    }

    // 【修改】使用抽离的函数创建元素
    const li = createTaskElement(text);
    todoList.appendChild(li);

    // 【新增】添加后自动保存
    saveTasks();

    todoInput.value = '';
    todoInput.focus();
}

// 事件监听：点击添加按钮
addBtn.addEventListener('click', addTask);

// 事件监听：按下回车键添加
todoInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// 事件监听：删除任务
todoList.addEventListener('click', function (e) {
    if (e.target.classList.contains('delete-btn')) {
        const taskItem = e.target.parentElement;
        
        taskItem.classList.add('fade-out');
        
        taskItem.addEventListener('animationend', () => {
            taskItem.remove();
            
            // 【新增】删除后自动保存
            saveTasks();

            const remainingTasks = todoList.querySelectorAll('.task-item');
            if (remainingTasks.length === 0 && emptyState) {
                emptyState.style.display = 'block';
            }
        });
    }
});

// ==========================================
// 【新增】初始化：页面加载时读取数据
// ==========================================
loadTasks();