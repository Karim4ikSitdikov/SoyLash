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

// Функция для озвучивания слова
function speakWord(word) {
    if (!word || !word.word) return;

    // Проверяем поддержку Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.word);

        // Устанавливаем язык (можно попробовать разные варианты)
        utterance.lang = 'tr-TR'; // Турецкий как приближение к татарскому
        // Или попробовать русский, если турецкий не работает хорошо
        // utterance.lang = 'ru-RU';

        // Настройки голоса
        utterance.rate = 0.9; // Скорость речи
        utterance.pitch = 1; // Высота тона

        // Попытка найти подходящий голос
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
            voice.lang.includes('tr') || voice.lang.includes('ru'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Озвучивание
        window.speechSynthesis.speak(utterance);
    } else {
        alert('Ваш браузер не поддерживает озвучивание текста. Попробуйте использовать Chrome или Edge.');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Загрузка данных из TXT
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

// Загрузка данных из TXT
async function loadWordsData() {
    try {
        const response = await fetch('../soylash_data.txt');
        const textData = await response.text();

        // Парсинг текстовых данных
        const lines = textData.split('\n');
        wordsData = lines.map(line => {
            const [word, partOfSpeech, frequency, translation, example] = line.split(';');
            return {
                word: word.trim(),
                partOfSpeech: partOfSpeech.trim(),
                translation: translation.trim(),
                example: example ? example.trim() : '',
                theme: getThemeByPartOfSpeech(partOfSpeech.trim()),
                speachWord: word.trim(), // Для озвучивания
                imageQuery: word.trim() // Для поиска изображений
            };
        }).filter(word => word.word); // Фильтрация пустых строк
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
        updateFavoritesCount(0);
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
        updateFavoritesCount(0);
        return;
    }

    updateFavoritesCount(favoriteWordsData.length);

    // Отображаем слова в новом формате
    favoriteWordsData.forEach(word => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <div class="favorite-header">
                <h3 class="favorite-title">${word.word}</h3>
                <button class="speak-favorite-btn" data-word="${word.word}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                </button>
            </div>
            <div class="favorite-meta">
                <span>${word.word.toLowerCase()}</span>
                <span class="word-theme-badge">${word.theme}</span>
            </div>
            <div class="favorite-translation">${word.translation}</div>
            <p class="favorite-description">${word.example}</p>
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
        button.addEventListener('click', function() {
            const wordToRemove = this.getAttribute('data-word');
            const updatedFavorites = removeFromFavorites(wordToRemove);

            // Обновляем список и фильтры
            displayFavorites();
            initThemeFilters();
        });
    });
}