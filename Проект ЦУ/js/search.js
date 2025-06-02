// DOM элементы
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');

// Данные слов
let wordsData = [];

// Загрузка данных
async function loadWordsData() {
    try {
        const response = await fetch('../tatar_words.json');
        const jsonData = await response.json();

        wordsData = jsonData.map(item => ({
            word: item.word,
            partOfSpeech: item.type,
            translation: item.translation,
            theme: getThemeByPartOfSpeech(item.type),
            speachWord: item.word,
            imageQuery: item.translation.split(',')[0].trim()
        }));
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
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

// Поиск слов
function searchWords(query) {
    if (!query.trim()) return [];

    query = query.toLowerCase();
    return wordsData.filter(word =>
        word.word.toLowerCase().includes(query) ||
        word.translation.toLowerCase().includes(query)
    );
}

// Отображение результатов поиска
function displaySearchResults(results) {
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">Ничего не найдено</div>';
        return;
    }

    results.forEach(word => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.dataset.word = JSON.stringify(word);

        resultItem.innerHTML = `
            <div class="result-header">
                <div class="result-word">${word.word}</div>
                <span class="result-theme">${word.theme}</span>
            </div>
            <div class="result-translation">${word.translation}</div>
        `;

        resultItem.addEventListener('click', () => showWordDetails(word));
        searchResults.appendChild(resultItem);
    });
}

// Показать детали слова (аналогично wordLearning)
function showWordDetails(word) {
    // Сохраняем выбранное слово в sessionStorage
    sessionStorage.setItem('selectedWord', JSON.stringify(word));

    // Переходим на страницу деталей слова
    window.location.href = 'word-details.html';
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    await loadWordsData();
    const query = 'А';
    if (query) {
        const results = searchWords(query);
        displaySearchResults(results);
    }
    // Обработчики событий
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            const results = searchWords(query);
            displaySearchResults(results);
        }
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                const results = searchWords(query);
                displaySearchResults(results);
            }
        }
    });

    searchInput.addEventListener('input',()=>{
        const query = searchInput.value.trim();
        if (query) {
            const results = searchWords(query);
            displaySearchResults(results);
        }
    });
});
