let questions = [];
let currentQuestion = null;
let stars = 0;

// Load questions from JSON
fetch('gr3math.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
    startGame();
  })
  .catch(error => {
    console.error('Error loading questions:', error);
  });

function startGame() {
  stars = 0;
  updateStarCount();
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('answerBank').style.display = 'block';
  loadNewQuestion();
}

function loadNewQuestion() {
  currentQuestion = questions[Math.floor(Math.random() * questions.length)];
  document.getElementById('questionContainer').innerText = currentQuestion.question;
  
  const answerBank = document.getElementById('answerBank');
  answerBank.innerHTML = '';

  currentQuestion.choices.forEach(choice => {
    const button = document.createElement('button');
    button.className = 'big-button'; // reuse your nice big buttons
    button.innerText = choice;
    button.onclick = () => checkAnswer(choice);
    answerBank.appendChild(button);
  });
}

function checkAnswer(selectedAnswer) {
  if (selectedAnswer === currentQuestion.correctAnswer) {
    stars++;
    updateStarCount();
    if (stars >= 10) {
      endGame();
    } else {
      loadNewQuestion();
    }
  } else {
    alert("Try again!");
  }
}

function updateStarCount() {
  document.getElementById('starCount').innerText = `⭐ ${stars} / 10`;
}

function endGame() {
  document.getElementById('questionContainer').innerText = '';
  document.getElementById('answerBank').style.display = 'none';
  document.getElementById('gameOver').style.display = 'block';
  document.getElementById('replayBtn').style.display = 'inline-block';
}

document.getElementById('replayBtn').addEventListener('click', startGame);

// Go back function (assuming you had it in other games)
function goBack() {
  window.history.back();
}
