// 获取 DOM 元素
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const footerControls = document.getElementById('footerControls');
const itemsLeftLabel = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const langBtns = document.querySelectorAll('.lang-btn');

const STORAGE_KEY = 'todo-app-tasks';
const LANG_KEY = 'todo-app-lang';

const translations = {
    de: {
        pageTitle: "Meine To-Do-Liste", title: "Meine Aufgaben",
        subtitle: "Bleib konzentriert und erreiche deine Ziele Schritt für Schritt ✨",
        inputPlaceholder: "Neue Aufgabe eingeben...", addBtn: "Hinzufügen",
        emptyState: "Noch keine Aufgaben. Füge eine hinzu, um zu beginnen!",
        filterAll: "Alle", filterActive: "Aktiv", filterCompleted: "Erledigt",
        clearCompleted: "Erledigte löschen",
        itemsLeft_singular: "Aufgabe übrig", itemsLeft_plural: "Aufgaben übrig",
        editTitle: "Bearbeiten", deleteTitle: "Löschen", saveTitle: "Speichern", cancelTitle: "Abbrechen",
        dragHandleTitle: "Zum Sortieren ziehen", dateLoading: "Lade Datum..."
    },
    en: {
        pageTitle: "My To-Do List", title: "My Tasks",
        subtitle: "Stay focused and achieve your goals step by step ✨",
        inputPlaceholder: "Enter a new task...", addBtn: "Add",
        emptyState: "No tasks yet. Add one to get started!",
        filterAll: "All", filterActive: "Active", filterCompleted: "Completed",
        clearCompleted: "Clear Completed",
        itemsLeft_singular: "item left", itemsLeft_plural: "items left",
        editTitle: "Edit", deleteTitle: "Delete", saveTitle: "Save", cancelTitle: "Cancel",
        dragHandleTitle: "Drag to reorder", dateLoading: "Loading date..."
    },
    zh: {
        pageTitle: "我的待办事项", title: "我的任务",
        subtitle: "保持专注，一步步实现你的目标 ✨",
        inputPlaceholder: "输入新任务...", addBtn: "添加",
        emptyState: "暂无任务。添加一个开始吧！",
        filterAll: "全部", filterActive: "进行中", filterCompleted: "已完成",
        clearCompleted: "清除已完成",
        itemsLeft_singular: "项未完成", itemsLeft_plural: "项未完成",
        editTitle: "编辑", deleteTitle: "删除", saveTitle: "保存", cancelTitle: "取消",
        dragHandleTitle: "拖拽排序", dateLoading: "加载日期中..."
    }
};

let todos = [];
let currentFilter = 'all'; 
let editingId = null; 
let draggedId = null; 
let currentLang = localStorage.getItem(LANG_KEY) || (navigator.language.startsWith('zh') ? 'zh' : navigator.language.startsWith('en') ? 'en' : 'de');

function t(key) {
    return translations[currentLang]?.[key] || translations['de'][key] || key;
}

function getTargetElement(e) {
    return e.target.nodeType === Node.ELEMENT_NODE ? e.target : e.target.parentElement;
}

function init() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === 'string') {
                    todos = parsed.map((text, index) => ({ id: Date.now() + index, text, completed: false }));
                } else {
                    todos = parsed;
                }
            }
        } catch (e) {
            console.error("Daten konnten nicht geladen werden:", e);
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    
    applyStaticTranslations();
    updateLangUI();
    updateDate();
    renderTasks();
    // 【新增】强制修改按钮为加号
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.innerHTML = '+';
        addBtn.style.fontSize = '28px';
        addBtn.style.fontWeight = '300';
    }
}

function applyStaticTranslations() {
    // 处理文本内容（排除 addBtn）
    document.querySelectorAll('[data-i18n]').forEach(el => {
        if (el.id !== 'addBtn') { // 【关键】跳过 addBtn
            el.textContent = t(el.getAttribute('data-i18n'));
        }
    });
    
    // 处理属性（如 placeholder、title）
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const attr = el.getAttribute('data-i18n-attr');
        const key = el.getAttribute('data-i18n');
        if (key) {
            el.setAttribute(attr, t(key));
        } else if (el.id === 'addBtn') {
            // 特殊处理 addBtn 的 title
            el.setAttribute('title', t('addBtn'));
        }
    });
    
    document.documentElement.lang = currentLang;
}

function updateLangUI() {
    langBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang));
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function updateDate() {
    const dateElement = document.getElementById('currentDate');
    const now = new Date();
    const localeMap = { de: 'de-DE', en: 'en-US', zh: 'zh-CN' };
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString(localeMap[currentLang], options);
}

function renderTasks() {
    let filteredTodos = todos;
    if (currentFilter === 'active') filteredTodos = todos.filter(t => !t.completed);
    else if (currentFilter === 'completed') filteredTodos = todos.filter(t => t.completed);

    todoList.innerHTML = '';
    todoList.appendChild(emptyState);

    if (todos.length === 0) {
        emptyState.style.display = 'block';
        footerControls.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        footerControls.style.display = 'flex';
        
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `task-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;
            
            const isDraggable = todo.id !== editingId;

            if (todo.id === editingId) {
                li.innerHTML = `
                    <input type="text" class="edit-input" value="${todo.text}">
                    <button class="save-btn" title="${t('saveTitle')}">💾</button>
                    <button class="cancel-btn" title="${t('cancelTitle')}">❌</button>
                `;
                todoList.appendChild(li);
                setTimeout(() => {
                    const input = li.querySelector('.edit-input');
                    input.focus(); input.select();
                }, 0);
            } else {
                li.innerHTML = `
                    <div class="drag-handle" draggable="${isDraggable}" title="${t('dragHandleTitle')}">⠿</div>
                    <input type="checkbox" class="toggle-checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="task-text">${todo.text}</span>
                    <button class="edit-btn" title="${t('editTitle')}">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="delete-btn" title="${t('deleteTitle')}">&times;</button>
                `;
                todoList.appendChild(li);
            }
        });
    }
    updateFooter();
}

function updateFooter() {
    const activeCount = todos.filter(t => !t.completed).length;
    const completedCount = todos.filter(t => t.completed).length;
    const textKey = activeCount === 1 ? 'itemsLeft_singular' : 'itemsLeft_plural';
    itemsLeftLabel.textContent = `${activeCount} ${t(textKey)}`;
    clearCompletedBtn.style.display = completedCount > 0 ? 'block' : 'none';
}

function addTask() {
    const text = todoInput.value.trim();
    if (text === '') { todoInput.focus(); return; }
    todos.push({ id: Date.now(), text, completed: false });
    saveTasks(); renderTasks();
    todoInput.value = ''; todoInput.focus();
}

function toggleTask(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) { todo.completed = !todo.completed; saveTasks(); renderTasks(); }
}

function deleteTask(id) {
    const li = todoList.querySelector(`.task-item[data-id="${id}"]`);
    if (li) {
        li.classList.add('fade-out');
        li.addEventListener('animationend', () => {
            todos = todos.filter(t => t.id !== id);
            saveTasks(); renderTasks();
        });
    }
}

function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    saveTasks(); renderTasks();
}

function setFilter(filterType) {
    currentFilter = filterType;
    filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filterType));
    renderTasks();
}

function startEdit(id) { editingId = id; renderTasks(); }

function saveEdit(id) {
    const input = todoList.querySelector(`.task-item[data-id="${id}"] .edit-input`);
    const newText = input.value.trim();
    if (newText === '') { editingId = null; renderTasks(); return; }
    const todo = todos.find(t => t.id === id);
    if (todo) { todo.text = newText; saveTasks(); }
    editingId = null; renderTasks();
}

function cancelEdit() { editingId = null; renderTasks(); }

function reorderTodos(targetId, insertBefore) {
    if (draggedId === null || draggedId === targetId) return;
    const draggedIndex = todos.findIndex(t => t.id === draggedId);
    if (draggedIndex === -1) return;
    const [draggedItem] = todos.splice(draggedIndex, 1);
    let targetIndex = todos.findIndex(t => t.id === targetId);
    if (insertBefore) todos.splice(targetIndex, 0, draggedItem);
    else todos.splice(targetIndex + 1, 0, draggedItem);
    saveTasks(); renderTasks();
}

function switchLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, currentLang);
    applyStaticTranslations();
    updateLangUI();
    updateDate();
    renderTasks();
}

addBtn.addEventListener('click', addTask);
todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

todoList.addEventListener('click', (e) => {
    const targetEl = getTargetElement(e);
    const li = targetEl.closest('.task-item');
    if (!li) return;
    const id = Number(li.dataset.id);

    if (targetEl.classList.contains('toggle-checkbox')) toggleTask(id);
    else if (targetEl.classList.contains('delete-btn')) deleteTask(id);
    else if (targetEl.classList.contains('edit-btn') || targetEl.closest('.edit-btn')) startEdit(id);
    else if (targetEl.classList.contains('save-btn')) saveEdit(id);
    else if (targetEl.classList.contains('cancel-btn')) cancelEdit();
    else if (targetEl.classList.contains('task-text')) toggleTask(id);
});

todoList.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('edit-input')) {
        const id = Number(e.target.closest('.task-item').dataset.id);
        if (e.key === 'Enter') { e.preventDefault(); saveEdit(id); }
        else if (e.key === 'Escape') cancelEdit();
    }
});

todoList.addEventListener('dragstart', (e) => {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;
    
    const li = handle.closest('.task-item');
    if (!li || li.classList.contains('fade-out')) return;
    
    draggedId = Number(li.dataset.id);
    li.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId); 
});

todoList.addEventListener('dragend', (e) => {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;
    
    const li = handle.closest('.task-item');
    if (li) li.classList.remove('dragging');
    
    document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    draggedId = null;
});

todoList.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetEl = getTargetElement(e);
    const li = targetEl.closest('.task-item');
    if (!li || Number(li.dataset.id) === draggedId) return;
    
    document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    
    const rect = li.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (e.clientY < midpoint) li.classList.add('drag-over-top');
    else li.classList.add('drag-over-bottom');
});

todoList.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetEl = getTargetElement(e);
    const targetLi = targetEl.closest('.task-item');
    if (!targetLi) return;
    
    const targetId = Number(targetLi.dataset.id);
    if (targetId === draggedId) return;
    
    const rect = targetLi.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const insertBefore = e.clientY < midpoint;
    reorderTodos(targetId, insertBefore);
});

filterBtns.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
clearCompletedBtn.addEventListener('click', clearCompleted);
langBtns.forEach(btn => btn.addEventListener('click', () => switchLanguage(btn.dataset.lang)));

init();