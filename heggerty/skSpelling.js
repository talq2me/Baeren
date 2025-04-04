let data;
let current = null;
let stars = 0;

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("skSpellingData.json");
    data = await response.json();
    nextWord();

    document.getElementById("submitBtn").addEventListener("click", checkAnswer);
    document.getElementById("replayBtn").addEventListener("click", replaySounds);  // Replay button event
});

function nextWord() {
    if (stars >= 10) {
        document.getElementById("messageContainer").innerHTML = `<h2>🎉 Game Over! You got 10 stars! 🎉</h2><button class="big-button" onclick="restartGame()">Play Again</button>`;
        document.getElementById("wordBank").innerHTML = '';
        document.getElementById("promptContainer").innerHTML = '';
        document.getElementById("spelledWord").innerHTML = '';
        document.getElementById("submitBtn").style.display = 'none';
        document.getElementById("replayBtn").style.display = 'none';  // Hide replay button after game over
        return;
    }

    // Get a random word from the data
    current = data[Math.floor(Math.random() * data.length)];
    document.getElementById("spelledWord").innerHTML = '';
    document.getElementById("messageContainer").innerHTML = '';
    document.getElementById("submitBtn").style.display = 'inline-block';
    document.getElementById("replayBtn").style.display = 'inline-block';  // Show replay button

    // Read out the entire word by breaking it down into sounds
    speakWord(current.word, current.pronunciation);

    // Display word bank for spelling the word
    const bankDiv = document.getElementById("wordBank");
    bankDiv.innerHTML = '';
    current.sounds.forEach(sound => {
        const btn = document.createElement("button");
        btn.textContent = sound;
        btn.className = "bigblue-button";
        btn.addEventListener("click", () => {
            document.getElementById("spelledWord").textContent += sound;
        });
        bankDiv.appendChild(btn);
    });
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

function restartGame() {
    stars = 0;
    document.getElementById("starCount").textContent = `⭐ ${stars} / 10`;
    nextWord();
}

function speakWord(word, pronunciation) {
    // Announce the instruction: "Spell the word:"
    const instruction = new SpeechSynthesisUtterance(`Spell the word:${word}`);
    instruction.lang = 'en-US';
    instruction.rate = 0.6; // Slow down the speech for clarity
    speechSynthesis.speak(instruction);
    

    // Loop through each pronunciation sound and add a small delay between them
    pronunciation.forEach((pronunciation, index) => {
        const soundUtterance = new SpeechSynthesisUtterance(pronunciation);
        soundUtterance.lang = 'en-US';
        soundUtterance.rate = 0.5; // Slow down the speech for clarity

        // Add a small delay between sounds for natural flow
        setTimeout(() => {
            speechSynthesis.speak(soundUtterance);
        }, index * 100); // Delay each sound by 1 second (adjust if needed)
    });
}

// Function to replay the sounds with phonetic pronunciation
function replaySounds() {
    // Make sure we pass 'pronunciation' and not 'sounds'
    speakWord(current.word, current.pronunciation);  // Replay the current word's breakdown with pronunciation
}