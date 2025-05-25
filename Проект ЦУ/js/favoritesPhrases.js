// favoritesPhrases.js
// Данные из JSON
let phrasesData = [];
let currentThemeFilter = 'all';

// Функции для работы с LocalStorage
function getFavorites() {
    const favoritesJSON = localStorage.getItem('tatarLearnFavoritesPhrases');
    return favoritesJSON ? JSON.parse(favoritesJSON) : [];
}

function updateFavoritesCount(count) {
    const countElement = document.querySelector('.favorites-count');
    if (countElement) {
        countElement.textContent = `${count} ${getNoun(count, 'фраза', 'фразы', 'фраз')}`;
    }
}

function saveFavorites(favorites) {
    localStorage.setItem('tatarLearnFavoritesPhrases', JSON.stringify(favorites));
}

function removeFromFavorites(phrase) {
    const favorites = getFavorites();
    const index = favorites.indexOf(phrase);

    if (index !== -1) {
        favorites.splice(index, 1);
        saveFavorites(favorites);
    }
    return favorites;
}

// Функция для озвучивания фразы
function speakPhrase(phrase) {
    if (!phrase || !phrase.speachWord) return;

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(phrase.speachWord);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
            voice.lang.includes('tr') || voice.lang.includes('ru'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    } else {
        alert('Ваш браузер не поддерживает озвучивание текста. Попробуйте использовать Chrome или Edge.');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Загрузка данных из JSON
    await loadPhrasesData();

    // Инициализация фильтров
    initThemeFilters();

    // Отображение избранных фраз
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
async function loadPhrasesData() {
    try {
        const response = await fetch('../phrases.json');
        phrasesData = await response.json();
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

    // Получаем все уникальные темы из избранных фраз
    const favorites = getFavorites();
    const favoritePhrases = phrasesData.filter(phrase => favorites.includes(phrase.word));
    const uniqueThemes = [...new Set(favoritePhrases.map(phrase => phrase.theme))];

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
        window.location.href = 'phraseLearning.html';
    });

    // Фильтры по темам
    document.querySelectorAll('.theme-filter button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.theme-filter button').forEach(btn => {
                btn.classList.remove('active');
            });

            this.classList.add('active');
            currentThemeFilter = this.getAttribute('data-theme');
            displayFavorites();
        });
    });
}

// Отображение избранных фраз с учетом фильтра
function displayFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;

    const favorites = getFavorites();

    // Очищаем список
    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="empty-favorites">У вас пока нет избранных фраз</div>';
        return;
    }

    // Фильтруем фразы
    let favoritePhrasesData = phrasesData.filter(phrase => favorites.includes(phrase.word));

    // Применяем фильтр по теме, если выбран не "all"
    if (currentThemeFilter !== 'all') {
        favoritePhrasesData = favoritePhrasesData.filter(phrase => phrase.theme === currentThemeFilter);
    }

    if (favoritePhrasesData.length === 0) {
        favoritesList.innerHTML = '<div class="empty-favorites">Нет фраз в выбранной теме</div>';
        return;
    }

    updateFavoritesCount(favoritePhrasesData.length);

    // Отображаем фразы
    favoritePhrasesData.forEach(phrase => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <div class="favorite-header">
                <h3 class="favorite-title">${phrase.word}</h3>
                <button class="speak-favorite-btn" data-word="${phrase.word}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                </button>
            </div>
            <div class="favorite-meta">
                <span>${phrase.transcription}</span>
                <span class="word-theme-badge">${phrase.theme}</span>
            </div>
            <div class="favorite-translation">${phrase.translation}</div>
            <p class="favorite-description">${phrase.description}</p>
            <div class="favorite-actions">
                <button class="btn-outline remove-favorite" data-word="${phrase.word}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Удалить
                </button>
            </div>
        `;
        favoritesList.appendChild(favoriteItem);

        // Добавляем обработчик для кнопки озвучивания
        const speakBtn = favoriteItem.querySelector('.speak-favorite-btn');
        speakBtn.addEventListener('click', () => {
            speakPhrase(phrase);
        });
    });

    // Добавляем обработчики событий для кнопок удаления
    document.querySelectorAll('.remove-favorite').forEach(button => {
        button.addEventListener('click', function() {
            const phraseToRemove = this.getAttribute('data-word');
            const updatedFavorites = removeFromFavorites(phraseToRemove);

            // Обновляем список и фильтры
            displayFavorites();

            // Переинициализируем фильтры, если список избранного изменился
            if (updatedFavorites.length !== favorites.length) {
                initThemeFilters();
            }
        });
    });
}