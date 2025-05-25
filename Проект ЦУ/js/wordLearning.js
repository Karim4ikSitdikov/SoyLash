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

// Данные из TXT
let wordsData = [];
let currentWord = null;
let currentTheme = 'Все темы';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Загрузка данных из TXT
    await loadWordsData();

    // Установка обработчиков событий
    setupEventListeners();

    // Показать случайное слово
    showRandomWord();
});

// Загрузка данных из TXT
async function loadWordsData() {
    try {
        const response = await fetch('../soylash_data.txt');
        const textData = await response.text();

        // Парсинг текстовых данных
        const lines = textData.split('\n');
        wordsData = lines.map(line => {
            const [word, partOfSpeech, frequency, translation, example] = line.split(';');

            // Форматирование слова и перевода - первая буква заглавная
            const formattedWord = capitalizeFirstLetter(word.trim());
            const formattedTranslation = capitalizeFirstLetter(translation.trim());
            const formattedExample = example ? capitalizeFirstLetter(example.trim()) : '';

            return {
                word: formattedWord,
                partOfSpeech: partOfSpeech.trim(),
                translation: formattedTranslation,
                example: formattedExample,
                theme: getThemeByPartOfSpeech(partOfSpeech.trim()),
                speachWord: formattedWord, // Для озвучивания
                imageQuery: formattedTranslation // Для поиска изображений используем перевод
            };
        }).filter(word => word.word); // Фильтрация пустых строк

        // После загрузки данных создаем фильтры
        createThemeFilters();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Функция для преобразования первой буквы в заглавную
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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

    // Кнопка перехода к избранному
    document.querySelector('header .btn-outline')?.addEventListener('click', function() {
        window.location.href = 'favorites.html';
    });
}

// Показать случайное слово
// Показать случайное слово с анимацией
async function showRandomWord() {
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

    // Добавляем класс для анимации исчезновения
    const wordCard = document.querySelector('.word-card');
    wordCard.classList.add('fade-out');

    // Ждем завершения анимации исчезновения
    await new Promise(resolve => setTimeout(resolve, 300));

    // Выбор случайного слова
    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    currentWord = filteredWords[randomIndex];

    // Обновление интерфейса
    updateWordCard(currentWord);

    // Добавляем небольшую задержку перед появлением нового слова (100-300мс)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Добавляем класс для анимации появления
    wordCard.classList.remove('fade-out');
    wordCard.classList.add('fade-in');

    // Убираем класс анимации после завершения
    setTimeout(() => {
        wordCard.classList.remove('fade-in');
    }, 300);

    const learnedWords = getLearnedWords();
    if (!learnedWords.includes(currentWord.word)) {
        learnedWords.push(currentWord.word);
        localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
    }
}
function getLearnedWords() {
    const learned = localStorage.getItem('learnedWords');
    return learned ? JSON.parse(learned) : [];
}
// Обновление карточки слова
function updateWordCard(word) {
    wordTitle.textContent = word.word;
    transcription.textContent = `[${word.word.toLowerCase()}]`;
    wordTheme.textContent = word.theme;
    wordTranslation.textContent = word.translation;
    wordDescription.textContent = word.example || `Пример использования слова "${word.word}" в предложении`;

    // Загрузка изображения из Unsplash (теперь по переводу слова)
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
async function speakCurrentWord() {
    if (!currentWord) return;

    const btn = speakBtn;
    const originalContent = btn.innerHTML;

    try {
        // Показываем состояние загрузки
        btn.disabled = true;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
            Озвучивается...
        `;

        // Отправляем запрос на сервер для синтеза речи
        const response = await fetch('http://localhost:5000/synthesize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: currentWord.speachWord })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Ошибка сервера');
        }

        // Получаем аудио и воспроизводим
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();

    } catch (error) {
        console.error('Ошибка озвучивания:', error);
        alert(error.message || 'Ошибка при озвучивании слова');
    } finally {
        // Восстанавливаем исходное состояние кнопки
        btn.disabled = false;
        btn.innerHTML = originalContent;
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