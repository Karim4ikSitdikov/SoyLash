// DOM элементы
const wordTitle = document.querySelector('.word-title');
const transcription = document.querySelector('.transcription');
const wordTheme = document.querySelector('.word-theme');
const wordTranslation = document.querySelector('.word-translation');
const wordDescription = document.querySelector('.word-description');
const wordImage = document.querySelector('.word-image');
const favoriteBtn = document.querySelector('.favorite-btn');
const nextWordBtn = document.querySelector('.btn-primary');
const themeFilterButtons = document.querySelectorAll('.theme-filter button');
const themeFilter = document.querySelector('.theme-filter');
const speakBtn = document.querySelector('.speak-btn');

// Данные из JSON
let wordsData = [];
let currentWord = null;
let currentTheme = 'Все темы';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Загрузка данных из JSON
    await loadWordsData();

    // Установка обработчиков событий
    setupEventListeners();

    // Показать случайное слово
    showRandomWord();
});

// Загрузка данных из JSON
async function loadWordsData() {
    try {
        const response = await fetch('../words.json');
        wordsData = await response.json();

        // После загрузки данных создаем фильтры
        createThemeFilters();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Создание фильтров тем на основе данных
function createThemeFilters() {
    // Получаем все уникальные темы из данных
    const allThemes = ['Все темы', ...new Set(wordsData.map(word => word.theme))];

    // Очищаем текущие фильтры
    themeFilter.innerHTML = '';

    // Создаем кнопки для каждой темы
    allThemes.forEach(theme => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = theme;

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
            // Показываем случайное слово из выбранной темы
            showRandomWord();
        });
    });
}

// Установка обработчиков событий
function setupEventListeners() {
    // Кнопка "Следующее слово"
    nextWordBtn.addEventListener('click', showRandomWord);

    // Кнопка "В избранное"
    favoriteBtn.addEventListener('click', toggleFavorite);

    // Кнопка "Озвучить"
    speakBtn.addEventListener('click', speakCurrentWord);

    // Фильтры по темам
    themeFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Удаляем активный класс у всех кнопок
            themeFilterButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            button.classList.add('active');
            // Устанавливаем текущую тему
            currentTheme = button.textContent;
            // Показываем случайное слово из выбранной темы
            showRandomWord();
        });
    });

    // Кнопка перехода к избранному
    document.querySelector('header .btn-outline')?.addEventListener('click', function() {
        window.location.href = 'favorites.html';
    });
}

// Показать случайное слово
function showRandomWord() {
    // Фильтрация слов по выбранной теме
    let filteredWords = wordsData;
    if (currentTheme !== 'Все темы') {
        filteredWords = wordsData.filter(word => word.theme === currentTheme);
    }

    // Если нет слов в выбранной теме
    if (filteredWords.length === 0) {
        alert('Нет слов в выбранной теме');
        return;
    }

    // Выбор случайного слова
    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    currentWord = filteredWords[randomIndex];

    // Обновление интерфейса
    updateWordCard(currentWord);
}

// Обновление карточки слова
function updateWordCard(word) {
    wordTitle.textContent = word.word;
    transcription.textContent = word.transcription;
    wordTheme.textContent = word.theme;
    wordTranslation.textContent = word.translation;
    wordDescription.textContent = word.description;

    // Загрузка изображения из Unsplash
    loadWordImage(word.imageQuery);

    // Проверка, есть ли слово в избранном
    checkIfFavorite(word.word);

    // Обновляем кнопку озвучивания
    speakBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        </svg>
        Озвучить
    `;
}

// Озвучивание текущего слова
function speakCurrentWord() {
    if (!currentWord) return;

    // Проверяем поддержку Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentWord.speachWord);

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

// Загрузка изображения слова
async function loadWordImage(query) {
    try {
        const searchQuery = `${query}`;
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape&client_id=c0DDTVCG7lctOJTWJIvZ_F6J4ey07hO1MzmKfIgZNrc`);

        if (!response.ok) throw new Error('Ошибка API');

        const data = await response.json();

        if (data && data.urls && data.urls.regular) {
            wordImage.src = data.urls.regular;
            wordImage.alt = `Изображение для слова: ${query}`;
        } else {
            setFallbackImage();
        }
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        setFallbackImage();
    }
}

function setFallbackImage() {
    wordImage.src = 'https://images.unsplash.com/photo-1582139329536-e7284fece509?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80';
    wordImage.alt = 'Татарская культура - изображение по умолчанию';
}

// Проверка, есть ли слово в избранном
function checkIfFavorite(word) {
    const favorites = getFavorites();
    const isFavorite = favorites.includes(word);

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
    if (!currentWord) return;

    const favorites = getFavorites();
    const word = currentWord.word;
    const index = favorites.indexOf(word);

    if (index === -1) {
        // Добавляем в избранное
        favorites.push(word);
    } else {
        // Удаляем из избранного
        favorites.splice(index, 1);
    }

    // Сохраняем изменения
    saveFavorites(favorites);

    // Обновляем состояние кнопки
    checkIfFavorite(word);
}

// Общие функции для работы с LocalStorage
function getFavorites() {
    const favoritesJSON = localStorage.getItem('tatarLearnFavorites');
    return favoritesJSON ? JSON.parse(favoritesJSON) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('tatarLearnFavorites', JSON.stringify(favorites));
}