document.addEventListener('DOMContentLoaded', function() {
    const sourceLanguage = document.getElementById('source-language');
    const targetLanguage = document.getElementById('target-language');
    const sourceText = document.getElementById('source-text');
    const translatedText = document.getElementById('translated-text');
    const translateBtn = document.getElementById('translate-btn');
    const swapBtn = document.getElementById('swap-languages');
    const errorMessage = document.getElementById('error-message');

    // URL API для перевода
    const API_URLS = {
        'ru-tt': 'https://translate.tatar/translate?lang=0&text=',
        'tt-ru': 'https://translate.tatar/translate?lang=1&text='
    };

    // Обработчик кнопки перевода
    translateBtn.addEventListener('click', translateText);

    // Обработчик смены языка
    swapBtn.addEventListener('click', function() {
        const temp = sourceLanguage.value;
        sourceLanguage.value = targetLanguage.value;
        targetLanguage.value = temp;

        if (sourceText.value.trim() && translatedText.textContent !== 'Перевод появится здесь...') {
            const tempText = sourceText.value;
            sourceText.value = translatedText.textContent;
            translatedText.textContent = tempText;
        }
    });

    // Автоперевод при изменении текста (с задержкой)
    let debounceTimer;
    sourceText.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        if (sourceText.value.trim()) {
            debounceTimer = setTimeout(translateText, 1000);
        } else {
            translatedText.textContent = 'Перевод появится здесь...';
            errorMessage.textContent = '';
        }
    });

    // Функция перевода текста
    async function translateText() {
        const text = sourceText.value.trim();
        if (!text) {
            translatedText.textContent = 'Перевод появится здесь...';
            return;
        }

        const fromLang = sourceLanguage.value;
        const toLang = targetLanguage.value;
        const direction = `${fromLang}-${toLang}`;

        // Проверяем поддерживаемые направления перевода
        if (!API_URLS[direction]) {
            errorMessage.textContent = 'Выбранное направление перевода не поддерживается';
            return;
        }

        try {
            const encodedText = encodeURIComponent(text);
            const apiUrl = API_URLS[direction] + encodedText;
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Ошибка сети');

            const data = await response.text();
            
            // Парсим ответ, аналогично Python-версии
            if (data.includes('translation')) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data, "text/xml");
                const translation = xmlDoc.getElementsByTagName("translation")[0];
                if (translation) {
                    translatedText.textContent = translation.textContent;
                    errorMessage.textContent = '';
                } else {
                    throw new Error('Не удалось распознать ответ сервера');
                }
            } else {
                translatedText.textContent = data;
                errorMessage.textContent = '';
            }
        } catch (error) {
            console.error('Ошибка перевода:', error);
            errorMessage.textContent = 'Произошла ошибка при переводе. Попробуйте снова.';
            translatedText.textContent = 'Ошибка перевода';
        }
    }

    // Инициализация сервиса
    function initTranslator() {
        const languages = {
            'ru': 'Русский',
            'tt': 'Татарский',
        };

        // Очищаем и заполняем select-элементы
        sourceLanguage.innerHTML = '';
        targetLanguage.innerHTML = '';

        Object.entries(languages).forEach(([code, name]) => {
            const option1 = document.createElement('option');
            option1.value = code;
            option1.textContent = name;
            sourceLanguage.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = code;
            option2.textContent = name;
            targetLanguage.appendChild(option2);
        });

        // Устанавливаем русский как исходный, татарский как целевой по умолчанию
        sourceLanguage.value = 'ru';
        targetLanguage.value = 'tt';
    }

    initTranslator();
});
