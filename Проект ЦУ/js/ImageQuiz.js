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
const quizImage = document.getElementById('quiz-image');
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
        const response = await fetch('../soylash_data.txt');
        const textData = await response.text();

        // Парсинг текстовых данных
        const lines = textData.split('\n');
        allQuestions = lines.map(line => {
            const [word, partOfSpeech, frequency, translation, example] = line.split(';');
            return {
                word: word.trim(),
                partOfSpeech: partOfSpeech.trim(),
                translation: translation.trim(),
                example: example ? example.trim() : '',
                theme: getThemeByPartOfSpeech(partOfSpeech.trim()),
                imageQuery: translation.trim() // Для поиска изображений используем перевод
            };
        }).filter(word => word.word); // Фильтрация пустых строк
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Ошибка загрузки данных. Пожалуйста, перезагрузите страницу.');
    }
}

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

async function showNextQuestion() {
    if (currentQuiz.current > currentQuiz.total) {
        showResults();
        return;
    }

    document.getElementById('current-question').textContent = currentQuiz.current;

    // Выбираем случайное слово
    const question = allQuestions[Math.floor(Math.random() * allQuestions.length)];

    // Очистка предыдущего состояния
    quizImage.src = '';
    quizImage.alt = `Изображение для слова: ${question.translation}`;
    quizOptions.innerHTML = '';
    quizFeedback.innerHTML = '';
    nextQuizBtn.style.display = 'none';

    try {
        // Загружаем изображение из Unsplash по переводу слова
        const searchQuery = `${question.translation}`;
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape&client_id=c0DDTVCG7lctOJTWJIvZ_F6J4ey07hO1MzmKfIgZNrc`);

        if (response.ok) {
            const data = await response.json();
            if (data && data.urls && data.urls.regular) {
                quizImage.src = data.urls.regular;
            } else {
                setFallbackImage();
            }
        } else {
            setFallbackImage();
        }
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        setFallbackImage();
    }

    // Генерация вариантов ответа
    const options = [question.word];
    while (options.length < 4) {
        const random = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        if (!options.includes(random.word)) options.push(random.word);
    }

    shuffleArray(options).forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.onclick = () => checkAnswer(option, question);
        quizOptions.appendChild(btn);
    });
}

function setFallbackImage() {
    quizImage.src = 'https://images.unsplash.com/photo-1582139329536-e7284fece509?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80';
    quizImage.alt = 'Татарская культура - изображение по умолчанию';
}

function checkAnswer(selected, correct) {
    const isCorrect = selected === correct.word;

    if (isCorrect) {
        currentQuiz.correct++;
    } else {
        currentQuiz.mistakes.push({
            imageQuery: correct.translation,
            word: correct.word,
            translation: correct.translation,
            description: correct.example
        });
    }

    // Подсветка ответов
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.disabled = true;
        btn.classList.toggle('correct', btn.textContent === correct.word);
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
        <p><strong>Правильный ответ:</strong> ${question.word}</p>
        <p><strong>Перевод:</strong> ${question.translation}</p>
        ${question.example ? `<p>Пример: ${question.example}</p>` : ''}
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
                <img src="https://source.unsplash.com/random/200x150/?${encodeURIComponent(item.imageQuery)}" alt="${item.translation}" class="mistake-image">
                <p class="mistake-word"><strong>Слово:</strong> ${item.word}</p>
                <p class="mistake-translation"><strong>Перевод:</strong> ${item.translation}</p>
                ${item.description ? `<p class="mistake-description"><strong>Пример:</strong> ${item.description}</p>` : ''}
            </div>
        `).join('');
    } else {
        mistakesList.style.display = 'none';
    }

    const completedQuizzes = parseInt(localStorage.getItem('completedQuizzes') || 0);
    localStorage.setItem('completedQuizzes', completedQuizzes + 1);
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