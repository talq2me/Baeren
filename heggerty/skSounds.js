// Initialize an empty array for words
let words = [];

// Fetch the data from the 'skSounds.json' file
fetch('skSounds.json')
  .then(response => response.json())
  .then(data => {
    words = data; // Store the data from the JSON file in the words array
    // Start the game once the JSON data is loaded
    startGame();
  })
  .catch(error => {
    console.error('Error loading the skSounds.json file:', error);
  });

// TTS function
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

// Function to select a random word and sound
function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

// Function to generate the sound choices (beginning, middle, or ending)
function getSoundChoices(word, soundType) {
  const choices = [];
  choices.push(word.sounds[soundType]);

  // Add random incorrect options
  while (choices.length < 4) {
    const randomWord = getRandomWord();
    const randomSound = randomWord.sounds[soundType];
    if (!choices.includes(randomSound)) {
      choices.push(randomSound);
    }
  }

  // Shuffle choices
  return choices.sort(() => Math.random() - 0.5);
}

// Function to initialize the game
function startGame() {
  if (words.length === 0) return; // Ensure words are loaded before starting the game

  const randomWord = getRandomWord();
  const soundTypes = ['beginning', 'middle', 'ending'];
  const soundType = soundTypes[Math.floor(Math.random() * 3)];

  // Display the word and instruction
  document.getElementById('word').textContent = randomWord.word;
  document.getElementById('instruction').textContent = `Please choose the ${soundType} sound`;

  // Read the word using TTS
  speak(randomWord.word);

  // Display the choices for the sound
  const choices = getSoundChoices(randomWord, soundType);
  const choicesContainer = document.getElementById('choices');
  choicesContainer.innerHTML = ''; // Clear previous choices

  choices.forEach(choice => {
    const button = document.createElement('button');
    button.textContent = choice;
    button.onclick = () => checkAnswer(choice, randomWord.sounds[soundType], soundType);
    choicesContainer.appendChild(button);
  });
}

// Function to check if the chosen answer is correct
function checkAnswer(selectedChoice, correctSound, soundType) {
  const result = selectedChoice === correctSound ? 'Correct!' : 'Wrong, try again!';
  alert(result);

  // Move to the next round after a short delay
  setTimeout(startGame, 1000);
}

// Start the game when the page loads
document.getElementById('nextButton').addEventListener('click', startGame);

// Start the first round
startGame();
