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
const feedbackAudioPlayer = document.getElementById('feedbackAudioPlayer');
const feedbackAudioContainer = document.getElementById('feedbackAudioContainer')
const userAudioContainer = document.getElementById('userAudioContainer')


function initRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        recordBtn.disabled = true;
        console.error('Браузер не поддерживает запись звука');
    }
}

recordBtn.addEventListener('click', async function () {
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
checkBtn.addEventListener('click', async function () {
    if (!currentWord || !userAudioBlob) return;

    checkBtn.disabled = true;
    checkBtn.textContent = 'Проверка...';

    try {
        const formData = new FormData();
        formData.append('text', currentWord.word);
        formData.append('audio', userAudioBlob, 'recording.wav');

        const response = await fetch('http://95.183.13.188:5003/check_pronunciation', {
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
    console.log("Полученные данные с сервера:", result);

    resultContainer.style.display = 'block';

    if (result.result === "correct") {
        resultText.textContent = "✅ Ваше произношение правильное!"; //вывод текста правильно или нет
        resultText.style.color = "green";
        feedbackAudioContainer.style.display = 'none';
    } else {
        resultText.textContent = "❌ Ваше произношение содержит ошибки. Прослушайте исправленный вариант:";
        resultText.style.color = "red";

        if (result.feedback_audio) { // если неправильно, то выводится замедленное в местах ошибок аудио
            const audioBlob = base64ToBlob(result.feedback_audio, 'audio/wav');
            const audioUrl = URL.createObjectURL(audioBlob);
            feedbackAudioPlayer.src = audioUrl;
            feedbackAudioContainer.style.display = 'block';
        }
    }
    // вывод введеных слов через пробел, каждое из которых подсвечено определенным цветом
    wordAccuracy.innerHTML = '';

    if (result.words && result.accuracy) {
        const words = typeof result.words === 'string' ? result.words.split(' ') : result.words;
        const accuracy = Array.isArray(result.accuracy) ? result.accuracy : [];

        const minLength = Math.min(words.length, accuracy.length);

        for (let i = 0; i < minLength; i++) {
            const word = words[i];
            const accuracyValue = parseInt(result.accuracy[i]);

            const wordContainer = document.createElement('div');
            wordContainer.style.display = 'inline-block';
            wordContainer.style.margin = '0 5px';
            wordContainer.style.padding = '2px 0';

            // Правильная обработка всех случаев точности
            if (accuracyValue === 0) {
                // ВСЁ СЛОВО ЗЕЛЕНОЕ (правильное)
                wordContainer.innerHTML = `
                    <span style="
                        background-color: #4CAF50;
                        color: white;
                        padding: 2px 5px;
                        border-radius: 3px;
                        display: inline-block;
                    ">${word}</span>
                `;
            }
            else if (accuracyValue === 1) {
                // Первая половина КРАСНАЯ, вторая ЗЕЛЕНАЯ
                const half = Math.ceil(word.length / 2);
                wordContainer.innerHTML = `
                    <span style="
                        background-color: #F44336;
                        color: white;
                        padding: 2px 0 2px 5px;
                        border-radius: 3px 0 0 3px;
                        display: inline-block;
                    ">${word.substring(0, half)}</span>
                    <span style="
                        background-color: #4CAF50;
                        color: white;
                        padding: 2px 5px 2px 0;
                        border-radius: 0 3px 3px 0;
                        display: inline-block;
                    ">${word.substring(half)}</span>
                `;
            }
            else if (accuracyValue === 2) {
                // Первая половина ЗЕЛЕНАЯ, вторая КРАСНАЯ
                const half = Math.ceil(word.length / 2);
                wordContainer.innerHTML = `
                    <span style="
                        background-color: #4CAF50;
                        color: white;
                        padding: 2px 0 2px 5px;
                        border-radius: 3px 0 0 3px;
                        display: inline-block;
                    ">${word.substring(0, half)}</span>
                    <span style="
                        background-color: #F44336;
                        color: white;
                        padding: 2px 5px 2px 0;
                        border-radius: 0 3px 3px 0;
                        display: inline-block;
                    ">${word.substring(half)}</span>
                `;
            }
            else {
                // ВСЁ СЛОВО КРАСНОЕ (accuracyValue === 3 или некорректное значение)
                wordContainer.innerHTML = `
                    <span style="
                        background-color: #F44336;
                        color: white;
                        padding: 2px 5px;
                        border-radius: 3px;
                        display: inline-block;
                    ">${word}</span>
                `;
            }

            wordAccuracy.appendChild(wordContainer);
        }
    }
}

// Вспомогательные функции
function base64ToBlob(base64) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: 'audio/wav' });
}

// Данные из TXT
let wordsData = [];
let currentWord = null;
let currentTheme = 'Все темы';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function () {
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
    const allThemes = ['Все темы', ...new Set(wordsData.map(word => word.theme))];
    themeFilter.innerHTML = '';

    allThemes.forEach(theme => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = theme;

        if (theme === 'Все темы') {
            button.classList.add('active');
        }

        li.appendChild(button);
        themeFilter.appendChild(li);
    });

    updateThemeFilterListeners();
}

// Обновление обработчиков событий для кнопок фильтров
function updateThemeFilterListeners() {
    const buttons = document.querySelectorAll('.theme-filter button');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentTheme = button.textContent;
            showRandomWord();
        });
    });
}

// Установка обработчиков событий
function setupEventListeners() {
    nextWordBtn.addEventListener('click', showRandomWord);
    favoriteBtn.addEventListener('click', toggleFavorite);
    speakBtn.addEventListener('click', speakCurrentWord);

    document.querySelector('header .btn-outline')?.addEventListener('click', function () {
        window.location.href = 'favorites.html';
    });
}

// Показать случайное слово
async function showRandomWord() {
    sampleAudioContainer.style.display = 'none'
    userAudioContainer.style.display = 'none'
    feedbackAudioContainer.style.display = 'none'
    resultContainer.style.display = 'none'
    let filteredWords = wordsData;
    if (currentTheme !== 'Все темы') {
        filteredWords = wordsData.filter(word => word.theme === currentTheme);
    }

    if (filteredWords.length === 0) {
        alert('Нет слов в выбранной теме');
        return;
    }

    const wordCard = document.querySelector('.word-card');
    wordCard.classList.add('fade-out');
    await new Promise(resolve => setTimeout(resolve, 300));

    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    currentWord = filteredWords[randomIndex];

    updateWordCard(currentWord);

    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    wordCard.classList.remove('fade-out');
    wordCard.classList.add('fade-in');

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
    wordTitle.textContent = capitalizeFirstLetter(word.word);
    wordTheme.textContent = word.theme;
    wordTranslation.textContent = word.translation
        .split(',')
        .map(trans => capitalizeFirstLetter(trans.trim()))
        .join(', ');

    loadWordImage(currentWord.translation);
    checkIfFavorite(word.word);
}

// Озвучивание текущего слова
async function speakCurrentWord() {
    if (!currentWord?.word) return;

    speakBtn.disabled = true;
    speakBtn.innerHTML = 'Озвучивание...';

    try {
        const response = await fetch('http://95.183.13.188:5002/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: currentWord.word })
        });

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
    const API_KEY = 'AIzaSyCuAJVk4zyqErRT-E3sfPdcoYI_adl5P9U';
    const CX = 'd3ee921230e0b4111';

    try {
        const mainKeyword = translation.split(',')[0].trim();
        const query = encodeURIComponent(mainKeyword);

        const response = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${query}&searchType=image`
        );

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
    const isFavorite = favorites.some(fav => fav.word === word);

    if (isFavorite) {
        favoriteBtn.classList.add('active');
        favoriteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#4a6fa5" stroke="#4a6fa5" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Добавлено
        `;
    } else {
        favoriteBtn.classList.remove('active');
        favoriteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            В избранное
        `;
    }
}


// Переключение избранного
// Обновленная функция toggleFavorite
function toggleFavorite() {
    if (!currentWord?.word) return;
    if (favoriteBtn.classList.contains('active')) return; // Запрещаем повторное нажатие

    const favorites = getFavorites();
    const wordData = {
        word: currentWord.word,
        partOfSpeech: currentWord.partOfSpeech,
        translation: currentWord.translation,
        example: currentWord.example || "",
        theme: getThemeByPartOfSpeech(currentWord.partOfSpeech),
        speachWord: currentWord.speachWord || currentWord.word,
        imageQuery: currentWord.imageQuery || currentWord.translation.split(',')[0].trim()
    };

    favorites.push(wordData);
    saveFavorites(favorites);

    // Обновляем состояние кнопки
    favoriteBtn.classList.add('active');
    favoriteBtn.disabled = true;
    favoriteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#4a6fa5" stroke="#4a6fa5" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        Добавлено
    `;

    // Через 2 секунды возвращаем возможность удалить из избранного
    setTimeout(() => {
        favoriteBtn.disabled = false;
    }, 2000);
}

// Общие функции для работы с LocalStorage
function getFavorites() {
    const favoritesJSON = localStorage.getItem('tatarLearnFavorites');
    return favoritesJSON ? JSON.parse(favoritesJSON) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('tatarLearnFavorites', JSON.stringify(favorites));
}
