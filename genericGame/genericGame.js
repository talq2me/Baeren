let correctCount = 0;
let gameData = [];
let currentItem = {};
let useTTS = false;
let useAudioFiles = false;
let userInput = []; // Store user input for spelling games
let maxQuestions;


// Load game data and initialize the game
async function loadGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const jsonFile = urlParams.get("jsonFile");
    const gameTitle = urlParams.get("title");
    useTTS = urlParams.get("useTTS") === "true";
    useAudioFiles = urlParams.get("useAudioFiles") === "true";

    //update maxQuestions based on the game title
    if (gameTitle === "French Word Game" ){
        maxQuestions = 5; // French Game has fewer questions
    } else {
        maxQuestions = 10; // Default for other games
    }

    console.log("Loading JSON file:", jsonFile); // Debugging
    updateStarCount(); // Draw the 0/maxQuestions stars

    if (!jsonFile || !gameTitle) {
        console.error("Missing required parameters: jsonFile or title");
        document.getElementById("messageContainer").innerText = "Error: Missing game data.";
        return;
    }

    // Set the game title
    document.getElementById("gameTitle").innerText = gameTitle;

    // Hide Submit and Delete buttons for games that don't use them
    if (gameTitle === "French Game" || gameTitle === "Sight Word Game" || 
        gameTitle === "Letter Sound Game" || gameTitle === "Sound Parts Game" ||
        gameTitle === "French Word Game") {
        document.getElementById("submitBtn").style.display = "none";
        document.getElementById("delete-btn").style.display = "none";
    }

    try {
        const response = await fetch(jsonFile);
        gameData = await response.json();
        nextRound(); // Instructions will be handled in nextRound
    } catch (error) {
        console.error("Error loading game data:", error);
        document.getElementById("messageContainer").innerText = "Error loading game data.";
    }
}


async function playSound() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameTitle = urlParams.get("title");

    if (gameTitle === "Sound Parts Game") {
        const word = currentItem.word;
        const selectedPart = currentItem.selectedPart;
         // Use TTS to say "Spell the word <word>"
        if (typeof AndroidTTS !== 'undefined') {
                        try {
                            readText(`Find the ${selectedPart} sound in the word ${word}.`, 'en');
                            await wait(3000); // Adjust based on word duration
                            playWordSlowly(currentItem.pronunciation)
                        } catch (error) {
                            console.error("Error in TTS sequence:", error);
                        }
        } else { 
            //regular browser 
            // Use TTS to repeat the instruction
            readText(`Find the ${selectedPart} sound in the word ${word}.`, 'en-US', () => {
                setTimeout(() => playWordSlowly(currentItem.pronunciation), 250);
            });
        }
    } else if (gameTitle === "Sight Word Game") {
        const word = currentItem.word;

        // Use TTS to repeat the instruction
        readText(`Find the word ${word}.`); // Use TTS to read the instruction

    } else if (gameTitle === "French Word Game") {
        const word = currentItem.word;

        
        
                readText(` ${word}.`, 'fr-FR');
           

    } else if (gameTitle === "Spelling Game") {
        const word = currentItem.word;

        // Use TTS to say "Spell the word <word>"
        if (typeof AndroidTTS !== 'undefined') {
                        try {
                            readText(`Spell the word ${word}.`, 'en');
                            await wait(3000); // Adjust based on word duration
                            playWordSlowly(currentItem.pronunciation)
                        } catch (error) {
                            console.error("Error in TTS sequence:", error);
                        }
        } else { 
        //regular browser               
        readText(`Spell the word ${word}.`, 'en-US', () => {
            setTimeout(() => playWordSlowly(currentItem.pronunciation), 500);
        });
    }
    } else if (useAudioFiles && currentItem.audio) {
        // Play the audio file specified in the current item
        new Audio(currentItem.audio).play();
    } else if (useTTS && currentItem.word) {
        // Use TTS to speak the word
        readText(currentItem.word);
    } else {
        console.error("No audio or TTS data available for the current item.");
    }
}

function handleChoice(choice) {
    const urlParams = new URLSearchParams(window.location.search);
    const gameTitle = urlParams.get("title");

    // For games without a Submit button, check the word immediately
    if (gameTitle === "Sound Parts Game" || gameTitle === "Sight Word Game" || 
        gameTitle === "French Game" || gameTitle === "Letter Sound Game" ||
        gameTitle === "French Word Game") {
        const feedback = document.getElementById("messageContainer");

        // Determine the correct choice
        let correctChoice;
        if (gameTitle === "Sound Parts Game") {
            if (currentItem.selectedPart === "beginning") {
                correctChoice = currentItem.originalChoices[0];
            } else if (currentItem.selectedPart === "middle") {
                correctChoice = currentItem.originalChoices[1];
            } else if (currentItem.selectedPart === "ending") {
                correctChoice = currentItem.originalChoices[2];
            }
        } else {
            correctChoice = currentItem.word; // For other games, the correct choice is the word itself
        }

        // Compare the user's choice to the correct choice
        if (choice === correctChoice) {
            feedback.innerHTML = "⭐ Correct!";
            correctCount++;
            updateStarCount();
            if (correctCount < maxQuestions) {
                setTimeout(nextRound, 1000); // Proceed to the next round after 1 second
            } else {
                endGame();
            }
        } else {
            feedback.innerHTML = "☹️ Incorrect!";
            highlightCorrectAnswer();
            setTimeout(() => {
                feedback.innerHTML = "";
                nextRound();
            }, 2000); // Proceed to the next round after 2 seconds
        }
    } else {
        // For other games, handle choices normally
        const chosenText = document.getElementById("chosenText");
        userInput.push(choice);
        chosenText.innerText = userInput.join(""); // Display the current input
    }
}

function handleSubmit() {
    const feedback = document.getElementById("messageContainer");
    const userWord = userInput.join("");

    if (userWord === currentItem.word) {
        feedback.innerHTML = "⭐ Correct!";
        correctCount++;
        updateStarCount();
        if (correctCount < maxQuestions) {
            setTimeout(nextRound, 1000);
        } else {
            endGame();
        }
    } else {
        feedback.innerHTML = "☹️ Incorrect!";
        highlightCorrectAnswer();
        setTimeout(() => {
            feedback.innerHTML = "";
            nextRound();
        }, 2000);
    }

    // Reset user input
    userInput = [];
}

function handleDelete() {
    if (userInput.length > 0) {
        userInput.pop(); // Remove the last character
        const chosenText = document.getElementById("chosenText");
        chosenText.innerText = userInput.join(""); // Update the displayed input
    }
}

function highlightCorrectAnswer() {
    const feedback = document.getElementById("messageContainer");

    // Determine the correct choice
    let correctChoice;
    if (currentItem.selectedPart === "beginning") {
        correctChoice = currentItem.originalChoices[0];
    } else if (currentItem.selectedPart === "middle") {
        correctChoice = currentItem.originalChoices[1];
    } else if (currentItem.selectedPart === "ending") {
        correctChoice = currentItem.originalChoices[2];
    } else {
        correctChoice = currentItem.word; // For games without word parts, the correct choice is the word itself
    }

    feedback.innerText = `Correct word: ${correctChoice}`;
}

async function nextRound() {
    currentItem = getRandomItem();

    const urlParams = new URLSearchParams(window.location.search);
    const gameTitle = urlParams.get("title");

    // Ensure the word is included in the choices array for Sight Word Game
    if (gameTitle === "Sight Word Game" && !currentItem.choices.includes(currentItem.word)) {
        currentItem.choices.push(currentItem.word);
    }

    // Special logic for Sound Parts Game
    if (gameTitle === "Sound Parts Game") {
        const messageContainer = document.getElementById("messageContainer");
        const word = currentItem.word;

        // Randomly pick a sound part (beginning, middle, or ending)
        const soundParts = ["beginning", "middle", "ending"];
        const selectedPart = soundParts[Math.floor(Math.random() * soundParts.length)];

        // Store the selected part for comparison later
        currentItem.selectedPart = selectedPart;

        // Store the original choices before randomizing
        currentItem.originalChoices = [...currentItem.choices];

        // Display the instruction
        //messageContainer.innerText = `Find the ${selectedPart} sound in the word "${word}".`;

        // Show the inline SVG icon for the sound part
        showSoundPartIcon(selectedPart);

         // Use TTS to say "Spell the word <word>"
        if (typeof AndroidTTS !== 'undefined') {
                        try {
                            readText(`Find the ${selectedPart} sound in the word ${word}.`, 'en');
                            await wait(3000); // Adjust based on word duration
                            playWordSlowly(currentItem.pronunciation)
                        } catch (error) {
                            console.error("Error in TTS sequence:", error);
                        }
        } else { 
            //regular browser 
            // Use TTS to say the instruction
            readText(`Find the ${selectedPart} sound in the word ${word}.`, 'en-US', () => {
                setTimeout(() => playWordSlowly(currentItem.pronunciation), 250);
            });
        }
    } else if (gameTitle === "Sight Word Game") {
        // Special logic for Sight Word Game
        const messageContainer = document.getElementById("messageContainer");
        const word = currentItem.word;

        // Display the instruction
        //messageContainer.innerText = `Find the word "${word}".`;

        readText(`Find the word ${word}.`); // Use TTS to read the instruction
    } else if (gameTitle === "French Word Game") {
        // Special logic for French Word Game
        const messageContainer = document.getElementById("messageContainer");
        const word = currentItem.word;

        // Display the instruction
        //messageContainer.innerText = `Find the word "${word}".`;

        readText(`Find the word`, 'en-US', () => {
            setTimeout(() => {
                readText(` ${word}.`, 'fr-FR');
            }, 200); // 200ms pause
        });
    } else if (gameTitle === "Spelling Game") {
        // Special logic for Spelling Game
        const messageContainer = document.getElementById("messageContainer");
        const word = currentItem.word;

        // Display the instruction
        //messageContainer.innerText = `Spell the word "${word}".`;

        if (typeof AndroidTTS !== 'undefined') {
                        try {
                            readText(`Spell the word ${word}.`, 'en');
                            await wait(3000); // Adjust based on word duration
                            playWordSlowly(currentItem.pronunciation)
                        } catch (error) {
                            console.error("Error in TTS sequence:", error);
                        }
        } else { 
            //regular browser  
            // Use TTS to say "Spell the word <word>"
            readText(`Spell the word ${word}.`, 'en-US', () => {
                setTimeout(() => playWordSlowly(currentItem.pronunciation), 500);
            });
        }
    } else {
        // For other games, play the instructions using playSound
        playSound();
    }

    updateChoices(currentItem.choices); // Display the randomized choices
    document.getElementById("messageContainer").innerHTML = "";
    document.getElementById("chosenText").innerText = ""; // Clear the old choice text
    userInput = []; // Reset the user input for the new round
}

function showSoundPartIcon(soundPart) {
    const iconContainer = document.getElementById("iconContainer");
    iconContainer.innerHTML = ""; // Clear any existing icons

    const icons = {
        beginning: `
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="29" height="29" rx="2" ry="2" fill="white" stroke="#cccccc" stroke-width="1"/>
                <rect x="2" y="2" width="7" height="26" fill="#6ac2ff" rx="1" ry="1"/>
                <line x1="10" y1="1" x2="10" y2="29" stroke="#cccccc" stroke-width="1"/>
                <line x1="20" y1="1" x2="20" y2="29" stroke="#cccccc" stroke-width="1"/>
            </svg>
        `,
        middle: `
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="29" height="29" rx="2" ry="2" fill="white" stroke="#cccccc" stroke-width="1"/>
                <rect x="11" y="2" width="8" height="26" fill="#6ac2ff" rx="1" ry="1"/>
                <line x1="10" y1="1" x2="10" y2="29" stroke="#cccccc" stroke-width="1"/>
                <line x1="20" y1="1" x2="20" y2="29" stroke="#cccccc" stroke-width="1"/>
            </svg>
        `,
        ending: `
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="29" height="29" rx="2" ry="2" fill="white" stroke="#cccccc" stroke-width="1"/>
                <rect x="21" y="2" width="7" height="26" fill="#6ac2ff" rx="1" ry="1"/>
                <line x1="10" y1="1" x2="10" y2="29" stroke="#cccccc" stroke-width="1"/>
                <line x1="20" y1="1" x2="20" y2="29" stroke="#cccccc" stroke-width="1"/>
            </svg>
        `
    };

    // Inject the correct SVG into the container
    iconContainer.innerHTML = icons[soundPart] || "";
}

function playWordSlowly(pronunciation) {
    const audioClips = [
        ...(pronunciation.beginning || []),
        ...(pronunciation.middle || []),
        ...(pronunciation.ending || [])
    ];

    if (!Array.isArray(audioClips) || audioClips.length === 0) {
        console.error("No audio clips available for the word.");
        return;
    }

    // Play each audio clip in sequence
    let index = 0;
    const playNextClip = () => {
        if (index < audioClips.length) {
            const audio = new Audio(audioClips[index]);
            audio.onended = playNextClip; // Play the next clip after the current one ends
            audio.play();
            index++;
        }
    };

    playNextClip(); // Start playing the first clip
}

function getRandomItem() {
    return gameData[Math.floor(Math.random() * gameData.length)];
}

function updateChoices(choices) {
    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";

    if (!Array.isArray(choices)) {
        console.error("Invalid choices data:", choices);
        document.getElementById("messageContainer").innerText = "Error: Invalid game data.";
        return;
    }

    // Randomize the choices
    choices.sort(() => Math.random() - 0.5);

    choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.innerText = choice;
        btn.className = "button";
        btn.onclick = () => handleChoice(choice);
        choicesDiv.appendChild(btn);
    });
}

function updateStarCount() {
    const starCount = document.getElementById("starCount");
    starCount.innerText = `⭐ ${correctCount} / ${maxQuestions}`;
}

function resetGame() {
    correctCount = 0;
    updateStarCount();
    document.getElementById("messageContainer").innerHTML = "";
    document.getElementById("choices").innerHTML = "";
    document.getElementById("playButton").innerText = "Play Sound";
    nextRound();
}

function endGame() {
    document.getElementById("choices").innerHTML = "<h2>Game Over! 🎉</h2>";
    document.getElementById("playButton").innerText = "Play Again";
    document.getElementById("messageContainer").innerHTML = "Congratulations! You've completed the game!";
    // Notify parent window that the game is completed
    window.parent.postMessage({ type: "gameCompleted" }, "*");
}

// Initialize the game on page load
window.onload = loadGame;