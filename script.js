// DOM Elements
const itemForm = document.getElementById('itemForm');
const itemNameInput = document.getElementById('itemName');
const itemLocationInput = document.getElementById('itemLocation');
const itemList = document.getElementById('itemList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearAllBtn = document.getElementById('clearAll');

// State
let items = JSON.parse(localStorage.getItem('lostItems')) || [];

// Initialize
renderItems();

// Event Listeners
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const location = itemLocationInput.value.trim();

    if (name && location) {
        addItem(name, location);
        itemNameInput.value = '';
        itemLocationInput.value = '';
    }
});

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

clearAllBtn.addEventListener('click', () => {
    if (confirm('모든 기록을 삭제할까요?')) {
        items = [];
        saveToLocalStorage();
        renderItems();
    }
});

// Functions
function addItem(name, location) {
    const newItem = {
        id: Date.now(),
        name,
        location,
        date: new Date().toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };

    items.unshift(newItem); // Add to the beginning
    saveToLocalStorage();
    renderItems();
}

function renderItems(filter = '') {
    itemList.innerHTML = '';

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(filter.toLowerCase()) ||
        item.location.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredItems.length === 0) {
        itemList.innerHTML = `<div class="empty-state">${filter ? '검색 결과가 없습니다.' : '아직 기록된 물건이 없습니다.'}</div>`;
        return;
    }

    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        if (filter && item.name.toLowerCase().includes(filter.toLowerCase())) {
            card.classList.add('highlight');
        }
        
        card.innerHTML = `
            <div class="item-info">
                <h3>${escapeHtml(item.name)}</h3>
                <p>📍 ${escapeHtml(item.location)}</p>
            </div>
            <div class="item-date">
                ${item.date}
            </div>
        `;
        itemList.appendChild(card);
    });
}

function performSearch() {
    const searchTerm = searchInput.value.trim();
    renderItems(searchTerm);
}

function saveToLocalStorage() {
    localStorage.setItem('lostItems', JSON.stringify(items));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
