// WordQuiz.js
let allQuestions = [];
let currentQuiz = {
    total: 0,
    current: 0,
    correct: 0,
    mistakes: []
};

// DOM элементы
const quizStart = document.getElementById('quiz-start');
const quizProgress = document.getElementById('quiz-progress');
const quizContent = document.getElementById('quiz-content');
const quizResults = document.getElementById('quiz-results');
const quizWordText = document.getElementById('quiz-word-text');
const quizWordTranscription = document.getElementById('quiz-word-transcription');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const nextQuizBtn = document.getElementById('next-quiz-btn');

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', startQuiz);
    });
});

async function loadData() {
    try {
        const [wordsRes, phrasesRes] = await Promise.all([
            fetch('../words.json'),
            fetch('../phrases.json')
        ]);
        const words = await wordsRes.json();
        const phrases = await phrasesRes.json();
        allQuestions = [...words, ...phrases];
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Ошибка загрузки данных. Пожалуйста, перезагрузите страницу.');
    }
}

function startQuiz(e) {
    const size = parseInt(e.target.dataset.size);
    currentQuiz = {
        total: size,
        current: 1,
        correct: 0,
        mistakes: []
    };

    quizStart.style.display = 'none';
    quizProgress.style.display = 'block';
    quizContent.style.display = 'block';
    quizResults.style.display = 'none';

    document.getElementById('total-questions').textContent = size;
    showNextQuestion();
}

function showNextQuestion() {
    if (currentQuiz.current > currentQuiz.total) {
        showResults();
        return;
    }

    document.getElementById('current-question').textContent = currentQuiz.current;
    const question = allQuestions[Math.floor(Math.random() * allQuestions.length)];

    // Очистка предыдущего состояния
    quizWordText.textContent = question.word;
    quizWordTranscription.textContent = question.transcription;
    quizOptions.innerHTML = '';
    quizFeedback.innerHTML = '';
    nextQuizBtn.style.display = 'none';

    // Генерация вариантов
    const options = [question.translation];
    while (options.length < 4) {
        const random = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        if (!options.includes(random.translation)) options.push(random.translation);
    }

    shuffleArray(options).forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.onclick = () => checkAnswer(option, question);
        quizOptions.appendChild(btn);
    });
}

function checkAnswer(selected, correct) {
    const isCorrect = selected === correct.translation;

    if (isCorrect) {
        currentQuiz.correct++;
    } else {
        currentQuiz.mistakes.push({
            word: correct.word,
            translation: correct.translation,
            description: correct.description
        });
    }

    // Подсветка ответов
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.disabled = true;
        btn.classList.toggle('correct', btn.textContent === correct.translation);
        btn.classList.toggle('incorrect', !isCorrect && btn.textContent === selected);
    });

    showFeedback(isCorrect, correct);
    nextQuizBtn.style.display = 'block';
    currentQuiz.current++;
}

function showFeedback(isCorrect, question) {
    const feedback = document.createElement('div');
    feedback.className = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
    feedback.innerHTML = `
        <p>${isCorrect ? '✅ Правильно!' : '❌ Неправильно!'}</p>
        <p><strong>Правильный ответ:</strong> ${question.translation}</p>
        <p>${question.description}</p>
    `;
    quizFeedback.appendChild(feedback);
}

function showResults() {
    quizContent.style.display = 'none';
    quizProgress.style.display = 'none';
    quizResults.style.display = 'block';

    document.getElementById('correct-count').textContent = currentQuiz.correct;
    document.getElementById('total-questions-result').textContent = currentQuiz.total;

    const mistakesList = document.getElementById('mistakes-list');
    if (currentQuiz.mistakes.length > 0) {
        mistakesList.style.display = 'block';
        mistakesList.innerHTML = currentQuiz.mistakes.map(item => `
            <div class="mistake-item">
                <p class="mistake-word">${item.word}</p>
                <p class="mistake-translation"><strong>Правильный перевод:</strong> ${item.translation}</p>
                <p class="mistake-description">${item.description}</p>
            </div>
        `).join('');
    } else {
        mistakesList.style.display = 'none';
    }
}

// Вспомогательные функции
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

nextQuizBtn.addEventListener('click', showNextQuestion);