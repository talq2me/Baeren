let data;
let current = null;
let stars = 0;
let gameOver = false;
let selectedPart = ''; // Variable to store the selected part of the word ()

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


document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("skSpellingData.json");
    data = await response.json();
    nextWord();

    document.getElementById("submitBtn").addEventListener("click", checkAnswer);
    document.getElementById("replayBtn").addEventListener("click", replaySounds);  // Replay button event
});

function nextWord() {
    if (gameOver) return;

    if (stars >= 1) {
        showGameOverScreen();
        gameOver = true;
        return;
    }

    current = data[Math.floor(Math.random() * data.length)];
    document.getElementById("spelledWord").innerHTML = '';
    document.getElementById("messageContainer").innerHTML = '';
    document.getElementById("submitBtn").style.display = 'inline-block';
    document.getElementById("replayBtn").style.display = 'inline-block';

    
    // Randomly select a part of the word (beginning, middle, or end)
    const parts = ['beginning', 'middle', 'ending'];
    selectedPart = parts[Math.floor(Math.random() * parts.length)];


    // Inject the correct SVG into the page
    document.getElementById('iconContainer').innerHTML = icons[selectedPart];

    speakWord(current.word, current.pronunciation);

    // 🔀 Shuffle the choices before displaying
    const shuffledChoices = [...current.choices].sort(() => Math.random() - 0.5);

    const bankDiv = document.getElementById("wordBank");
    bankDiv.innerHTML = '';
    shuffledChoices.forEach(choice => {
        const btn = document.createElement("button");
        btn.textContent = choice;
        btn.className = "bigblue-button";
        btn.addEventListener("click", () => {
            document.getElementById("spelledWord").textContent += choice;
        });
        // Call checkUserChoice when a button is clicked
        btn.addEventListener("click", () => {
            checkUserChoice(choice);  // Check if the choice is correct
        });
        
        bankDiv.appendChild(btn);
    });
}

function checkUserChoice(choice) {
    let correctSound = '';
    let isCorrect = false;

    if (selectedPart === 'beginning') {
        // Check if the choice matches the beginning part of the word
        correctSound = current.word.slice(0, choice.length);  // Get the beginning part of the word
        isCorrect = choice.toLowerCase() === correctSound.toLowerCase();
    } else if (selectedPart === 'middle') {
        // Check if the choice matches the middle part of the word
        const middleIndex = Math.floor(current.word.length / 2);
        let middlePart = current.word.slice(middleIndex, middleIndex + choice.length);
        
        // Ensure it's not at the beginning or end of the word
        const isNotBeginning = !current.word.startsWith(choice);
        const isNotEnding = !current.word.endsWith(choice);

        isCorrect = isNotBeginning && isNotEnding && choice.toLowerCase() === middlePart.toLowerCase();
    } else if (selectedPart === 'ending') {
        // Check if the choice matches the ending part of the word
        correctSound = current.word.slice(-choice.length);  // Get the ending part of the word
        isCorrect = choice.toLowerCase() === correctSound.toLowerCase();
    }

    // Provide feedback based on the check
    if (isCorrect) {
        stars++;
        document.getElementById("starCount").textContent = `⭐ ${stars} / 10`;
        document.getElementById("messageContainer").innerHTML = "<span style='color:green;'>✅ Correct!</span>";
    } else {
        document.getElementById("messageContainer").innerHTML = `<span style='color:red;'>❌ Try again! The correct sound was <b>${correctSound}</b></span>`;
    }
    setTimeout(nextWord, 1500);
}

function checkAnswer() {
    const attempt = document.getElementById("spelledWord").textContent.trim().toLowerCase();
    if (attempt === current.word.toLowerCase()) {
        stars++;
        document.getElementById("starCount").textContent = `⭐ ${stars} / 10`;
        document.getElementById("messageContainer").innerHTML = "<span style='color:green;'>✅ Correct!</span>";
    } else {
        document.getElementById("messageContainer").innerHTML = `<span style='color:red;'>❌ Try again! The correct word was <b>${current.word}</b></span>`;
    }
    setTimeout(nextWord, 1500);
}

function showGameOverScreen() {
    const messageDiv = document.getElementById("messageContainer");
    messageDiv.innerHTML = '<h2>🎉 Game Over! You got 10 stars! 🎉</h2><button class="big-button" onclick="restartGame()">Play Again</button>';
    document.getElementById("wordBank").innerHTML = '';
    document.getElementById("spelledWord").innerHTML = '';
    document.getElementById("submitBtn").style.display = 'none';
    document.getElementById("replayBtn").style.display = 'none';
    document.getElementById("iconContainer").innerHTML = '';
    // Send a message to the parent window when the game is completed
    window.parent.postMessage({ type: "gameCompleted" }, "*");

//    const kidElement = document.getElementById('kid');
//    const kid = kidElement.getAttribute('data-kid');
//    if (kid) {
//        console.log(`Unlocking next piece for ${kid}`);
//        unlockNextPiece(kid);
 //   }
}

function restartGame() {
    stars = 0;
    gameOver = false;
    document.getElementById("starCount").textContent = `⭐ ${stars} / 10`;
    nextWord();
}


function speakWord(word, pronunciation) {
    // Cancel any ongoing TTS or queued speech
    speechSynthesis.cancel();

    // Wait until speechSynthesis is ready
    const waitForVoices = setInterval(() => {
        if (speechSynthesis.getVoices().length !== 0) {
            clearInterval(waitForVoices);

            const instruction = new SpeechSynthesisUtterance(`Find the ${selectedPart} sound in the word ${word}`);
            instruction.lang = 'en-US';
            instruction.rate = 1;

            instruction.onend = () => {
                playPronunciationClips(pronunciation);
            };

            speechSynthesis.speak(instruction);
        }
    }, 100);
}

function playPronunciationClips(pronunciation) {
    const playPart = (clipPaths, onComplete, rate = 1.8) => {
        let index = 0;
        const playNext = () => {
            if (index >= clipPaths.length) {
                if (onComplete) onComplete();
                return;
            }
            const audio = new Audio(clipPaths[index]);
            audio.playbackRate = rate;
            audio.onended = () => {
                index++;
                playNext();
            };
            audio.play();
        };
        playNext();
    };

    // Chain playback: beginning → (short delay) → middle → (short delay) → end
    playPart(pronunciation.beginning, () => {
        setTimeout(() => {
            playPart(pronunciation.middle, () => {
                setTimeout(() => {
                    playPart(pronunciation.ending);
                }, 300); // short delay before ending
            });
        }, 300); // short delay before middle
    });
}

function replaySounds() {
    speakWord(current.word, current.pronunciation);
}
