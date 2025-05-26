let words = [];
let currentQuestion = 0;
let correctAnswers = 0;
let selectedWords = [];
let userAnswers = [];

async function loadWords() {
    const response = await fetch('../tatar_words.json');
    words = await response.json();
}

async function startQuiz(numQuestions) {
    document.getElementById('start-screen').style.display = 'none';
    document.querySelector('.quiz-options').style.display = 'block';

    // Выбор случайных уникальных слов
    selectedWords = [...words].sort(() => 0.5 - Math.random()).slice(0, numQuestions);

    showQuestion();
}

function showQuestion() {
    const currentWord = selectedWords[currentQuestion];
    const options = generateOptions(currentWord);

    // Обновление прогресс-бара
    document.getElementById('progress-bar').style.width =
        `${(currentQuestion / selectedWords.length) * 100}%`;

    // Отображение кнопки озвучивания
    const speakBtn = document.getElementById('speak-btn');
    speakBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        </svg>
        Озвучить слово
    `;

    // Генерация вариантов ответов
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = options.map(opt => `
        <button class="option-btn" 
                data-correct="${opt.isCorrect}" 
                onclick="handleAnswer(this)">
            ${opt.translation}
        </button>
    `).join('');
}

function generateOptions(currentWord) {
    // Выбор 3 случайных неправильных вариантов
    const wrongOptions = words
        .filter(word => word.word !== currentWord.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(word => ({
            translation: word.translation.split('\/\/')[0].trim(),
            isCorrect: false
        }));

    // Создание массива вариантов
    const options = [
        {
            translation: currentWord.translation.split('\/\/')[0].trim(),
            isCorrect: true
        },
        ...wrongOptions
    ];

    // Перемешивание вариантов
    return options.sort(() => 0.5 - Math.random());
}

async function handleAnswer(btn) {
    const isCorrect = btn.dataset.correct === 'true';
    userAnswers.push({
        word: selectedWords[currentQuestion],
        isCorrect,
        selected: btn.textContent
    });

    if (isCorrect) correctAnswers++;

    // Переход к следующему вопросу или завершение
    if (currentQuestion < selectedWords.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.querySelector('.quiz-options').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    document.getElementById('correct-count').textContent = correctAnswers;
    document.getElementById('incorrect-count').textContent =
        selectedWords.length - correctAnswers;

    // Показ неправильных ответов
    const incorrectContainer = document.getElementById('incorrect-answers');
    incorrectContainer.innerHTML = userAnswers
        .filter(answer => !answer.isCorrect)
        .map(answer => `
            <div class="incorrect-item">
                <p>Слово: ${answer.word.word}</p>
                <p>Ваш ответ: ${answer.selected}</p>
                <p>Правильный: ${answer.word.translation.split('\/\/')[0].trim()}</p>
                <button onclick="replayWord('${answer.word.word}')">Переслушать</button>
            </div>
        `).join('');
}

// Инициализация при загрузке
window.onload = loadWords;

// Ваша функция озвучивания с небольшими изменениями
async function speakCurrentWord() {
    const currentWord = selectedWords[currentQuestion]?.word;
    if (!currentWord) return;

    const speakBtn = document.getElementById('speak-btn');
    speakBtn.disabled = true;
    speakBtn.innerHTML = 'Озвучивание...';

    try {
        const response = await fetch('http://localhost:5002/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: currentWord })
        });

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audioPlayer = document.getElementById('sample-audio');
        audioPlayer.src = audioUrl;
        audioPlayer.style.display = 'block';
        audioPlayer.play();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка воспроизведения');
    } finally {
        speakBtn.disabled = false;
        speakBtn.innerHTML = `Озвучить слово`;
    }
}

function replayWord(word) {
    // Воспроизведение конкретного слова
    fetch('http://localhost:5002/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word })
    })
        .then(response => response.blob())
        .then(blob => {
            const audio = new Audio(URL.createObjectURL(blob));
            audio.play();
        });
}