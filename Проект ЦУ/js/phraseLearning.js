// phraseLearning.js
// DOM элементы
const phraseTitle = document.getElementById('phrase-title');
const phraseTranscription = document.getElementById('phrase-transcription');
const phraseTheme = document.getElementById('phrase-theme');
const phraseTranslation = document.getElementById('phrase-translation');
const phraseDescription = document.getElementById('phrase-description');
const favoriteBtn = document.getElementById('favorite-btn');
const nextPhraseBtn = document.getElementById('next-phrase-btn');
const themeFilterButtons = document.querySelectorAll('.theme-filter button');
const themeFilter = document.querySelector('.theme-filter');
const speakBtn = document.getElementById('speak-btn');

// Данные из JSON
let phrasesData = [];
let currentPhrase = null;
let currentTheme = 'Все темы';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Загрузка данных из JSON
    await loadPhrasesData();

    // Установка обработчиков событий
    setupEventListeners();

    // Показать случайную фразу
    showRandomPhrase();
});

// Загрузка данных из JSON
async function loadPhrasesData() {
    try {
        const response = await fetch('../phrases.json');
        phrasesData = await response.json();

        // После загрузки данных создаем фильтры
        createThemeFilters();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Создание фильтров тем на основе данных
function createThemeFilters() {
    // Получаем все уникальные темы из данных
    const allThemes = ['Все темы', ...new Set(phrasesData.map(phrase => phrase.theme))];

    // Очищаем текущие фильтры
    themeFilter.innerHTML = '';

    // Создаем кнопки для каждой темы
    allThemes.forEach(theme => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = theme;
        button.setAttribute('data-theme', theme);

        // Делаем "Все темы" активной по умолчанию
        if (theme === 'Все темы') {
            button.classList.add('active');
        }

        li.appendChild(button);
        themeFilter.appendChild(li);
    });

    // Обновляем обработчики событий для новых кнопок
    updateThemeFilterListeners();
}

// Обновление обработчиков событий для кнопок фильтров
function updateThemeFilterListeners() {
    const buttons = document.querySelectorAll('.theme-filter button');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Удаляем активный класс у всех кнопок
            buttons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            button.classList.add('active');
            // Устанавливаем текущую тему
            currentTheme = button.textContent;
            // Показываем случайную фразу из выбранной темы
            showRandomPhrase();
        });
    });
}

// Установка обработчиков событий
function setupEventListeners() {
    // Кнопка "Следующая фраза"
    nextPhraseBtn.addEventListener('click', showRandomPhrase);

    // Кнопка "В избранное"
    favoriteBtn.addEventListener('click', toggleFavorite);

    // Кнопка "Озвучить"
    speakBtn.addEventListener('click', speakCurrentPhrase);

    // Кнопка перехода к избранному
    document.querySelector('header .btn-outline')?.addEventListener('click', function() {
        window.location.href = 'favoritesPhrases.html';
    });
}

// Показать случайную фразу
function showRandomPhrase() {
    // Фильтрация фраз по выбранной теме
    let filteredPhrases = phrasesData;
    if (currentTheme !== 'Все темы') {
        filteredPhrases = phrasesData.filter(phrase => phrase.theme === currentTheme);
    }

    // Если нет фраз в выбранной теме
    if (filteredPhrases.length === 0) {
        alert('Нет фраз в выбранной теме');
        return;
    }

    // Выбор случайной фразы
    const randomIndex = Math.floor(Math.random() * filteredPhrases.length);
    currentPhrase = filteredPhrases[randomIndex];

    // Обновление интерфейса
    updatePhraseCard(currentPhrase);
}

// Обновление карточки фразы
function updatePhraseCard(phrase) {
    phraseTitle.textContent = phrase.word;
    phraseTranscription.textContent = phrase.transcription;
    phraseTheme.textContent = phrase.theme;
    phraseTranslation.textContent = phrase.translation;
    phraseDescription.textContent = phrase.description;

    // Проверка, есть ли фраза в избранном
    checkIfFavorite(phrase.word);

    // Обновляем кнопку озвучивания
    speakBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        </svg>
        Озвучить
    `;
}

// Озвучивание текущей фразы
function speakCurrentPhrase() {
    if (!currentPhrase) return;

    // Проверяем поддержку Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentPhrase.speachWord);

        // Устанавливаем язык
        utterance.lang = 'tr-TR'; // Турецкий как приближение к татарскому

        // Настройки голоса
        utterance.rate = 0.9;
        utterance.pitch = 1;

        // Попытка найти подходящий голос
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.lang.includes('tr') || voice.lang.includes('ru'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Озвучивание
        window.speechSynthesis.speak(utterance);

        // Обновляем кнопку во время озвучивания
        speakBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
            Озвучивается...
        `;

        // Возвращаем обычное состояние кнопки после завершения
        utterance.onend = function() {
            speakBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
                Озвучить
            `;
        };
    } else {
        alert('Ваш браузер не поддерживает озвучивание текста. Попробуйте использовать Chrome или Edge.');
    }
}

// Проверка, есть ли фраза в избранном
function checkIfFavorite(phrase) {
    const favorites = getFavorites();
    const isFavorite = favorites.includes(phrase);

    if (isFavorite) {
        favoriteBtn.classList.add('active');
        favoriteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            В избранном
        `;
    } else {
        favoriteBtn.classList.remove('active');
        favoriteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            В избранное
        `;
    }
}

// Переключение избранного
function toggleFavorite() {
    if (!currentPhrase) return;

    const favorites = getFavorites();
    const phrase = currentPhrase.word;
    const index = favorites.indexOf(phrase);

    if (index === -1) {
        // Добавляем в избранное
        favorites.push(phrase);
    } else {
        // Удаляем из избранного
        favorites.splice(index, 1);
    }

    // Сохраняем изменения
    saveFavorites(favorites);

    // Обновляем состояние кнопки
    checkIfFavorite(phrase);
}

// Общие функции для работы с LocalStorage
function getFavorites() {
    const favoritesJSON = localStorage.getItem('tatarLearnFavoritesPhrases');
    return favoritesJSON ? JSON.parse(favoritesJSON) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('tatarLearnFavoritesPhrases', JSON.stringify(favorites));
}