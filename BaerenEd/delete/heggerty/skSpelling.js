let data;
let current = null;
let stars = 0;

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("skSpellingData.json");
    data = await response.json();
    nextWord();

    document.getElementById("submitBtn").addEventListener("click", checkAnswer);
    document.getElementById("replayBtn").addEventListener("click", replaySounds);
    document.getElementById("delete-btn").addEventListener("click", () => {
        const spelled = document.getElementById("spelledWord").textContent;
        document.getElementById("spelledWord").textContent = spelled.slice(0, -1);
    });
});

function showGameOverScreen() {
    const messageDiv = document.getElementById("messageContainer");
    messageDiv.innerHTML = '<h2>🎉 Game Over! You got 10 stars! 🎉</h2><button class="big-button" onclick="restartGame()">Play Again</button>';
    document.getElementById("wordBank").innerHTML = '';
    document.getElementById("promptContainer").innerHTML = '';
    document.getElementById("spelledWord").textContent = '';

    // Send a message to the parent window when the game is completed
    window.parent.postMessage({ type: "gameCompleted" }, "*");

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.style.display = 'none';

    const replayBtn = document.getElementById("replayBtn");
    if (replayBtn) replayBtn.style.display = 'none';

   // const kidElement = document.getElementById('kid');
  //  const kid = kidElement?.getAttribute('data-kid');
  //  if (kid) {
  //      console.log(`Unlocking next piece for ${kid}`);
 //       unlockNextPiece(kid);
//    }
}


function nextWord() {
    if (stars >= 1) {
        showGameOverScreen();
        return;
    }

    current = data[Math.floor(Math.random() * data.length)];
    document.getElementById("spelledWord").textContent = '';
    document.getElementById("messageContainer").innerHTML = '';
    document.getElementById("submitBtn").style.display = 'inline-block';
    document.getElementById("replayBtn").style.display = 'inline-block';

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
    // Cancel any ongoing TTS or queued speech
    speechSynthesis.cancel();

    // Wait until speechSynthesis is ready
    const waitForVoices = setInterval(() => {
        if (speechSynthesis.getVoices().length !== 0) {
            clearInterval(waitForVoices);

            const instruction = new SpeechSynthesisUtterance(`Spell the word: ${word}`);
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