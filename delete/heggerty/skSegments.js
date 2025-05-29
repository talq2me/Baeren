// Sample words and phonemes in JSON format
const words = [];

// Fetch the data from the 'skSounds.json' file
fetch('skSegments.json')
  .then(response => response.json())
  .then(data => {
    words = data; // Store the data from the JSON file in the words array
    // Start the game once the JSON data is loaded
    startGame();
  })
  .catch(error => {
    console.error('Error loading the skSegments.json file:', error);
  });
  
  // TTS function to say each sound slowly
  function speakSounds(sounds) {
    let delay = 0;
    sounds.forEach((sound, index) => {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(sound);
        window.speechSynthesis.speak(utterance);
      }, delay);
      delay += 1000; // 1 second delay between each sound
    });
  }
  
  // Function to select a random word
  function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  }
  
  // Function to generate sound choices (based on the number of sounds in the word)
  function getSoundChoices(numberOfSounds) {
    const choices = [numberOfSounds];
    // Add incorrect choices (random number of sounds)
    while (choices.length < 4) {
      const randomChoice = Math.floor(Math.random() * 5) + 1; // 1-5 sounds
      if (!choices.includes(randomChoice)) {
        choices.push(randomChoice);
      }
    }
  
    // Shuffle choices
    return choices.sort(() => Math.random() - 0.5);
  }
  
  // Function to initialize the game
  function startGame() {
    const randomWord = getRandomWord();
    const numberOfSounds = randomWord.sounds.length;
  
    // Display the word and instructions
    document.getElementById('word').textContent = randomWord.word;
    document.getElementById('instruction').textContent = "Listen carefully to the sounds.";
  
    // Read the sounds using TTS
    speakSounds(randomWord.sounds);
  
    // Generate the choices (number of sounds)
    const choices = getSoundChoices(numberOfSounds);
    const choicesContainer = document.getElementById('choices');
    choicesContainer.innerHTML = ''; // Clear previous choices
  
    choices.forEach(choice => {
      const button = document.createElement('button');
      button.textContent = choice;
      button.onclick = () => checkAnswer(choice, numberOfSounds);
      choicesContainer.appendChild(button);
    });
  }
  
  // Function to check if the chosen answer is correct
  function checkAnswer(selectedChoice, correctAnswer) {
    const result = selectedChoice === correctAnswer ? 'Correct!' : 'Wrong, try again!';
    alert(result);
  
    // Move to the next round after a short delay
    setTimeout(startGame, 1000);
  }
  
  // Start the game when the page loads
  document.getElementById('nextButton').addEventListener('click', startGame);
  
  // Start the first round
  startGame();
  