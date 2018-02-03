$(document).ready(function () {
    const TOKEN = 'Bearer KB7o8UDDDbsfRbAG6dl4BA==';
    const XAPIKEY = 'ilGN6uwDsg4UY39qVNIDw0aq6fJeqBC2QvHuvLRf';
    const resultDescs = ['快去KKBOX多聽一點歌','愛聽歌一族','歌本王者','歌本之神，沒有什麼難得倒你！'];
    var details = $('#details');
    var detailOpen = $('#detailOpen');
    var headIcon = $('#headIcon');
    var totalQuestions = [];
    var questions = [];
    var score = 0;
    var canNext = true;
    var currentQuestion = null;
    var answers = null;
    $('#startBtn').bind('click',clickNextQuestion);

    function log(msg){
        console.log(msg);
    }

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

    function wait(ms) {
        var deferred = $.Deferred();
        setTimeout(deferred.resolve, ms);
       // We just need to return the promise not the whole deferred.
       return deferred.promise();
    }
  
    function error(resp){
        console.log(resp);
    }

    function init() {
        var dfd = $.Deferred();
        dfd.then(function(resp) {
            return loadQuestionData();
        },error).then(function(resp) {
            totalQuestions = resp;
            return shuffleQuestions();
        },error).then(function(resp){
            questions = resp;
            $('#startAlertBtn').click();
        },error);
        dfd.resolve();
    }

    function loadQuestionData(){
        var dfd = $.Deferred();
        log('loadQuestionData...');
        var playlistId = '0kTVCy_kzou3AdOsAc';
        $.ajax({
            url: 'https://api.kkbox.com/v1.1/charts/' + playlistId + '?territory=TW',
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("accept", 'application/json');
                xhr.setRequestHeader("authorization", TOKEN);
            },
            success: function (resp) {
                dfd.resolve(resp.tracks.data);
            },
            fail: function(resp){
                log(resp);
                dfd.reject();
            }
        });
        return dfd.promise();
    }

    function shuffleQuestions() {
        var dfd = $.Deferred();
        log('shuffleQuestions...');
        var questions = totalQuestions.slice();
        shuffleArray(questions);
        dfd.resolve(questions);
        return dfd.promise();
    }

    function initQuestion(){
        log('initQuestion...');
        var dfd = $.Deferred();
        prepareQuestion()
        .then(function(resp) {
            answers = resp.answers;
            currentQuestion = resp.currentQuestion;
            return getQuestionAudioSrc(currentQuestion);
        },error).then(function(currentAudioSrc){
            currentQuestion.audioSrc = currentAudioSrc;
            log('initQuestion end');
            dfd.resolve();
        },error);
        return dfd.promise();
    }

    function prepareQuestion() {
        var dfd = $.Deferred();
        log('prepareQuestion...');
        var currentQuestion = questions.pop();
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
        dfd.resolve({
            currentQuestion:currentQuestion,
            answers:answers
        });
        return dfd.promise();
    }

    function getQuestionAudioSrc(question){
        var dfd = $.Deferred();
        log('getQuestionAudioSrc...');
        var playerId = question.id;
        $.ajax({
            url: 'https://2rx2xb9xak.execute-api.us-east-1.amazonaws.com/prod/quiz-kkbox',
            type: 'GET',
            data:{ id:playerId},
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-Api-Key',XAPIKEY);
            },
            success: function (resp) {
                dfd.resolve(resp.content);
            },
            fail: function(resp){
                log(resp);
                dfd.reject(resp);
            }
        });
        return dfd.promise();
    }

    function clickRestart() {
        score = 0;
        canNext = true;
        currentQuestion = null;
        answers = null;
        shuffleQuestions();
        clickNextQuestion();
    }

    function clickNextQuestion() {
        log('clickNextQuestion...');
        detailControl(false);
        var dfd = $.Deferred();
        dfd.then(function(resp){
            return initQuestion();
        },error).then(function(resp){
            log('updateNextQuestion UI...');
            updateDetailUI();
            updateScoreUI();
            updateAnswerBtnUI();
            var audio = $('.mp3-player')[0];
            audio.play();
        },error);
        dfd.resolve();
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
        console.log(currentQuestion.audioSrc);
        details.empty();
        var detailUI = $('#template-detailUI').text();
        detailUI = detailUI.split('{src}').join(currentQuestion.audioSrc);
        detailUI = detailUI.split('{url}').join(currentQuestion.url);
        detailUI = detailUI.split('{image}').join(currentQuestion.album.images[0].url);
        detailUI = detailUI.split('{artist}').join(currentQuestion.album.artist.name);
        detailUI = detailUI.split('{title}').join(currentQuestion.name);
        detailUI = detailUI.split('{album}').join(currentQuestion.album.name);
        detailUI = detailUI.split('{year}').join(currentQuestion.album.release_date);
        details.append(detailUI);
        $('#nextQuestionBtn').bind('click', clickNextQuestion);
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


