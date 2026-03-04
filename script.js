/**
 * 루틴-온 (Routine-On) Core Logic
 */

// --- Constants & State ---
const START_HOUR = 7;
const END_HOUR = 26; // Covers up to 02:00 AM next day
const ROW_HEIGHT = 60; // px per hour

let state = {
    view: 'daily', // 'daily' or 'weekly'
    isExamMode: false,
    isSaturdaySchool: false,
    schedules: JSON.parse(localStorage.getItem('study_schedules')) || [
        { id: 1, type: 'REGULAR', title: '1교시 국어', start: '08:40', end: '09:30', day: 'mon' },
        { id: 2, type: 'REGULAR', title: '2교시 수학', start: '09:40', end: '10:30', day: 'mon' },
        { id: 3, type: 'ACADEMY', title: '대치 탑 수학', start: '18:00', end: '21:00', day: 'mon', transitPrev: 30, transitNext: 20 }
    ]
};

// --- DOM Elements ---
const dailyTimeline = document.getElementById('dailyTimeline');
const dailyBtn = document.getElementById('dailyBtn');
const weeklyBtn = document.getElementById('weeklyBtn');
const satSchoolToggle = document.getElementById('satSchoolToggle');
const examModeToggle = document.getElementById('examModeToggle');
const addModal = document.getElementById('addModal');
const openAddModalBtn = document.getElementById('openAddModal');
const closeModalBtn = document.getElementById('closeModal');
const scheduleForm = document.getElementById('scheduleForm');

// --- Initialization ---
function init() {
    renderDailyTimeline();
    setupEventListeners();
}

// --- Event Listeners ---
function setupEventListeners() {
    dailyBtn.addEventListener('click', () => switchView('daily'));
    weeklyBtn.addEventListener('click', () => switchView('weekly'));

    satSchoolToggle.addEventListener('change', (e) => {
        state.isSaturdaySchool = e.target.checked;
        renderDailyTimeline();
    });

    examModeToggle.addEventListener('change', (e) => {
        state.isExamMode = e.target.checked;
        document.body.classList.toggle('exam-mode', state.isExamMode);
        document.getElementById('mainGoalText').innerText = state.isExamMode ?
            "시험 대비 모드: 전 과목 기출 풀이 집중! 📝" :
            "오늘의 목표: 수학 쎈 1단원 완벽 정복! 🔥";
        renderDailyTimeline();
    });

    openAddModalBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => addModal.classList.add('hidden'));

    scheduleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSch = {
            id: Date.now(),
            title: document.getElementById('schTitle').value,
            start: document.getElementById('schStart').value,
            end: document.getElementById('schEnd').value,
            type: document.getElementById('schType').value,
            day: 'mon', // Simplified for demo
            transitPrev: parseInt(document.getElementById('transitPrev').value) || 0,
            transitNext: parseInt(document.getElementById('transitNext').value) || 0
        };
        state.schedules.push(newSch);
        saveState();
        renderDailyTimeline();
        addModal.classList.add('hidden');
        scheduleForm.reset();
    });
}

// --- Logic & Rendering ---
function renderDailyTimeline() {
    dailyTimeline.innerHTML = '';

    // 1. Render Background Hours
    for (let h = START_HOUR; h <= END_HOUR; h++) {
        const row = document.createElement('div');
        row.className = 'hour-row';
        const label = document.createElement('div');
        label.className = 'hour-label';
        label.innerText = (h > 24) ? `0${h - 24}:00` : `${h.toString().padStart(2, '0')}:00`;
        row.appendChild(label);
        dailyTimeline.appendChild(row);
    }

    // 2. Process Schedules & Extract Gaps
    let activeSchedules = [...state.schedules].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    // Add Transit Meta-blocks
    activeSchedules.forEach(sch => {
        renderBlock(sch);
        if (sch.type === 'ACADEMY') {
            renderTransit(sch);
        }
    });

    // Extract Gaps (Self-Study Suggestions)
    extractAndRenderGaps(activeSchedules);
}

function renderBlock(sch) {
    const startMin = timeToMinutes(sch.start) - (START_HOUR * 60);
    const endMin = timeToMinutes(sch.end) - (START_HOUR * 60);
    const height = endMin - startMin;

    const block = document.createElement('div');
    let typeClass = sch.type;
    if (state.isExamMode && sch.type === 'SELF') typeClass = 'EXAM';

    block.className = `sch-block ${typeClass}`;
    block.style.top = `${startMin + 10}px`; // offset for padding
    block.style.height = `${height}px`;
    block.innerHTML = `<div>${sch.title}</div><div style="font-size: 0.7rem; opacity: 0.8">${sch.start} - ${sch.end}</div>`;

    dailyTimeline.appendChild(block);
}

function renderTransit(sch) {
    const startMin = timeToMinutes(sch.start) - (START_HOUR * 60);
    const endMin = timeToMinutes(sch.end) - (START_HOUR * 60);

    if (sch.transitPrev > 0) {
        const bridge = document.createElement('div');
        bridge.className = 'transit-bridge';
        bridge.style.top = `${startMin - sch.transitPrev + 10}px`;
        bridge.style.height = `${sch.transitPrev}px`;
        bridge.innerHTML = `<span class="transit-label" style="top: -5px">🚌 이동 ${sch.transitPrev}분</span>`;
        dailyTimeline.appendChild(bridge);
    }
}

function extractAndRenderGaps(sortedSchs) {
    for (let i = 0; i < sortedSchs.length - 1; i++) {
        const currentEnd = timeToMinutes(sortedSchs[i].end) + (sortedSchs[i].transitNext || 0);
        const nextStart = timeToMinutes(sortedSchs[i + 1].start) - (sortedSchs[i + 1].transitPrev || 0);

        const gap = nextStart - currentEnd;
        if (gap >= 30) { // Only suggest if more than 30 mins
            const gapStart = minutesToTime(currentEnd);
            const gapEnd = minutesToTime(nextStart);

            const block = document.createElement('div');
            block.className = 'sch-block SELF';
            block.style.opacity = '0.5';
            block.style.borderStyle = 'dashed';
            block.style.top = `${currentEnd - (START_HOUR * 60) + 10}px`;
            block.style.height = `${gap}px`;
            block.innerHTML = `<div>✨ 자습 가능 시간</div><div style="font-size: 0.7rem">${gapStart} - ${gapEnd}</div>`;
            dailyTimeline.appendChild(block);
        }
    }
}

// --- Helpers ---
function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(totalMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function switchView(view) {
    state.view = view;
    dailyBtn.classList.toggle('active', view === 'daily');
    weeklyBtn.classList.toggle('active', view === 'weekly');
    // Implement weekly view toggle logic here
    alert('Weekly View는 다음 업데이트(v1.1)에서 구현될 예정입니다!');
}

function saveState() {
    localStorage.setItem('study_schedules', JSON.stringify(state.schedules));
}

init();
