document.addEventListener('DOMContentLoaded', function() {
    // Инициализация прогресса
    updateProgressBars();

    // Обновляем прогресс при возврате на главную страницу
    window.addEventListener('pageshow', updateProgressBars);
});

function updateProgressBars() {
    // Прогресс изучения слов
    const learnedWords = getLearnedWords().length;
    const totalWords = getAllWordsCount();
    updateProgress('words', learnedWords, totalWords);

    // Прогресс квизов
    const completedQuizzes = getCompletedQuizzes();
    updateProgress('quizzes', completedQuizzes, 100); // 100 как максимальное значение для %
}

function updateProgress(type, current, total) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    document.getElementById(`${type}-progress-value`).textContent = `${current}/${total}`;
    document.getElementById(`${type}-progress-bar`).style.width = `${percentage}%`;
}

// Функции для работы с LocalStorage
function getLearnedWords() {
    const learned = localStorage.getItem('learnedWords');
    return learned ? JSON.parse(learned) : [];
}

function getAllWordsCount() {
    // В реальном приложении нужно загружать данные из wordsData
    return 1998; // Примерное общее количество слов
}

function getCompletedQuizzes() {
    const quizzes = localStorage.getItem('completedQuizzes');
    return quizzes ? parseInt(quizzes) : 0;
}