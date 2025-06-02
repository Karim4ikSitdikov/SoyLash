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
    const updatedFavorites = favorites.filter(fav => fav.word !== word);
    saveFavorites(updatedFavorites);

    // Обновляем состояние кнопки в wordLearning.js, если он открыт
    if (window.opener && window.opener.checkIfFavorite) {
        window.opener.checkIfFavorite(word);
    }

    return updatedFavorites;
}

// Функция озвучивания слова
async function speakWord(wordData) {
    if (!wordData?.word) return;

    const btn = document.querySelector(`.speak-favorite-btn[data-word="${wordData.word}"]`);
    if (!btn) return;

    const originalContent = btn.innerHTML;

    try {
        // Показываем состояние загрузки
        btn.disabled = true;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
        `;

        // Отправляем запрос на сервер для синтеза речи
        const response = await fetch('http://localhost:5002/synthesize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: wordData.word })
        });

        if (!response.ok) {
            throw new Error('Ошибка сервера');
        }

        // Получаем аудио и воспроизводим без отображения плеера
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();

    } catch (error) {
        console.error('Ошибка озвучивания:', error);
        alert('Не удалось озвучить слово');
    } finally {
        // Восстанавливаем исходное состояние кнопки
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }, 1000); // Задержка для лучшего UX
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function () {
    // Загрузка данных из JSON (для совместимости)
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

// Загрузка данных из JSON (для совместимости)
async function loadWordsData() {
    try {
        const response = await fetch('../tatar_words.json');
        const jsonData = await response.json();

        wordsData = jsonData.map(item => ({
            word: item.word,
            partOfSpeech: item.type,
            translation: item.translation,
            example: "",
            theme: getThemeByPartOfSpeech(item.type),
            speachWord: item.word,
            imageQuery: item.translation.split(',')[0].trim()
        }));
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Функция для определения темы по части речи
function getThemeByPartOfSpeech(partOfSpeech) {
    const themes = {
        'N': 'Существительные',
        'V': 'Глаголы',
        'ADJ': 'Прилагательные',
        'ADV': 'Наречия',
        'POST': 'Послелоги',
        'PART': 'Частицы',
        'PROP': 'Свойства',
        'MOD': 'Модальные',
        'INTRJ': 'Междометия',
        'PN': 'Местоимения'
    };
    return themes[partOfSpeech] || 'Другие';
}

// Инициализация фильтров тем
function initThemeFilters() {
    const filtersContainer = document.getElementById('theme-filters');
    if (!filtersContainer) return;

    // Очищаем все фильтры, кроме "Все темы"
    filtersContainer.innerHTML = '<li><button class="active" data-theme="all">Все темы</button></li>';

    // Получаем все уникальные темы из избранных слов
    const favorites = getFavorites();
    const uniqueThemes = [...new Set(favorites.map(word => word.theme))];

    // Добавляем кнопки фильтров
    uniqueThemes.forEach(theme => {
        const li = document.createElement('li');
        li.innerHTML = `<button data-theme="${theme}">${theme}</button>`;
        filtersContainer.appendChild(li);
    });
}

// Установка обработчиков событий
function setupEventListeners() {
    // Фильтры по темам
    document.querySelectorAll('.theme-filter button').forEach(button => {
        button.addEventListener('click', function () {
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
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-favorite') ||
            e.target.closest('.remove-favorite')) {
            const button = e.target.classList.contains('remove-favorite')
                ? e.target
                : e.target.closest('.remove-favorite');
            const word = button.getAttribute('data-word');
            removeFromFavorites(word);
            displayFavorites();
            initThemeFilters();
        }
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
        updateFavoritesCount(0);
        return;
    }

    // Фильтруем слова по теме, если выбран не "all"
    let favoriteWordsData = currentThemeFilter === 'all'
        ? favorites
        : favorites.filter(word => word.theme === currentThemeFilter);

    if (favoriteWordsData.length === 0) {
        favoritesList.innerHTML = '<div class="empty-favorites">Нет слов в выбранной теме</div>';
        updateFavoritesCount(0);
        return;
    }

    updateFavoritesCount(favoriteWordsData.length);

    // Отображаем слова
    favoriteWordsData.forEach(word => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <div class="favorite-header">
                <h3 class="favorite-title">${word.word || 'Неизвестное слово'}</h3>
                <button class="speak-favorite-btn" data-word="${word.word}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                </button>
            </div>
            <div class="favorite-meta" style="margin-top: 8px;">
                <span class="word-theme-badge">${word.theme || 'Неизвестная тема'}</span>
            </div>
            <div class="favorite-translation">${word.translation || 'Перевод не указан'}</div>
            ${word.example ? `<p class="favorite-description">${word.example}</p>` : ''}
            <div class="favorite-actions">
                <button class="btn-outline remove-favorite" data-word="${word.word}">
                    Удалить
                </button>
            </div>
        `;
        favoritesList.appendChild(favoriteItem);

        // Добавляем обработчик для кнопки озвучивания
        const speakBtn = favoriteItem.querySelector('.speak-favorite-btn');
        speakBtn.addEventListener('click', () => {
            speakWord(word);
        });
    });

    // Добавляем обработчики событий для кнопок удаления
    document.querySelectorAll('.remove-favorite').forEach(button => {
        button.addEventListener('click', function () {
            const wordToRemove = this.getAttribute('data-word');
            const updatedFavorites = removeFromFavorites(wordToRemove);

            // Обновляем список и фильтры
            displayFavorites();
            initThemeFilters();
        });
    });
}
