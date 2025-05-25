isListening = false;
$(document).on('click', "#buttonVoice", async (e) => {
    e.preventDefault();
    const v = $("#buttonVoice");
    try {

        if (!v.is('.recording')) {
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true
                }
            });
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioSource = audioContext.createMediaStreamSource(audioStream);
            audioRecorder = new MediaRecorder(audioStream);
            let voice = [];
            audioRecorder.start();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.minDecibels = -127;
            analyser.maxDecibels = 0;
            analyser.smoothingTimeConstant = 0.4;
            audioSource.connect(analyser);
            const volumes = new Uint8Array(analyser.frequencyBinCount);
            volumeCallback = () => {
                analyser.getByteFrequencyData(volumes);
                let volumeSum = 0;
                for (const volume of volumes)
                    volumeSum += volume;
                const averageVolume = volumeSum / volumes.length;
                v.css('--volume', (averageVolume * 100 / 127) + '%');
            };
            volumeInterval = setInterval(volumeCallback, 100);
            audioRecorder.onstop = async (e) => {
                if ($("#divTargetVoice").length) {
                    var ruDir = false;
                }
                else {
                    var ruDir = isTranslatingFromRussian();
                }
                var asrURL = 'https://' + (ruDir ? 'rus' : 'tat') + '-asr.api.translate.tatar/listening/';
                const blob = new Blob(voice, {type: "audio/wav"});
                audioContext.close();
                audioStream.getTracks().forEach(function(track) {
                    track.stop();
                });
                var data = new FormData();
                data.append('file', blob);
                let response = await fetch(asrURL, {
                    method: 'POST',
                    body: data
                })
                    .then((res) => {
                        return res.json();
                    })
                    .then((result) => {
                        if (typeof result.r !== 'undefined') {
                            if (typeof result.r[0] !== 'undefined' && typeof result.r[0].response !== 'undefined' && typeof result.r[0].response[0] !== 'undefined' && typeof result.r[0].response[0].text !== 'undefined') {
                                if ($("#divTargetVoice").length) {
                                    $("#divTargetVoice").html(result.r[0].response[0].text);
                                }
                                else {
                                    $('#textAreaSource').val(result.r[0].response[0].text);
                                    translateText();
                                }
                            }
                            else {
                                console.log('Recognition error');
                                console.log(result);
                            }
                        }
                        else if (typeof result.text !== 'undefined') {
                            var text = typeof result.text.text !== 'undefined' ? result.text.text : result.text;
                            if ($("#divTargetVoice").length) {
                                $("#divTargetVoice").html(text);
                            }
                            else {
                                $('#textAreaSource').val(text);
                                translateText();
                            }
                        }
                        else {
                            console.log('Recognition error');
                            console.log(result);
                        }
                    });
            };
            audioRecorder.ondataavailable = (e) => {
                voice.push(e.data);
            };
            v.addClass('recording');
        } else {
            audioRecorder.stop();
            v.removeClass('recording');
            v.css('--volume', '');
            if (volumeInterval !== null) {
                clearInterval(volumeInterval);
                volumeInterval = null;
            }
        }
    } catch (e) {
        console.log(e);
    }
    return false;
});
$("#buttonSynthesize").click(function (e) {
    e.preventDefault();
    synthesis();
    return false;
});
function synthesis() {
    if ($("#textAreaSourceVoice").length) {
        var ruDir = true;
        var text = $('#textAreaSourceVoice').val();
    }
    else {
        var ruDir = isTranslatingFromRussian();
        var content = $('#divTarget').clone();
        content.find('*').remove();
        var text = content.text();
    }
    if (ruDir) {
        var voice = "alsu";
        if ($('input[name="voice"]:checked').length && $('input[name="voice"]:checked').val() == '0') {
            voice = "almaz";
        }
    }
    else {
        var voice = "natasha";
    }
    let response = fetch('https://' + (ruDir ? 'tat' : 'rus') + '-tts.api.translate.tatar/listening/?' + new URLSearchParams({speaker: voice, text: text}),
        {
            method: 'GET'
        })
        .then((res) => {
            return res.json();
        })
        .then((result) => {
            if (typeof result.wav_base64 !== 'undefined') {
                generateAudioElement(result.wav_base64);
            }
            else {
                console.log('Synthesize error');
                console.log(result);
            }
        });
}
function generateAudioElement(base64) {
    var audio = document.createElement('audio');
    audio.src = 'data:audio/wav;base64,' + base64;
    if ($("#textAreaSourceVoice").length) {
        audio.id = 'audioElement';
        var bp = $("#buttonPlay");
        bp.removeClass('disabled');
        var bppar = bp.parents('.ts-action-button');
        bppar.find('#audioElement').remove();
        bppar.append(audio);
        if ($("input[name=autoplay]").is(":checked")) {
            bp.click();
        }
    }
    else {
        audio.play();
    }
}
function onTextAreaSourceVoiceKeyUp () {
    var text_length = $("#textAreaSourceVoice").val().length;
    var text_remaining = text_max - text_length;
    $("#divCharacterCounter").text(text_remaining + ' / 1000');
}
postponedSynthesis = _.debounce(synthesis, 1200);
function onTextAreaSourceVoiceInput() {
    postponedSynthesis();
    $("#buttonPlay").addClass('disabled');
}
$(document).on('keyup', "#textAreaSourceVoice", function (e) {
    onTextAreaSourceVoiceKeyUp();
    return false;
});
$(document).on('input propertychange', "#textAreaSourceVoice", function() {
    onTextAreaSourceVoiceInput();
    return false;
});
$(document).on('change', 'input[name="voice"]', function () {
    if ($("#textAreaSourceVoice").length) {
        $("#buttonPlay").addClass('disabled');
        synthesis();
    }
});
$(document).on('click', "#buttonPlay", function (e) {
    e.preventDefault();
    if (!$(this).is('.disabled')) {
        if ($(this).find('.fa').is('.fa-play')) {
            $("#audioElement")[0].play();
            $(this).find('.fa').removeClass('fa-play').addClass('fa-stop');
            $("#audioElement").on('ended', function (e) {
                $(this)[0].pause();
                $(this)[0].currentTime = 0;
                $("#buttonPlay").find('.fa').removeClass('fa-stop').addClass('fa-play');
            });
        }
        else if ($(this).find('.fa').is('.fa-stop')) {
            $("#audioElement")[0].pause();
            $("#audioElement")[0].currentTime = 0;
            $(this).find('.fa').removeClass('fa-stop').addClass('fa-play');
        }
    }
    return false;
});
$(".voice #buttonSwitchDir").click(function (e) {
    e.preventDefault();
    var container = $(this).parents('.ts-selector-container');
    var block1 = $(container.find('.ts-selector-block')[0]).clone();
    var block2 = $(container.find('.ts-selector-block')[1]).clone();
    var icon = block1.find('i')[0];
    block1.find('i').remove();
    block2.find('#divDirection').prepend(icon);
    container.find('.ts-selector-block').remove();
    container.prepend(block2);
    container.append(block1);

    var block1 = $('.voice .ts-content-container .ts-action-block:first-child').clone();
    var block2 = $('.voice .ts-content-container .ts-action-block:last-child').clone();
    block1.find('.ts-action-content > *').toggleClass('hidden');
    block2.find('.ts-action-content > *').toggleClass('hidden');
    $('.voice .ts-content-container .ts-action-block').remove();
    $('.voice .ts-content-container').prepend(block2);
    $('.voice .ts-content-container').append(block1);

    window.oppositeTranslationDir = true;
    return false;
});
$("#buttonCopy").click(function (e) {
    let text = $(this).parents(".ts-action-content").find(".ts-action-text").text().trim();
    try {
        navigator.clipboard.writeText(text);
        $(this).find('.fa').removeClass('fa-copy').addClass('fa-check');
        $this = $(this);
        setTimeout(function () {
            $this.find('.fa').removeClass('fa-check').addClass('fa-copy');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
});