const express = require('express')
const app = express()
const port = 3000
const axios = require('axios')
const he = require('he')

//const mustacheExpress = require('mustache-express')
//app.engine('html', mustacheExpress())
let resultHolder = []
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded());

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.render('index.ejs')
})

app.post('/clicked', (req, res) => {
    console.log(req.body)
    res.render('clicked.ejs')
})

app.post('/answers', async (req, res) => {
    let data = req.body
    let questions = resultHolder.find(o => o.sessId === data.sessId)
    let results = JSON.parse(questions.results)

    

    const answerss = results[data.question_no].incorrect_answers.concat(results[data.question_no].correct_answer);
    let shuffledAnswers = answerss.sort(() => Math.random() - 0.5);
    shuffledAnswers = fixDates(shuffledAnswers);

    await res.render('answers.ejs', {'results': results[data.question_no], 'answers': answerss, 'data': data, 'decode': he.decode })
})

app.post('/valanswers', async (req, res) => {
    let data = req.body
    let questions = resultHolder.find(o => o.sessId === data.sessId)
    let results = JSON.parse(questions.results)
    let correctAnsChosen = false;

    // console.log ('results length: ', results.length)
    // console.log ('question_no: ', data.question_no + 1)

    let finish = results.length == parseInt(data.question_no) + 1;

    const answers = data.answers.split(',')

    correctAnsChosen = he.decode(answers[data.selectedAns]) == he.decode(results[data.question_no].correct_answer)



    await res.render('valanswers.ejs', {'results': results[data.question_no], 'finish': finish, 'selectedAns': data.selectedAns, 'answers': answers, 'data': data, 'decode': he.decode, 'correct': correctAnsChosen })
})

app.post('/quizbox', async (req, res) => {
    let data = req.body
    
    data.categoriesname = data.categories.split('-')[1]
    
    const difficulty = data.difficulty.toLowerCase()
    const quizType = data.quiztype.toLowerCase()
    const id = data.categories.split('-')[0]
    const amount = data.numofquestions 
    data.question_no = '0';

    if (difficulty === "any" && quizType === "any" && id !== 0) {
        url = 'https://opentdb.com/api.php?amount=' + amount + '&category=' + id;
    } else if (difficulty !== "any" && id === 0 && quizType === "any") {
        url = 'https://opentdb.com/api.php?amount=' + amount + '&difficulty=' + difficulty;
    } else if (difficulty !== "any" && id !== 0 && quizType === "any") {
        url = 'https://opentdb.com/api.php?amount=' + amount + '&category=' + id + '&difficulty=' + difficulty;
    } else if (difficulty === "any" && id === 0 && quizType !== "any") {
        url = 'https://opentdb.com/api.php?amount=' + amount + '&type=' + quizType;
    } else if (difficulty === "any" && id !== 0 && quizType !== "any") {
        url = 'https://opentdb.com/api.php?amount=' + amount + '&category=' + id + '&type=' + quizType;
    } else if (difficulty !== "any" && id === 0 && quizType !== "any") {
        url = 'https://opentdb.com/api.php?amount=' + amount + '&difficulty=' + difficulty + '&type=' + quizType;
    } else if (difficulty !== "any" && id !== 0 && quizType !== "any") {
        url = 'https://opentdb.com/api.php?amount=' + amount + '&category=' + id + '&difficulty=' + difficulty + '&type=' + quizType;
    } else {
        url = 'https://opentdb.com/api.php?amount=' + amount;
    }
    const response = await axios.get(url);
    const results = await response.data.results;
    const sessId = generateId()
    resultHolder.push({ "sessId": sessId, 'results': JSON.stringify(results)})

    await res.render('quizbox.ejs', {'data': data, 'sessId': sessId } )
})

app.post('/form', async (req, res) => {
    const response = await axios.get('https://opentdb.com/api_category.php');
    const categories = await response.data;
    await res.render('form.ejs', {'categories': categories.trivia_categories})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function generateId() {   
    return Math.random().toString(36).substring(2) +
        (new Date()).getTime().toString(36);
}

function fixDates(arr) {
    for (let i in arr) {
        arr[i] = arr[i].replace(/,/g, '&#44;')
    }
    return arr;
}

module.exports = app;
