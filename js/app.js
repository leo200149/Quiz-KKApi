$(document).ready(function () {
    const TOKEN = 'Bearer KB7o8UDDDbsfRbAG6dl4BA==';
    const XAPIKEY = 'ilGN6uwDsg4UY39qVNIDw0aq6fJeqBC2QvHuvLRf';
    const resultDescs = ['快去KKBOX多聽一點歌','愛聽歌一族','歌本王者','歌本之神，沒有什麼難得倒你！'];
    const startAlertBtn = $('#startAlertBtn');
    const loadingBtn = $('#loadingBtn');
    const details = $('#details');
    const detailOpen = $('#detailOpen');
    const startBtn = $('#startBtn');
    var totalQuestions = [];
    var questions = [];
    var score = 0;
    var canNext = true;
    var currentQuestion = null;
    var nextQuestion = null;

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
  
    function error(resp){
        log(resp);
    }

    async function init() {
        loadingBtn.click();
        totalQuestions = await loadQuestionData();
        questions = shuffleQuestions();
        nextQuestion = await initNextQuestion();
        startBtn.bind('click',clickNextQuestion);
        loadingBtn.click();
        startAlertBtn.click();
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

    function shuffleQuestions() {
        log('shuffleQuestions...');
        var questions = totalQuestions.slice();
        shuffleArray(questions);
        return questions;
    }

    async function initNextQuestion(){
        log('initNextQuestion...');
        var nextQuestion = prepareQuestion();
        nextQuestion.audioSrc = await getQuestionAudioSrc(nextQuestion);
        return nextQuestion;
    }

    function prepareQuestion() {
        log('prepareQuestion...');
        var nextQuestion = questions.pop();
        var answerQuestions = [];
        answerQuestions.push(nextQuestion);
        for (var i = 0; i < 3; i++) {
            var question = totalQuestions[getRandomIndex(totalQuestions.length)];
            while (answerQuestions.includes(question)) {
                question = totalQuestions[getRandomIndex(totalQuestions.length)];
            }
            answerQuestions.push(question);
        }
        var answers = [];
        for (var i = 0; i < answerQuestions.length; i++) {
            var answerQuestion = answerQuestions[i];
            answers.push({ id: answerQuestion.id, singer: answerQuestion.album.artist.name, song: answerQuestion.name });
        }
        shuffleArray(answers);
        nextQuestion.answers = answers;
        return nextQuestion;
    }

    async function clickRestart() {
        loadingBtn.click();
        score = 0;
        canNext = true;
        currentQuestion = null;
        nextQuestion = null;
        questions = shuffleQuestions();
        nextQuestion = await initNextQuestion();
        loadingBtn.click();
        startAlertBtn.click();
    }

    function clickNextQuestion() {
        log('clickNextQuestion...');
        currentQuestion = nextQuestion;
        detailControl(false);
        async function update(){
            updateDetailUI();
            updateScoreUI();
            updateAnswerBtnUI();
            var audio = $('.mp3-player')[0];
            audio.play();
            nextQuestion = await initNextQuestion();
        }
        setTimeout(update,500);
    }

    function clickAnwserBtn() {
        $('.answerbtn').unbind('click');
        var index = $(this).attr('answer');
        var answers = currentQuestion.answers;
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
        var answers = currentQuestion.answers;
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


