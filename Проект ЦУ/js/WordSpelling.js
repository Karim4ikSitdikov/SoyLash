document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('textInput');
    const synthesizeBtn = document.getElementById('synthesizeBtn');
    const recordBtn = document.getElementById('recordBtn');
    const checkBtn = document.getElementById('checkBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const userAudioPlayer = document.getElementById('userAudioPlayer');
    const feedbackAudioPlayer = document.getElementById('feedbackAudioPlayer');
    const resultContainer = document.getElementById('resultContainer');
    const wordAccuracy = document.getElementById('wordAccuracy');
    const resultText = document.getElementById('resultText');
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

    // Запись аудио
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
                    document.getElementById('userAudioContainer').style.display = 'block';
                    checkBtn.disabled = false;
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                recordBtn.innerHTML = `Остановить запись`;
            } catch (error) {
                showError('Ошибка доступа к микрофону: ' + error.message);
            }
        } else {
            mediaRecorder.stop();
            isRecording = false;
            recordBtn.innerHTML = `Записать снова`;
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
        synthesizeBtn.textContent = 'Озвучивается...';

        try {
            const response = await fetch('http://localhost:5000/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const audioBlob = await response.blob();
            audioPlayer.src = URL.createObjectURL(audioBlob);
            document.getElementById('audioContainer').style.display = 'block';
        } catch (error) {
            showError('Ошибка синтеза: ' + error.message);
        } finally {
            synthesizeBtn.disabled = false;
            synthesizeBtn.textContent = 'Озвучить образец';
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
            resultText.textContent = "✅ Ваше произношение правильное!";
            resultText.style.color = "#4CAF50";
            document.getElementById('feedbackAudioContainer').style.display = 'none';
        } else {
            resultText.textContent = "❌ Ваше произношение содержит ошибки";
            resultText.style.color = "#dc3545";

            if (result.feedback_audio) {
                const audioBlob = base64ToBlob(result.feedback_audio);
                feedbackAudioPlayer.src = URL.createObjectURL(audioBlob);
                document.getElementById('feedbackAudioContainer').style.display = 'block';
            }

            result.words.forEach((word, i) => {
                const accuracy = result.accuracy[i] ?? 3;
                const wordContainer = document.createElement('div');
                wordContainer.style.display = 'inline-flex';
                wordContainer.style.margin = '2px';

                if (accuracy === 0) {
                    wordContainer.innerHTML = `
                        <span style="
                            background: #4CAF50;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                        ">${word}</span>
                    `;
                } else if (accuracy === 1 || accuracy === 2) {
                    const half = Math.ceil(word.length / 2);
                    wordContainer.innerHTML = `
                        <span style="
                            background: ${accuracy === 1 ? '#F44336' : '#4CAF50'};
                            color: white;
                            padding: 4px 0 4px 8px;
                            border-radius: 4px 0 0 4px;
                        ">${word.substring(0, half)}</span>
                        <span style="
                            background: ${accuracy === 1 ? '#4CAF50' : '#F44336'};
                            color: white;
                            padding: 4px 8px 4px 0;
                            border-radius: 0 4px 4px 0;
                        ">${word.substring(half)}</span>
                    `;
                } else {
                    wordContainer.innerHTML = `
                        <span style="
                            background: #F44336;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                        ">${word}</span>
                    `;
                }

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
});