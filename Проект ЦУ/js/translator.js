document.addEventListener('DOMContentLoaded', function() {
    const sourceLanguage = document.getElementById('source-language');
    const targetLanguage = document.getElementById('target-language');
    const sourceText = document.getElementById('source-text');
    const translatedText = document.getElementById('translated-text');
    const translateBtn = document.getElementById('translate-btn');
    const swapBtn = document.getElementById('swap-languages');
    const errorMessage = document.getElementById('error-message');

    // Ключ API Google Cloud (замените на свой)
    const API_KEY = 'YOUR_GOOGLE_CLOUD_API_KEY';
    const API_URL = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

    // Функция для выполнения перевода через Google Translate API
    async function translateText() {
        const text = sourceText.value.trim();
        if (!text) {
            errorMessage.textContent = 'Пожалуйста, введите текст для перевода';
            translatedText.textContent = 'Перевод появится здесь...';
            return;
        }

        errorMessage.textContent = '';
        translatedText.textContent = 'Переводим...';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: sourceLanguage.value,
                    target: targetLanguage.value,
                    format: 'text'
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.data && data.data.translations && data.data.translations.length > 0) {
                translatedText.textContent = data.data.translations[0].translatedText;
            } else {
                throw new Error('Не удалось получить перевод');
            }
        } catch (error) {
            console.error('Ошибка перевода:', error);
            errorMessage.textContent = `Ошибка: ${error.message || 'Произошла ошибка при переводе'}`;
            translatedText.textContent = 'Ошибка перевода';

            // Если это ошибка квоты API, покажем более информативное сообщение
            if (error.message.includes('quota')) {
                errorMessage.textContent = 'Превышена квота переводов. Пожалуйста, попробуйте позже или проверьте настройки API.';
            }
        }
    }

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

    // Инициализация сервиса
    function initTranslator() {
        // Можно добавить дополнительные языки при необходимости
        const languages = {
            'ru': 'Русский',
            'tt': 'Татарский',
            'en': 'Английский'
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