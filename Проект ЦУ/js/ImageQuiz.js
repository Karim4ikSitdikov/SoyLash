// Переменные для хранения состояния квиза
let currentQuestion = 0;
let score = 0;
let selectedOption = null;
let quizCompleted = false;
let wordsData = []; // Массив для хранения загруженных слов
let currentCorrectWord = null; // Текущее правильное слово

// DOM элементы
const pronounceBtn = document.getElementById('pronounce-btn');
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
        optionsContainer.innerHTML = '<p>Ошибка загрузки данных. Пожалуйста, попробуйте позже.</p>';
    }
}

// Инициализация квиза
function initQuiz() {
    if (wordsData.length === 0) {
        optionsContainer.innerHTML = '<p>Нет данных для загрузки вопросов</p>';
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
    pronounceBtn.disabled = false;
    pronounceBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        </svg>
        Озвучить слово
    `;
    
    // Выбираем случайное слово из списка
    const randomIndex = Math.floor(Math.random() * wordsData.length);
    currentCorrectWord = wordsData[randomIndex];
    
    // Создаем массив с правильным и 3 случайными неправильными переводами
    const options = [currentCorrectWord.translation];
    
    // Добавляем 3 случайных неправильных перевода
    while (options.length < 4) {
        const randomWord = wordsData[Math.floor(Math.random() * wordsData.length)];
        if (!options.includes(randomWord.translation) && randomWord.word !== currentCorrectWord.word) {
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
        optionBtn.addEventListener('click', () => selectOption(optionBtn, option, currentCorrectWord.translation));
        optionsContainer.appendChild(optionBtn);
    });
}

// Озвучивание текущего слова
async function pronounceWord() {
    if (!currentCorrectWord?.word) return;

    pronounceBtn.disabled = true;
    pronounceBtn.innerHTML = 'Озвучивание...';

    try {
        const response = await fetch('http://localhost:5002/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: currentCorrectWord.word })
        });

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        console.error('Ошибка озвучивания:', error);
        alert('Не удалось озвучить слово');
    } finally {
        pronounceBtn.disabled = false;
        pronounceBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
            Озвучить слово
        `;
    }
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
pronounceBtn.addEventListener('click', pronounceWord);
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', initQuiz);

// Запускаем загрузку данных при загрузке страницы
document.addEventListener('DOMContentLoaded', loadWordsData);