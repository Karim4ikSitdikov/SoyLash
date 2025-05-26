document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('textInput');
    const synthesizeBtn = document.getElementById('synthesizeBtn');
    const recordBtn = document.getElementById('recordBtn');
    const checkBtn = document.getElementById('checkBtn');
    const audioContainer = document.getElementById('audioContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    const userAudioContainer = document.getElementById('userAudioContainer');
    const userAudioPlayer = document.getElementById('userAudioPlayer');
    const resultContainer = document.getElementById('resultContainer');
    const resultText = document.getElementById('resultText');
    const wordAccuracy = document.getElementById('wordAccuracy');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let userAudioBlob = null;

    // Инициализация записи
    async function initRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                userAudioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                userAudioPlayer.src = URL.createObjectURL(userAudioBlob);
                userAudioContainer.style.display = 'block';
                checkBtn.disabled = false;
            };
        } catch (error) {
            console.error('Ошибка доступа к микрофону:', error);
        }
    }

    // Обработчики событий
    recordBtn.addEventListener('click', toggleRecording);
    synthesizeBtn.addEventListener('click', synthesizeSpeech);
    checkBtn.addEventListener('click', checkPronunciation);

    initRecording();

    async function toggleRecording() {
        if (!isRecording) {
            audioChunks = [];
            mediaRecorder.start();
            isRecording = true;
            recordBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                    <path d="M6 4h12v16H6z"/>
                </svg>
                Остановить запись
            `;
            resultContainer.style.display = 'none';
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
    }

    async function synthesizeSpeech() {
        const text = textInput.value.trim();
        if (!text) return;

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
            console.error('Ошибка синтеза:', error);
        } finally {
            synthesizeBtn.disabled = false;
            synthesizeBtn.innerHTML = 'Озвучить образец';
        }
    }

    async function checkPronunciation() {
        if (!textInput.value.trim() || !userAudioBlob) return;

        checkBtn.disabled = true;
        checkBtn.textContent = 'Проверка...';

        try {
            const formData = new FormData();
            formData.append('text', textInput.value);
            formData.append('audio', userAudioBlob);

            const response = await fetch('http://localhost:5001/check_pronunciation', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            showResults(result);
        } catch (error) {
            console.error('Ошибка проверки:', error);
            resultText.textContent = 'Ошибка при проверке произношения';
            resultText.style.color = '#dc3545';
        } finally {
            checkBtn.disabled = false;
            checkBtn.textContent = 'Проверить произношение';
        }
    }

    function showResults(result) {
        resultContainer.style.display = 'block';
        wordAccuracy.innerHTML = '';

        if (result.result === "correct") {
            resultText.textContent = "✅ Правильное произношение!";
            resultText.style.color = "#4CAF50";
        } else {
            resultText.textContent = "❌ Требуется улучшение произношения";
            resultText.style.color = "#dc3545";

            result.words.forEach((word, i) => {
                const span = document.createElement('span');
                span.className = `accuracy-${result.accuracy[i]}`;
                span.textContent = word;
                wordAccuracy.appendChild(span);
            });
        }
    }
});