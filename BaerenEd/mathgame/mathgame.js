let gameData = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0; // <-- Add this line
let maxQuestions = 10;



// Utility to shuffle an array in place
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Load the game data and initialize the game
async function loadGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const jsonFile = urlParams.get("jsonFile");
    const gameTitle = urlParams.get("title");

    console.log("Loading JSON file:", jsonFile); // Debugging

    updateStarCount(); //draw the 0/maxQuestions stars

    if (!jsonFile || !gameTitle) {
        console.error("Missing required parameters: jsonFile or title");
        const messageContainer = document.getElementById("messageContainer");
        if (messageContainer) {
            messageContainer.innerText = "Error: Missing game data. Please start the game from the correct page.";
        }
        return; // Stop execution if parameters are missing
    }

    // Set the game title
    const gameTitleElement = document.getElementById("gameTitle");
    if (gameTitleElement) {
        gameTitleElement.innerText = gameTitle;
    }

    // Hide Submit and Delete buttons for games that don't use them
    if (gameTitle === "Algebra Game" || gameTitle === "Fractions Game" || 
        gameTitle === "General Math Game" || gameTitle === "Mixed Math Game" ||
        gameTitle === "Conjugation Game" || gameTitle === "Translation Game" || 
        gameTitle === "Word Problems Math Game" || gameTitle === "Sk Math Game") {
        document.getElementById("submitBtn").style.display = "none";
        document.getElementById("delete-btn").style.display = "none";
    }

    try {
        const response = await fetch(jsonFile);
        gameData = await response.json();

        // Load the current index from localStorage (no date, so always resumes)
        const storageKey = `mathgame_index_${jsonFile}`;
        currentIndex = parseInt(localStorage.getItem(storageKey) || "0", 10);

        // Start the game
        showQuestion();
    } catch (error) {
        console.error("Error loading game data:", error);
        const messageContainer = document.getElementById("messageContainer");
        if (messageContainer) {
            messageContainer.innerText = "Error loading game data.";
        }
    }
}

// Display the current question and choices
function showQuestion() {
    if (gameData.length === 0) {
        console.error("No game data available.");
        return;
    }

    // Wrap around to the first question if we've reached the end
    if (currentIndex >= gameData.length) {
        currentIndex = 0;
    }

    const currentItem = gameData[currentIndex];
    const promptContainer = document.getElementById("promptContainer");
    const choicesDiv = document.getElementById("choices");
    const messageContainer = document.getElementById("messageContainer");

    // Clear previous content
    promptContainer.innerText = currentItem.question;
    choicesDiv.innerHTML = "";
    messageContainer.innerText = "";

    // Shuffle choices before displaying
    const shuffledChoices = [...currentItem.choices];
    shuffleArray(shuffledChoices);

    // Display choices as buttons
    shuffledChoices.forEach(choice => {
        const btn = document.createElement("button");
        btn.innerText = choice;
        btn.className = "button";
        btn.onclick = () => handleChoice(choice, currentItem.correctAnswer);
        choicesDiv.appendChild(btn);
    });
}

// Handle the user's choice
function handleChoice(choice, correctAnswer) {
    const messageContainer = document.getElementById("messageContainer");

    // Disable all choice buttons immediately
    const choicesDiv = document.getElementById("choices");
    Array.from(choicesDiv.querySelectorAll("button")).forEach(btn => btn.disabled = true);

    if (choice === correctAnswer) {
        messageContainer.innerHTML = "⭐ Correct!";
        correctCount++;
        updateStarCount();

        // Move to the next question
        currentIndex++;
        saveProgress();

        if (correctCount < maxQuestions) {
            setTimeout(showQuestion, 1000); // Show the next question after 1 second
        } else {
            endGame();
        }
    } else {
        wrongCount++; // <-- Increment wrong count
        if (wrongCount >= 5) {
            messageContainer.innerHTML = "You got 5 wrong, you must start over!";
            setTimeout(() => {
                // Reset only the counts, but keep the progress position
                correctCount = 0;
                wrongCount = 0;
                updateStarCount();
                // Don't reset currentIndex or saveProgress - keep the current position
                showQuestion();
            }, 2000);
        } else {
            messageContainer.innerHTML = `☹️ Incorrect! The correct answer is: ${correctAnswer}`;
            setTimeout(() => {
                messageContainer.innerHTML = "";
                currentIndex++;
                saveProgress();
                showQuestion();
            }, 2000); // Show the next question after 2 seconds
        }
    }
}

// Update the star count display
function updateStarCount() {
    const starCount = document.getElementById("starCount");
    starCount.innerText = `⭐ ${correctCount} / ${maxQuestions}`;
}

// Save the user's progress to localStorage
function saveProgress() {
    const urlParams = new URLSearchParams(window.location.search);
    const jsonFile = urlParams.get("jsonFile");
    const storageKey = `mathgame_index_${jsonFile}`;
    localStorage.setItem(storageKey, currentIndex);
}


function endGame() {
  const choicesDiv = document.getElementById("choices");
  const playButton = document.getElementById("playButton");
  const messageContainer = document.getElementById("messageContainer");

  if (choicesDiv) {
      choicesDiv.innerHTML = "<h2>Game Over! 🎉</h2>";
  }
  if (playButton) {
      playButton.innerText = "Play Again";
  }
  if (messageContainer) {
      messageContainer.innerHTML = "Congratulations! You've completed the game!";
  }

  // Notify parent window that the game is completed
  window.parent.postMessage({ type: "gameCompleted" }, "*");
}

// Initialize the game on page load
window.onload = loadGame;
