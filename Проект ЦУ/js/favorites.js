// Данные из JSON
let wordsData = [];
let currentThemeFilter = 'all';

// Функции для работы с LocalStorage
function getFavorites() {
    const favoritesJSON = localStorage.getItem('tatarLearnFavorites');
    return favoritesJSON ? JSON.parse(favoritesJSON) : [];
}
function updateFavoritesCount(count) {
    const countElement = document.querySelector('.favorites-count');
    if (countElement) {
        countElement.textContent = `${count} ${getNoun(count, 'слово', 'слова', 'слов')}`;
    }
}
function saveFavorites(favorites) {
    localStorage.setItem('tatarLearnFavorites', JSON.stringify(favorites));
}

function removeFromFavorites(word) {
    const favorites = getFavorites();
    const index = favorites.indexOf(word);

    if (index !== -1) {
        favorites.splice(index, 1);
        saveFavorites(favorites);
    }
    return favorites;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Загрузка данных из JSON
    await loadWordsData();

    // Инициализация фильтров
    initThemeFilters();

    // Отображение избранных слов
    displayFavorites();

    // Установка обработчиков событий
    setupEventListeners();
});
function getNoun(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}
// Загрузка данных из JSON
async function loadWordsData() {
    try {
        const response = await fetch('../words.json');
        wordsData = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Инициализация фильтров тем
function initThemeFilters() {
    const filtersContainer = document.getElementById('theme-filters');
    if (!filtersContainer) return;

    // Очищаем все фильтры, кроме "Все темы"
    filtersContainer.innerHTML = '<li><button class="active" data-theme="all">Все темы</button></li>';

    // Получаем все уникальные темы из избранных слов
    const favorites = getFavorites();
    const favoriteWords = wordsData.filter(word => favorites.includes(word.word));
    const uniqueThemes = [...new Set(favoriteWords.map(word => word.theme))];

    // Добавляем кнопки фильтров
    uniqueThemes.forEach(theme => {
        const li = document.createElement('li');
        li.innerHTML = `<button data-theme="${theme}">${theme}</button>`;
        filtersContainer.appendChild(li);
    });
}

// Установка обработчиков событий
function setupEventListeners() {
    // Кнопка "Назад к изучению"
    document.querySelector('header .btn-outline')?.addEventListener('click', function() {
        window.location.href = 'wordLearning.html';
    });

    // Фильтры по темам
    document.querySelectorAll('.theme-filter button').forEach(button => {
        button.addEventListener('click', function() {
            // Удаляем активный класс у всех кнопок
            document.querySelectorAll('.theme-filter button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Добавляем активный класс текущей кнопке
            this.classList.add('active');

            // Устанавливаем текущий фильтр
            currentThemeFilter = this.getAttribute('data-theme');

            // Обновляем список
            displayFavorites();
        });
    });
}

// Отображение избранных слов с учетом фильтра
function displayFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;

    const favorites = getFavorites();

    // Очищаем список
    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="empty-favorites">У вас пока нет избранных слов</div>';
        return;
    }

    // Фильтруем слова
    let favoriteWordsData = wordsData.filter(word => favorites.includes(word.word));

    // Применяем фильтр по теме, если выбран не "all"
    if (currentThemeFilter !== 'all') {
        favoriteWordsData = favoriteWordsData.filter(word => word.theme === currentThemeFilter);
    }

    if (favoriteWordsData.length === 0) {
        favoritesList.innerHTML = '<div class="empty-favorites">Нет слов в выбранной теме</div>';
        return;
    }

    updateFavoritesCount(favoriteWordsData.length);

    // Отображаем слова в новом формате
    favoriteWordsData.forEach(word => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <h3 class="favorite-title">${word.word}</h3>
            <div class="favorite-meta">
                <span>${word.transcription}</span>
                <span class="word-theme-badge">${word.theme}</span>
            </div>
            <div class="favorite-translation">${word.translation}</div>
            <p class="favorite-description">${word.description}</p>
            <div class="favorite-actions">
                <button class="btn-outline remove-favorite" data-word="${word.word}">
                    Удалить
                </button>
            </div>
        `;
        favoritesList.appendChild(favoriteItem);
    });

    // Добавляем обработчики событий для кнопок удаления
    document.querySelectorAll('.remove-favorite').forEach(button => {
        button.addEventListener('click', function() {
            const wordToRemove = this.getAttribute('data-word');
            const updatedFavorites = removeFromFavorites(wordToRemove);

            // Обновляем список и фильтры
            displayFavorites();

            // Переинициализируем фильтры, если список избранного изменился
            if (updatedFavorites.length !== favorites.length) {
                initThemeFilters();
            }
        });
    });
}