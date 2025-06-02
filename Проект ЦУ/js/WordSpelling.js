document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('textInput');
    const synthesizeBtn = document.getElementById('synthesizeBtn');
    const recordBtn = document.getElementById('recordBtn');
    const checkBtn = document.getElementById('checkBtn');
    const audioContainer = document.getElementById('audioContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    const userAudioContainer = document.getElementById('userAudioContainer');
    const userAudioPlayer = document.getElementById('userAudioPlayer');
    const feedbackAudioContainer = document.getElementById('feedbackAudioContainer');
    const feedbackAudioPlayer = document.getElementById('feedbackAudioPlayer');
    const errorElement = document.getElementById('error');
    const successElement = document.getElementById('success');
    const resultContainer = document.getElementById('resultContainer');
    const resultText = document.getElementById('resultText');
    const wordAccuracy = document.getElementById('wordAccuracy');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let userAudioBlob = null;

    // Проверка поддержки записи звука
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        recordBtn.disabled = true;
        showError('Ваш браузер не поддерживает запись звука');
    }

    // Обработчик кнопки записи
    recordBtn.addEventListener('click', async function () {
        if (!isRecording) {
            // Начало записи
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = function (e) {
                    if (e.data.size > 0) {
                        audioChunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = function () {
                    userAudioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(userAudioBlob);
                    userAudioPlayer.src = audioUrl;
                    userAudioContainer.style.display = 'block';
                    checkBtn.disabled = false;

                    // Остановка всех треков в потоке
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                recordBtn.textContent = 'Остановить запись';
                recordBtn.className = 'stop-record-btn';
                userAudioContainer.style.display = 'none';
                feedbackAudioContainer.style.display = 'none';
                resultContainer.style.display = 'none';
                checkBtn.disabled = true;
                successElement.textContent = '';
            } catch (error) {
                showError('Ошибка доступа к микрофону: ' + error.message);
            }
        } else {
            // Остановка записи
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                isRecording = false;
                recordBtn.textContent = 'Перезаписать';
                recordBtn.className = 'rerecord-btn';
            }
        }
    });

    // Обработчик кнопки синтеза речи
    synthesizeBtn.addEventListener('click', async function () {
        const text = textInput.value.trim();

        if (!text) {
            showError('Пожалуйста, введите текст для озвучивания');
            return;
        }

        errorElement.textContent = '';
        synthesizeBtn.disabled = true;
        synthesizeBtn.textContent = 'Обработка...';

        try {
            const response = await fetch('http://95.183.13.188:5002/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }) //чтобы получить озвучку текста
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка сервера');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            audioPlayer.src = audioUrl;
            audioContainer.style.display = 'block';
            audioPlayer.play(); //озвучивание
        } catch (error) {
            showError(error.message);
        } finally {
            synthesizeBtn.disabled = false;
            synthesizeBtn.textContent = 'Озвучить образец';
        }
    });

    // Обработчик кнопки проверки произношения
    checkBtn.addEventListener('click', async function () {
        const text = textInput.value.trim();

        if (!text) {
            showError('Пожалуйста, введите текст для проверки');
            return;
        }

        if (!userAudioBlob) {
            showError('Пожалуйста, сделайте запись своего произношения');
            return;
        }

        errorElement.textContent = '';
        checkBtn.disabled = true;
        checkBtn.textContent = 'Проверка...';

        try {
            const formData = new FormData();
            formData.append('text', text);
            formData.append('audio', userAudioBlob, 'recording.wav');

            const response = await fetch('http://95.183.13.188:5003/check_pronunciation', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка сервера');
            }

            const result = await response.json();

            // Отображаем результаты
            displayResults(result);

        } catch (error) {
            showError(error.message);
        } finally {
            checkBtn.disabled = false;
            checkBtn.textContent = 'Проверить произношение';
        }
    });

    function displayResults(result) {
        console.log("Полученные данные с сервера:", result);

        resultContainer.style.display = 'block';

        if (result.result === "correct") {
            resultText.textContent = "✅ Ваше произношение правильное!"; //вывод текста правильно или нет
            resultText.style.color = "green";
            feedbackAudioContainer.style.display = 'none';
        } else {
            resultText.textContent = "❌ Ваше произношение содержит ошибки. Прослушайте исправленный вариант:";
            resultText.style.color = "red";

            if (result.feedback_audio) { // если неправильно, то выводится замедленное в местах ошибок аудио
                const audioBlob = base64ToBlob(result.feedback_audio, 'audio/wav');
                const audioUrl = URL.createObjectURL(audioBlob);
                feedbackAudioPlayer.src = audioUrl;
                feedbackAudioContainer.style.display = 'block';
            }
        }
        // вывод введеных слов через пробел, каждое из которых подсвечено определенным цветом
        wordAccuracy.innerHTML = '';

        if (result.words && result.accuracy) {
            const words = typeof result.words === 'string' ? result.words.split(' ') : result.words;
            const accuracy = Array.isArray(result.accuracy) ? result.accuracy : [];

            const minLength = Math.min(words.length, accuracy.length);

            for (let i = 0; i < minLength; i++) {
                const word = words[i];
                const accuracyValue = parseInt(result.accuracy[i]);

                const wordContainer = document.createElement('div');
                wordContainer.style.display = 'inline-block';
                wordContainer.style.margin = '0 5px';
                wordContainer.style.padding = '2px 0';

                // Правильная обработка всех случаев точности
                if (accuracyValue === 0) {
                    // ВСЁ СЛОВО ЗЕЛЕНОЕ (правильное)
                    wordContainer.innerHTML = `
                    <span style="
                        background-color: #4CAF50;
                        color: white;
                        padding: 2px 5px;
                        border-radius: 3px;
                        display: inline-block;
                    ">${word}</span>
                `;
                }
                else if (accuracyValue === 1) {
                    // Первая половина КРАСНАЯ, вторая ЗЕЛЕНАЯ
                    const half = Math.ceil(word.length / 2);
                    wordContainer.innerHTML = `
                    <span style="
                        background-color: #F44336;
                        color: white;
                        padding: 2px 0 2px 5px;
                        border-radius: 3px 0 0 3px;
                        display: inline-block;
                    ">${word.substring(0, half)}</span>
                    <span style="
                        background-color: #4CAF50;
                        color: white;
                        padding: 2px 5px 2px 0;
                        border-radius: 0 3px 3px 0;
                        display: inline-block;
                    ">${word.substring(half)}</span>
                `;
                }
                else if (accuracyValue === 2) {
                    // Первая половина ЗЕЛЕНАЯ, вторая КРАСНАЯ
                    const half = Math.ceil(word.length / 2);
                    wordContainer.innerHTML = `
                    <span style="
                        background-color: #4CAF50;
                        color: white;
                        padding: 2px 0 2px 5px;
                        border-radius: 3px 0 0 3px;
                        display: inline-block;
                    ">${word.substring(0, half)}</span>
                    <span style="
                        background-color: #F44336;
                        color: white;
                        padding: 2px 5px 2px 0;
                        border-radius: 0 3px 3px 0;
                        display: inline-block;
                    ">${word.substring(half)}</span>
                `;
                }
                else {
                    // ВСЁ СЛОВО КРАСНОЕ (accuracyValue === 3 или некорректное значение)
                    wordContainer.innerHTML = `
                    <span style="
                        background-color: #F44336;
                        color: white;
                        padding: 2px 5px;
                        border-radius: 3px;
                        display: inline-block;
                    ">${word}</span>
                `;
                }

                wordAccuracy.appendChild(wordContainer);
            }
        }
    }


    function base64ToBlob(base64Data, contentType = '', sliceSize = 512) {
        try {
            const byteCharacters = atob(base64Data);
            const byteArrays = [];

            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                const slice = byteCharacters.slice(offset, offset + sliceSize);
                const byteNumbers = new Array(slice.length);

                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            return new Blob(byteArrays, { type: contentType });
        } catch (e) {
            console.error("Error converting base64 to Blob:", e);
            return null;
        }
    }

    function showError(message) {
        errorElement.textContent = message;
        successElement.textContent = '';
    }

    function showSuccess(message) {
        successElement.textContent = message;
        errorElement.textContent = '';
    }
});