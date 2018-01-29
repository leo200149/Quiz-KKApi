$(document).ready(function () {
    $('#nextQuestion').bind('click', clickNextQuestion);
    var details = $('#details');
    var detailOpen = $('#detailOpen');
    var headIcon = $('#headIcon');
    var totalQuestions = [];
    var questions = [];
    var score = 0;
    var canNext = true;
    const TOKEN = 'Bearer KB7o8UDDDbsfRbAG6dl4BA==';
    const XAPIKEY = 'ilGN6uwDsg4UY39qVNIDw0aq6fJeqBC2QvHuvLRf';
    var currentQuestion = null;
    var answers = null;
    var currentAudioSrc = '';
    const resultDescs = ['快去KKBOX多聽一點歌','愛聽歌一族','歌本王者','歌本之神，沒有什麼難得倒你！'];

    function getRandomIndex(max) {
        return Math.floor(Math.random() * (max));
    }

    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = getRandomIndex(array.length);
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    function init() {
        var playlistId = '0kTVCy_kzou3AdOsAc';
        $.ajax({
            url: 'https://api.kkbox.com/v1.1/charts/' + playlistId + '?territory=TW',
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("accept", 'application/json');
                xhr.setRequestHeader("authorization", TOKEN);
            },
            success: function (resp) {
                totalQuestions = resp.tracks.data;
                clickRestart();
            },
            fail: function(resp){
                console.log(resp);
            }
        });
    }

    function initQuestions() {
        questions = totalQuestions.slice();
        shuffleArray(questions);
    }

    function nextQuestion() {
        currentQuestion = questions.pop();
        var answerQuestions = [];
        answerQuestions.push(currentQuestion);
        for (var i = 0; i < 3; i++) {
            var question = totalQuestions[getRandomIndex(totalQuestions.length)];
            while (answerQuestions.includes(question)) {
                question = totalQuestions[getRandomIndex(totalQuestions.length)];
            }
            answerQuestions.push(question);
        }
        answers = [];
        for (var i = 0; i < answerQuestions.length; i++) {
            var answerQuestion = answerQuestions[i];
            answers.push({ id: answerQuestion.id, singer: answerQuestion.album.artist.name, song: answerQuestion.name });
        }
        shuffleArray(answers);
    }

    function initSongDetail(){
        var playerId = currentQuestion.id;
        updateDetailUI();
        headIcon.button('loading');
        $.ajax({
            url: 'https://2rx2xb9xak.execute-api.us-east-1.amazonaws.com/prod/quiz-kkbox',
            type: 'GET',
            data:{ id:playerId},
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-Api-Key',XAPIKEY);
            },
            success: function (resp) {
                currentAudioSrc = resp.content;
                updateDetailUI();
                updateResultUI();
                headIcon.button('reset');
            },
            fail: function(resp){
                console.log(resp);
            }
        });
    }

    function clickRestart() {
        score = 0;
        canNext = true;
        currentQuestion = null;
        answers = null;
        currentAudioSrc = '';
        questions = totalQuestions.slice();
        shuffleArray(questions);
        clickNextQuestion();
    }

    function clickNextQuestion() {
        detailControl(false);
        nextQuestion();
        initSongDetail();
        updateAnswerBtnUI();
        updateScoreUI();
    }

    function clickAnwserBtn() {
        $('.answerbtn').unbind('click');
        var index = $(this).attr('answer');
        if (answers[index].id == currentQuestion.id) {
            canNext = true;
            score++;
            $(this).addClass('correct');
        } else {
            canNext = false;
            $(this).addClass('wrong');
            $('.answerbtn').each(function () {
                var index = $(this).attr('answer');
                if (answers[index].id == currentQuestion.id) {
                    $(this).addClass('correct');
                }
            });
        }
        updateResultUI();
        updateScoreUI();
        detailControl(true);
    }

    function detailControl(isShow) {
        var detailIsOpen = details.hasClass('in');
        if (!isShow ? detailIsOpen : !detailIsOpen) {
            detailOpen.click();
        }
    }

    function updateResultUI(){
        var resultUI = $('#resultUI');
        resultUI.empty();
        if(canNext){
            var result = $('#template-passui').text();
            resultUI.append(result);
            $('#resultBtn').bind('click',clickNextQuestion);
        }else{
            var result = $('#template-failui').text();
            result = result.split('{score}').join(score);
            result = result.split('{desc}').join(resultDescs[score>=40?3:Math.floor(score/10)]);
            resultUI.append(result);
            $('#resultBtn').bind('click',clickRestart);
        }
    }

    function updateScoreUI() {
        $('#scoreUI').text(score);
    }

    function updateDetailUI() {
        details.empty();
        var detailUI = $('#template-detailUI').text();
        detailUI = detailUI.split('{src}').join(currentAudioSrc);
        detailUI = detailUI.split('{artist}').join(currentQuestion.album.artist.name);
        detailUI = detailUI.split('{title}').join(currentQuestion.name);
        detailUI = detailUI.split('{album}').join(currentQuestion.album.name);
        detailUI = detailUI.split('{year}').join(currentQuestion.album.release_date);
        details.append(detailUI);
        $('#nextQuestionBtn').bind('click', clickNextQuestion);
        $('.mp3player')[0].play();
    }

    function updateAnswerBtnUI() {
        $('#answerbtns').empty();
        for (var i in answers) {
            var answer = answers[i];
            var btn = $('#template-answerbtn').text();
            btn = btn.split('{index}').join(i);
            btn = btn.split('{singer}').join(answer.singer.replace(new RegExp(/\(.+\)/, 'g'), ''));
            btn = btn.split('{song}').join(answer.song.replace(new RegExp(/\(.+\)/, 'g'), ''));
            $('#answerbtns').append(btn);
        }
        $('.answerbtn').bind('click', clickAnwserBtn);
    }

    init();

});


