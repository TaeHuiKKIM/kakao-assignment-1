// DOM 요소 선택
const todoFormEl = document.getElementById('todo-form');
const todoInputEl = document.getElementById('todo-input');
const messageContainerEl = document.getElementById('message-container');
const todoListEl = document.getElementById('todo-list');
const filterTabsEl = document.getElementById('filter-tabs');
const prevWeekBtnEl = document.getElementById('prev-week-btn');
const nextWeekBtnEl = document.getElementById('next-week-btn');
const weeklyCalendarEl = document.getElementById('weekly-calendar');

// Todo 데이터 상태 관리
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all'; // 'all', 'active', 'completed'
let selectedDate = new Date();

/**
 * 변경된 Todo 데이터를 로컬스토리지에 저장하는 함수
 */
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    if (typeof renderWeeklyCalendar === 'function') {
        renderWeeklyCalendar(); // 데이터 변경 시 주간 달력 투두 개수 갱신
    }
}

/**
 * 날짜 포맷 함수 (YYYY-MM-DD)
 */
function formatDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 선택된 날짜가 속한 주의 월요일을 구하는 함수
 */
function getWeekStart(dateObj) {
    const d = new Date(dateObj);
    const day = d.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    // 월요일을 주의 시작으로 계산
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * 주간 달력 렌더링 함수
 */
function renderWeeklyCalendar() {
    if (!weeklyCalendarEl) return;
    weeklyCalendarEl.innerHTML = '';
    
    const startOfWeek = getWeekStart(selectedDate);
    const todayStr = formatDate(new Date());
    const selectedStr = formatDate(selectedDate);
    
    const daysStr = ['월', '화', '수', '목', '금', '토', '일'];
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        const dateStr = formatDate(currentDate);
        
        // 투두 개수 계산
        const count = todos.filter(todo => todo.date === dateStr).length;
        
        const dayDiv = document.createElement('div');
        dayDiv.className = `day-item ${dateStr === selectedStr ? 'active' : ''} ${dateStr === todayStr ? 'today' : ''}`;
        dayDiv.addEventListener('click', () => {
            selectedDate = currentDate;
            renderWeeklyCalendar();
            renderTodos();
        });
        
        dayDiv.innerHTML = `
            <div class="day-name">${daysStr[i]}</div>
            <div class="day-number">${currentDate.getDate()}</div>
            <div class="todo-count">${count > 0 ? count : 0}</div>
        `;
        
        weeklyCalendarEl.appendChild(dayDiv);
    }
}

/**
 * 안내 메시지 표시 함수
 */
function showMessage(msg) {
    messageContainerEl.textContent = msg;
    setTimeout(() => {
        messageContainerEl.textContent = '';
    }, 2000);
}

/**
 * 고유 ID 생성 함수
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 새로운 Todo 추가 함수
 */
function addTodo(event) {
    event.preventDefault(); // 폼 제출 기본 동작(새로고침) 방지
    
    const text = todoInputEl.value.trim();
    
    // 빈 값 검증
    if (text === '') {
        showMessage('할 일을 입력해주세요!');
        return;
    }
    
    // 새 Todo 객체 생성
    const newTodo = {
        id: generateId(),
        text: text,
        completed: false,
        date: formatDate(selectedDate) // 현재 선택된 날짜 저장
    };
    
    todos.push(newTodo); // 배열에 추가
    todoInputEl.value = ''; // 입력창 초기화
    saveTodos(); // 로컬스토리지 저장
    renderTodos(); // 화면 갱신
}

/**
 * Todo 삭제 함수
 */
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos(); // 로컬스토리지 저장
    renderTodos();
}

/**
 * Todo 상태(완료/미완료) 변경 함수
 */
function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    saveTodos(); // 로컬스토리지 저장
    renderTodos();
}

/**
 * Todo 수정 처리 함수
 */
function editTodo(id, newText) {
    if (newText.trim() === '') {
        showMessage('수정할 내용을 입력해주세요!');
        return;
    }

    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, text: newText.trim() };
        }
        return todo;
    });
    saveTodos(); // 로컬스토리지 저장
    renderTodos();
}

/**
 * 특정 Todo를 수정 모드로 변경하는 함수
 */
function enterEditMode(li, todo) {
    // 이미 수정 모드인 경우 방지
    if (li.querySelector('.edit-input')) return;

    const contentDiv = li.querySelector('.todo-content');
    const actionsDiv = li.querySelector('.todo-actions');
    
    // 내용물 비우기
    contentDiv.innerHTML = '';
    actionsDiv.innerHTML = '';

    // 수정용 input 생성
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = todo.text;

    // 저장 버튼 생성
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '저장';
    saveBtn.className = 'btn-icon';
    saveBtn.onclick = () => editTodo(todo.id, editInput.value);

    // 취소 버튼 생성
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '취소';
    cancelBtn.className = 'btn-icon';
    cancelBtn.onclick = () => renderTodos();

    // 요소 추가
    contentDiv.appendChild(editInput);
    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);

    editInput.focus();

    // 엔터키 입력 시 저장
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            editTodo(todo.id, editInput.value);
        }
    });
}

/**
 * Todo 리스트 렌더링 함수
 */
function renderTodos() {
    // 기존 목록 초기화
    todoListEl.innerHTML = '';
    
    // 1차 필터링: 선택된 날짜에 해당하는 Todo만 추출 (날짜 정보가 없으면 보이도록 임시 허용)
    let filteredTodos = todos.filter(todo => todo.date === formatDate(selectedDate) || !todo.date);
    
    // 2차 필터링: 상태 적용
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    }
    
    // 배열 순회하며 DOM 요소 생성
    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        // 1) 체크박스와 텍스트
        const contentDiv = document.createElement('div');
        contentDiv.className = 'todo-content';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => toggleTodo(todo.id));
        
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = todo.text;
        
        contentDiv.appendChild(checkbox);
        contentDiv.appendChild(textSpan);
        
        // 2) 액션 버튼들 (수정/삭제)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'todo-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon';
        editBtn.textContent = '수정';
        editBtn.addEventListener('click', () => enterEditMode(li, todo));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        // 3) li에 조립
        li.appendChild(contentDiv);
        li.appendChild(actionsDiv);
        
        // 4) ul에 추가
        todoListEl.appendChild(li);
    });
}

/**
 * Todo 앱 초기화 함수
 */
function init() {
    // 초기 주간 달력 렌더링
    renderWeeklyCalendar();

    // 주간 이동 이벤트 리스너
    prevWeekBtnEl.addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() - 7);
        renderWeeklyCalendar();
        renderTodos();
    });

    nextWeekBtnEl.addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() + 7);
        renderWeeklyCalendar();
        renderTodos();
    });

    // 폼 제출 이벤트(생성) 리스너 등록
    todoFormEl.addEventListener('submit', addTodo);
    
    // 필터 탭 클릭 이벤트 리스너 등록
    filterTabsEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTodos();
        }
    });

    // 초기 렌더링
    renderTodos();
}

// 앱 실행
init();
