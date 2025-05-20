// Данные из JSON
let wordsData = [];
let currentWord = null;
let correctAnswer = null;
let quizCompleted = false;

// DOM элементы
const quizWordText = document.getElementById('quiz-word-text');
const quizWordTranscription = document.getElementById('quiz-word-transcription');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const nextQuizBtn = document.getElementById('next-quiz-btn');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Загрузка данных из JSON
    await loadWordsData();

    // Начало квиза
    startNewQuiz();

    // Обработчик для кнопки "Следующее слово"
    nextQuizBtn.addEventListener('click', startNewQuiz);
});

// Загрузка данных из JSON
async function loadWordsData() {
    try {
        const response = await fetch('../words.json');
        wordsData = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Начать новый вопрос квиза
function startNewQuiz() {
    // Сброс состояния
    quizCompleted = false;
    quizFeedback.innerHTML = '';
    nextQuizBtn.style.display = 'none';

    // Выбор случайного слова
    const randomIndex = Math.floor(Math.random() * wordsData.length);
    currentWord = wordsData[randomIndex];

    // Отображение слова
    quizWordText.textContent = currentWord.word;
    quizWordTranscription.textContent = currentWord.transcription;

    // Генерация вариантов ответов
    generateQuizOptions(currentWord);
}

// Генерация вариантов ответов
function generateQuizOptions(correctWord) {
    quizOptions.innerHTML = '';

    // Создаем массив с 3 случайными неправильными ответами + правильный
    let options = [correctWord.translation];

    // Получаем 3 случайных неправильных перевода
    while (options.length < 4) {
        const randomWord = wordsData[Math.floor(Math.random() * wordsData.length)];
        if (!options.includes(randomWord.translation)) {
            options.push(randomWord.translation);
        }
    }

    // Перемешиваем варианты
    options = shuffleArray(options);

    // Создаем кнопки для каждого варианта
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'quiz-option';
        button.textContent = option;
        button.addEventListener('click', () => checkAnswer(option));
        quizOptions.appendChild(button);
    });
}

// Проверка ответа
function checkAnswer(selectedAnswer) {
    if (quizCompleted) return;

    quizCompleted = true;
    const options = document.querySelectorAll('.quiz-option');

    // Проверяем правильность ответа
    const isCorrect = selectedAnswer === currentWord.translation;

    // Подсвечиваем кнопки
    options.forEach(option => {
        option.disabled = true;
        if (option.textContent === currentWord.translation) {
            option.classList.add('correct');
        } else if (option.textContent === selectedAnswer && !isCorrect) {
            option.classList.add('incorrect');
        }
    });

    // Показываем обратную связь
    showFeedback(isCorrect);

    // Показываем кнопку "Следующее слово"
    nextQuizBtn.style.display = 'block';
}

// Показать обратную связь
function showFeedback(isCorrect) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = isCorrect ? 'feedback-correct' : 'feedback-incorrect';

    feedbackDiv.innerHTML = `
        <p>${isCorrect ? 'Правильно!' : 'Неправильно!'}</p>
        <p>${currentWord.description}</p>
    `;

    quizFeedback.appendChild(feedbackDiv);
}

// Вспомогательная функция для перемешивания массива
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}