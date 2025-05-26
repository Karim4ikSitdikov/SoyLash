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
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let userAudioBlob = null;
const recordBtn = document.getElementById('recordBtn');
const checkBtn = document.getElementById('checkBtn');
const userAudioPlayer = document.getElementById('userAudioPlayer');
const resultContainer = document.getElementById('resultContainer');
const resultText = document.getElementById('resultText');
const wordAccuracy = document.getElementById('wordAccuracy');
const sampleAudioContainer = document.getElementById('sampleAudioContainer');
const sampleAudioPlayer = document.getElementById('sampleAudioPlayer');

function initRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        recordBtn.disabled = true;
        console.error('Браузер не поддерживает запись звука');
    }
}

recordBtn.addEventListener('click', async function() {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

            mediaRecorder.onstop = () => {
                userAudioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                userAudioPlayer.src = URL.createObjectURL(userAudioBlob);
                document.getElementById('userAudioContainer').style.display = 'block';
                checkBtn.disabled = false;
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            recordBtn.textContent = 'Остановить запись';
            checkBtn.disabled = true;
        } catch (error) {
            console.error('Ошибка записи:', error);
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.textContent = 'Начать запись';
    }
});

// Обработчик проверки произношения
checkBtn.addEventListener('click', async function() {
    if (!currentWord || !userAudioBlob) return;

    checkBtn.disabled = true;
    checkBtn.textContent = 'Проверка...';

    try {
        const formData = new FormData();
        formData.append('text', currentWord.word);
        formData.append('audio', userAudioBlob, 'recording.wav');

        const response = await fetch('http://localhost:5001/check_pronunciation', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        displayPronunciationResult(result);
    } catch (error) {
        console.error('Ошибка проверки:', error);
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Проверить';
    }
});

// Отображение результатов проверки
function displayPronunciationResult(result) {
    resultContainer.style.display = 'block';
    wordAccuracy.innerHTML = '';

    if (result.result === "correct") {
        resultText.textContent = "✅ Правильное произношение!";
        resultText.style.color = "green";
    } else {
        resultText.textContent = "❌ Нужно поработать над произношением";
        resultText.style.color = "red";
    }

    if (result.words && result.accuracy) {
        result.words.forEach((word, index) => {
            const accuracy = result.accuracy[index];
            const wordElement = document.createElement('div');
            wordElement.className = `word-box accuracy-${accuracy}`;
            wordElement.textContent = word;
            wordAccuracy.appendChild(wordElement);
        });
    }
}

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


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initRecording);

// Загрузка данных из TXT
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
    // Форматируем слово и перевод
    wordTitle.textContent = capitalizeFirstLetter(word.word);
    wordTheme.textContent = word.theme;
    wordTranslation.textContent = word.translation
        .split(',')
        .map(trans => capitalizeFirstLetter(trans.trim()))
        .join(', ');

    loadWordImage(currentWord.translation); // Вместо word.imageQuery
    checkIfFavorite(word.word);
}

// Озвучивание текущего слова
async function speakCurrentWord() {
    if (!currentWord?.word) {
        console.error('Нет текущего слова для озвучивания');
        return;
    }

    speakBtn.disabled = true;
    speakBtn.innerHTML = 'Озвучивание...';

    try {
        const response = await fetch('http://10.18.1.30:5000/synthesize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: currentWord.word })
        });

        if (!response.ok) {
            throw new Error('Ошибка синтеза речи');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        sampleAudioPlayer.src = audioUrl;
        sampleAudioContainer.style.display = 'block';
        sampleAudioPlayer.play();

    } catch (error) {
        console.error('Ошибка озвучивания:', error);
        alert('Не удалось озвучить слово');
    } finally {
        speakBtn.disabled = false;
        speakBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
            Озвучить
        `;
    }
}


async function loadWordImage(translation) {
    const API_KEY = 'AIzaSyCuAJVk4zyqErRT-E3sfPdcoYI_adl5P9U'; // 🔴 Временный ключ (замените на защищенный)
    const CX = 'd3ee921230e0b4111';

    try {
        // Берем первое слово из перевода до запятой
        const mainKeyword = translation.split(',')[0].trim();
        const query = encodeURIComponent(mainKeyword);

        const response = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${query}&searchType=image`
        );

        // Детальная обработка ошибок
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google API Error:', errorData.error.message);
            setFallbackImage();
            return;
        }

        const data = await response.json();

        if (data.items?.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.items.length);
            wordImage.src = data.items[randomIndex].link;
            wordImage.alt = `Изображение: ${mainKeyword}`;
        } else {
            setFallbackImage();
        }

    } catch (error) {
        console.error('Ошибка сети:', error);
        setFallbackImage();
    }
}

function setFallbackImage() {
    wordImage.src = 'https://dummyimage.com/600x400/ccc/fff&text=Изображение+не+найдено';
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
    if (!currentWord?.word) {
        console.error('No current word');
        return;
    }

    const favorites = getFavorites();
    const word = currentWord.word;
    const index = favorites.indexOf(word);

    // Toggle favorite
    const newFavorites = index === -1
        ? [...favorites, word]
        : favorites.filter((_, i) => i !== index);

    saveFavorites(newFavorites); // <-- Используем обновленный массив
    checkIfFavorite(word); // Обновляем UI

    // Добавляем синхронизацию для страницы избранного
    if (window.location.pathname.includes('favorites.html')) {
        displayFavorites();
    }
}

// Общие функции для работы с LocalStorage
function getFavorites() {
    const favoritesJSON = localStorage.getItem('tatarLearnFavorites');
    return favoritesJSON ? JSON.parse(favoritesJSON) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('tatarLearnFavorites', JSON.stringify(favorites));
}