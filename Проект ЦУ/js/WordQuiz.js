// Переменные для хранения состояния квиза
let currentQuestion = 0;
let score = 0;
let selectedOption = null;
let quizCompleted = false;
let wordsData = []; // Массив для хранения загруженных слов

// DOM элементы
const wordDisplay = document.getElementById('word-display');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const currentQuestionElement = document.getElementById('current-question');
const resultContainer = document.getElementById('result-container');
const finalScoreElement = document.getElementById('final-score');
const resultMessageElement = document.getElementById('result-message');
const restartBtn = document.getElementById('restart-btn');
const questionContainer = document.querySelector('.question-container');

// Загрузка данных из JSON файла
async function loadWordsData() {
    try {
        const response = await fetch('../tatar_words.json');
        if (!response.ok) {
            throw new Error('Не удалось загрузить данные');
        }
        wordsData = await response.json();
        initQuiz();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        wordDisplay.textContent = 'Ошибка загрузки данных. Пожалуйста, попробуйте позже.';
        optionsContainer.innerHTML = '';
    }
}

// Инициализация квиза
function initQuiz() {
    if (wordsData.length === 0) {
        wordDisplay.textContent = 'Нет данных для загрузки вопросов';
        return;
    }

    currentQuestion = 0;
    score = 0;
    quizCompleted = false;
    resultContainer.style.display = 'none';
    questionContainer.style.display = 'block';
    loadQuestion();
}

// Загрузка вопроса
function loadQuestion() {
    if (currentQuestion >= 10) {
        showResults();
        return;
    }

    currentQuestionElement.textContent = currentQuestion + 1;
    nextBtn.style.display = 'none';
    optionsContainer.innerHTML = '';
    
    // Выбираем случайное слово из списка
    const randomIndex = Math.floor(Math.random() * wordsData.length);
    const questionWord = wordsData[randomIndex];
    
    wordDisplay.textContent = questionWord.word;
    
    // Создаем массив с правильным и 3 случайными неправильными переводами
    const options = [questionWord.translation];
    
    // Добавляем 3 случайных неправильных перевода
    while (options.length < 4) {
        const randomWord = wordsData[Math.floor(Math.random() * wordsData.length)];
        if (!options.includes(randomWord.translation) && randomWord.word !== questionWord.word) {
            options.push(randomWord.translation);
        }
    }
    
    // Перемешиваем варианты ответов
    shuffleArray(options);
    
    // Создаем кнопки для вариантов ответов
    options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.classList.add('option-btn');
        optionBtn.textContent = option;
        optionBtn.addEventListener('click', () => selectOption(optionBtn, option, questionWord.translation));
        optionsContainer.appendChild(optionBtn);
    });
}

// Выбор варианта ответа
function selectOption(optionBtn, selectedTranslation, correctTranslation) {
    if (quizCompleted) return;
    
    // Отключаем все кнопки
    const allOptions = document.querySelectorAll('.option-btn');
    allOptions.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
    });
    
    // Проверяем ответ
    if (selectedTranslation === correctTranslation) {
        optionBtn.classList.add('correct');
        score++;
    } else {
        optionBtn.classList.add('incorrect');
        // Показываем правильный ответ
        allOptions.forEach(btn => {
            if (btn.textContent === correctTranslation) {
                btn.classList.add('correct');
            }
        });
    }
    
    selectedOption = optionBtn;
    nextBtn.style.display = 'block';
}

// Переход к следующему вопросу
function nextQuestion() {
    currentQuestion++;
    loadQuestion();
}

// Показать результаты
// Показать результаты
function showResults() {
    quizCompleted = true;
    questionContainer.style.display = 'none';
    nextBtn.style.display = 'none';
    resultContainer.style.display = 'block';
    finalScoreElement.textContent = score;
    
    // Определяем сообщение в зависимости от результата
    if (score >= 7) {
        resultMessageElement.textContent = 'Отличный результат! Вы хорошо знаете татарские слова!';
    } else if (score >= 4) {
        resultMessageElement.textContent = 'Хорошо, но могло быть и лучше. Продолжайте учиться!';
    } else {
        resultMessageElement.textContent = 'Плохой результат. Нужно учиться усерднее!';
    }

    // Если квиз пройден на 10/10, увеличиваем счетчик
    if (score === 10) {
        incrementCompletedQuizzes();
    }
}

// Увеличиваем счетчик пройденных квизов
function incrementCompletedQuizzes() {
    let completedQuizzes = getCompletedQuizzes();
    completedQuizzes += 1;
    localStorage.setItem('completedQuizzes', completedQuizzes.toString());
    
    // Обновляем прогресс-бар
    updateProgressBars();
}

// Получаем количество пройденных квизов из LocalStorage
function getCompletedQuizzes() {
    const quizzes = localStorage.getItem('completedQuizzes');
    return quizzes ? parseInt(quizzes) : 0;
}

// Обновляем прогресс-бары
function updateProgressBars() {
    const completedQuizzes = getCompletedQuizzes();
    document.getElementById('quizzes-progress-value').textContent = `${completedQuizzes}/109`;
    document.getElementById('quizzes-progress-bar').style.width = `${Math.round((completedQuizzes / 109) * 100)}%`;
}

// Вспомогательная функция для перемешивания массива
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Обработчики событий
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', initQuiz);

// Запускаем загрузку данных при загрузке страницы
document.addEventListener('DOMContentLoaded', loadWordsData);
