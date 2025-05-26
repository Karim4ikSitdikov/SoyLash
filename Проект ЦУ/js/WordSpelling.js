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
    const resultContainer = document.getElementById('resultContainer');
    const resultText = document.getElementById('resultText');
    const wordAccuracy = document.getElementById('wordAccuracy');
    const errorElement = document.getElementById('error');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let userAudioBlob = null;

    // Проверка поддержки записи
    if (!navigator.mediaDevices?.getUserMedia) {
        recordBtn.disabled = true;
        showError('Ваш браузер не поддерживает запись звука');
    }

    function showError(message) {
        errorElement.textContent = message;
    }

    // Инициализация записи
    recordBtn.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstop = () => {
                    userAudioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    userAudioPlayer.src = URL.createObjectURL(userAudioBlob);
                    userAudioContainer.style.display = 'block';
                    checkBtn.disabled = false;
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                recordBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                        <path d="M6 4h12v16H6z"/>
                    </svg>
                    Остановить запись
                `;
                resultContainer.style.display = 'none';
                feedbackAudioContainer.style.display = 'none';
            } catch (error) {
                showError('Ошибка доступа к микрофону: ' + error.message);
            }
        } else {
            mediaRecorder.stop();
            isRecording = false;
            recordBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v3m0 15v-3m-7-7h3m15 0h-3M5.6 5.6l2.1 2.1m9.8 9.8l2.1 2.1"/>
                </svg>
                Записать снова
            `;
        }
    });

    // Синтез речи
    synthesizeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) {
            showError('Введите текст для озвучивания');
            return;
        }

        synthesizeBtn.disabled = true;
        synthesizeBtn.innerHTML = 'Озвучивается...';

        try {
            const response = await fetch('http://localhost:5000/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const audioBlob = await response.blob();
            audioPlayer.src = URL.createObjectURL(audioBlob);
            audioContainer.style.display = 'block';
        } catch (error) {
            showError('Ошибка синтеза: ' + error.message);
        } finally {
            synthesizeBtn.disabled = false;
            synthesizeBtn.innerHTML = 'Озвучить образец';
        }
    });

    // Проверка произношения
    checkBtn.addEventListener('click', async () => {
        if (!textInput.value.trim() || !userAudioBlob) return;

        checkBtn.disabled = true;
        checkBtn.textContent = 'Проверка...';

        try {
            const formData = new FormData();
            formData.append('text', textInput.value);
            formData.append('audio', userAudioBlob, 'recording.wav');

            const response = await fetch('http://localhost:5001/check_pronunciation', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            displayResults(result);
        } catch (error) {
            showError('Ошибка проверки: ' + error.message);
        } finally {
            checkBtn.disabled = false;
            checkBtn.textContent = 'Проверить произношение';
        }
    });

    // Отображение результатов
    function displayResults(result) {
        resultContainer.style.display = 'block';
        wordAccuracy.innerHTML = '';

        if (result.result === "correct") {
            resultText.textContent = "✅ Правильное произношение!";
            resultText.style.color = "#4CAF50";
            feedbackAudioContainer.style.display = 'none';
        } else {
            resultText.textContent = "❌ Требуется улучшение произношения";
            resultText.style.color = "#dc3545";

            if (result.feedback_audio) {
                const audioBlob = base64ToBlob(result.feedback_audio);
                feedbackAudioPlayer.src = URL.createObjectURL(audioBlob);
                feedbackAudioContainer.style.display = 'block';
            }

            // Обработка цветовых меток
            result.words.forEach((word, i) => {
                const accuracy = result.accuracy[i] || 3;
                const wordContainer = document.createElement('div');
                wordContainer.className = 'word-box';

                if (accuracy === 0) {
                    wordContainer.style.backgroundColor = '#4CAF50';
                } else if (accuracy === 1) {
                    wordContainer.innerHTML = colorizeWord(word, 'start');
                } else if (accuracy === 2) {
                    wordContainer.innerHTML = colorizeWord(word, 'end');
                } else {
                    wordContainer.style.backgroundColor = '#F44336';
                }

                wordContainer.textContent = word;
                wordAccuracy.appendChild(wordContainer);
            });
        }
    }

    // Вспомогательные функции
    function base64ToBlob(base64) {
        const byteCharacters = atob(base64);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: 'audio/wav' });
    }

    function colorizeWord(word, part) {
        const half = Math.ceil(word.length / 2);
        return part === 'start'
            ? `<span style="background:#F44336;color:white">${word.slice(0, half)}</span><span style="background:#4CAF50;color:white">${word.slice(half)}</span>`
            : `<span style="background:#4CAF50;color:white">${word.slice(0, half)}</span><span style="background:#F44336;color:white">${word.slice(half)}</span>`;
    }
});