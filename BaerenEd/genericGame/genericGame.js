let correctCount = 0;
let gameData = [];
let currentItem = {};
let useTTS = false;
let useAudioFiles = false;
let userInput = []; // Store user input for spelling games
let maxQuestions;
let currentIndex = 0; // Track the current question index for progress

// --- Story Mode Support ---
let isStoryMode = false;
let storyData = [];
let currentStoryIndex = 0;
let currentQuestionIndex = 0;
let storyTTSActive = false;
let ttsUtterance = null;

// --- Word boundary support detection ---
let ttsWordBoundarySupported = null;

// --- AndroidTTS callback integration ---
let ttsFinishCallback = null;
function onTTSFinish() {
    if (typeof ttsFinishCallback === 'function') {
        ttsFinishCallback();
        ttsFinishCallback = null;
    }
}

// Helper: Check if loaded data is in story mode format
function isStoryGameData(data) {
    return Array.isArray(data) && data.length > 0 && data[0].story && Array.isArray(data[0].questions);
}

// Helper: Split text into spans for word highlighting
function splitTextToSpans(text) {
    return text.split(/(\s+)/).map((word, i) => `<span data-word-idx="${i}">${word}</span>`).join("");
}

// Helper: Highlight a word by index
function highlightWord(container, charIndex) {
    // Find the span that contains the charIndex
    let total = 0;
    const spans = Array.from(container.querySelectorAll('span[data-word-idx]'));
    for (let i = 0; i < spans.length; i++) {
        const len = spans[i].textContent.length;
        if (charIndex < total + len) {
            spans.forEach(span => span.classList.remove('tts-highlight'));
            spans[i].classList.add('tts-highlight');
            break;
        }
        total += len;
    }
}

// Helper: Estimate speech duration (ms) for AndroidTTS fallback
function estimateSpeechDuration(text, lang) {
    // Roughly 150ms per word, minimum 1s, max 8s
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1000, Math.min(wordCount * 150, 8000));
}

// Helper: Speak text with word highlighting (with slower French rate)
function speakWithHighlight(text, lang, container, onend) {
    // AndroidTTS integration
    if (typeof AndroidTTS !== 'undefined' && typeof AndroidTTS.speak === 'function') {
        container.classList.add('tts-highlight');
        // Convert language code for AndroidTTS (same as readText function)
        let androidLang = lang;
        if (lang === "en-US") androidLang = "en";
        if (lang === "fr-FR") androidLang = "fr";
        AndroidTTS.speak(text, androidLang);
        // Use callback if available, fallback to timer if not called in time
        let finished = false;
        ttsFinishCallback = () => {
            if (!finished) {
                finished = true;
                container.classList.remove('tts-highlight');
                if (onend) onend();
            }
        };
        // Fallback: remove highlight after estimated duration if callback not called
        setTimeout(() => {
            if (!finished) {
                finished = true;
                container.classList.remove('tts-highlight');
                if (onend) onend();
                ttsFinishCallback = null;
            }
        }, estimateSpeechDuration(text, lang) + 500);
        return;
    }
    // Web Speech API fallback
    if (!window.speechSynthesis) return;
    if (ttsUtterance) window.speechSynthesis.cancel();
    container.innerHTML = splitTextToSpans(text);
    ttsUtterance = new SpeechSynthesisUtterance(text);
    ttsUtterance.lang = lang;
    ttsUtterance.rate = (lang && lang.toLowerCase().startsWith('fr')) ? 0.6 : 0.75;
    let boundaryFired = false;
    ttsUtterance.onboundary = function(event) {
        boundaryFired = true;
        ttsWordBoundarySupported = true;
        highlightWord(container, event.charIndex);
    };
    ttsUtterance.onstart = function() {
        if (ttsWordBoundarySupported === false) {
            container.classList.add('tts-highlight');
        } else {
            highlightWord(container, 0);
        }
    };
    ttsUtterance.onend = function() {
        Array.from(container.querySelectorAll('span[data-word-idx]')).forEach(span => {
            span.classList.remove('tts-highlight');
        });
        container.classList.remove('tts-highlight');
        if (onend) onend();
        if (ttsWordBoundarySupported === null) {
            ttsWordBoundarySupported = boundaryFired;
            if (!boundaryFired) ttsWordBoundarySupported = false;
        }
    };
    window.speechSynthesis.speak(ttsUtterance);
}

// Load game data and initialize the game
async function loadGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const jsonFile = urlParams.get("jsonFile");
    const gameTitle = urlParams.get("title");
    useTTS = urlParams.get("useTTS") === "true";
    useAudioFiles = urlParams.get("useAudioFiles") === "true";
    maxQuestions = 10;
    correctCount = 0;
    currentIndex = 0;
    currentStoryIndex = 0;
    currentQuestionIndex = 0;
    document.getElementById("gameTitle").innerText = gameTitle || '';

    // Set maxQuestions before first star render
    if (gameTitle === "French Word Game" || gameTitle === "French Syllable Game") {
        maxQuestions = 5; // French Games have fewer questions
    } else {
        maxQuestions = 10; // Default for other games
    }

    console.log("Loading JSON file:", jsonFile); // Debugging

    // Hide Submit and Delete buttons for games that don't use them
    if (gameTitle === "French Game" || gameTitle === "Sight Word Game" || 
        gameTitle === "Letter Sound Game" || gameTitle === "Sound Parts Game" ||
        gameTitle === "French Word Game" || gameTitle === "French Syllable Game") {
        document.getElementById("submitBtn").style.display = "none";
        document.getElementById("delete-btn").style.display = "none";
    }

    try {
        const response = await fetch(jsonFile);
        const data = await response.json();
        if (isStoryGameData(data)) {
            isStoryMode = true;
            storyData = data;
            // Always use 10 for maxQuestions in story mode for consistency
            maxQuestions = 10;
            updateStarCount();
            showStoryQuestion();
        } else {
            isStoryMode = false;
            gameData = data;
            // ... existing code for non-story games ...
            const storageKey = `genericgame_index_${jsonFile}`;
            currentIndex = parseInt(localStorage.getItem(storageKey) || "0", 10);
            if (currentIndex >= gameData.length) currentIndex = 0;
            updateStarCount();
            nextRound();
        }
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
           

    } else if (gameTitle === "French Syllable Game") {
        const word = currentItem.word;

        // Use speakWithHighlight to get the slower French rate. To avoid showing the word,
        // we create a temporary, invisible element for the highlighting to occur on.
        const invisibleContainer = document.createElement('div');
        invisibleContainer.style.position = 'absolute';
        invisibleContainer.style.opacity = '0';
        document.body.appendChild(invisibleContainer);
        speakWithHighlight(word, 'fr-FR', invisibleContainer, () => document.body.removeChild(invisibleContainer));

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
        gameTitle === "French Word Game" || gameTitle === "French Syllable Game") {
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
        } else if (gameTitle === "French Game") {
            // French Game uses 'correctWord'
            correctChoice = currentItem.correctWord;
        } else {
            correctChoice = currentItem.word; // For other games, the correct choice is the word itself
        }

        // Compare the user's choice to the correct choice
        if (choice === correctChoice) {
            console.log("Correct choice!");
            feedback.innerHTML = "⭐ Correct!";
            correctCount++;
            currentIndex++; // Advance progress on correct answer
            saveProgress();
            updateStarCount();
            if (correctCount < maxQuestions) {
                // Move to the next question
                
                // For Spelling Game, Sound Parts Game, and French Syllable Game, proceed immediately without delay
                if (gameTitle === "Spelling Game" || gameTitle === "Sound Parts Game" || gameTitle === "French Syllable Game") {
                    nextRound();
                } else {
                    setTimeout(nextRound, 1200); // Proceed to the next round after a short delay
                }
            } else {
                endGame();
            }
        } else {
            feedback.innerHTML = "☹️ Incorrect!";
            highlightCorrectAnswer();
            setTimeout(() => {
                feedback.innerHTML = "";
                // Move to the next question even for incorrect answers
                currentIndex++; // Advance progress on incorrect answer
                saveProgress(); 
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
    const urlParams = new URLSearchParams(window.location.search);
    const gameTitle = urlParams.get("title");

    if (userWord === currentItem.word) {
        feedback.innerHTML = "⭐ Correct!";
        correctCount++;
        updateStarCount();
        if (correctCount < maxQuestions) {
            // Move to the next question
            currentIndex++;
            saveProgress();
            
            // For Spelling Game, Sound Parts Game, and French Syllable Game, proceed immediately without delay
            if (gameTitle === "Spelling Game" || gameTitle === "Sound Parts Game" || gameTitle === "French Syllable Game") {
                nextRound();
            } else {
                setTimeout(nextRound, 1000);
            }
        } else {
            endGame();
        }
    } else {
        feedback.innerHTML = "☹️ Incorrect!";
        highlightCorrectAnswer();
        setTimeout(() => {
            feedback.innerHTML = "";
            // Move to the next question even for incorrect answers
            currentIndex++;
            saveProgress();
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
    const urlParams = new URLSearchParams(window.location.search);
    const gameTitle = urlParams.get("title");

    if (gameTitle === "Sound Parts Game" && currentItem.selectedPart) {
        const partIndex = ["beginning", "middle", "ending"].indexOf(currentItem.selectedPart);
        if (partIndex !== -1) {
            correctChoice = currentItem.originalChoices[partIndex];
        }
    } else if (gameTitle === "French Game") {
        correctChoice = currentItem.correctWord;
    } else {
        correctChoice = currentItem.word; // For games without word parts, the correct choice is the word itself
    }

    feedback.innerText = `Correct word: ${correctChoice}`;
}

async function nextRound() {
    // Check if we've gone past the available questions
    if (currentIndex >= gameData.length) {
        endGame();
        return; // Stop further execution
    }

    // Get the current item based on the current index
    currentItem = gameData[currentIndex];
    
    const urlParams = new URLSearchParams(window.location.search);
    const gameTitle = urlParams.get("title");

    // Ensure the word is included in the choices array for Sight Word Game and French Syllable Game
    if ((gameTitle === "Sight Word Game" || gameTitle === "French Syllable Game") && !currentItem.choices.includes(currentItem.word)) {
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
        // For other games, play the instructions using playSound after DOM paints
        requestAnimationFrame(() => setTimeout(playSound, 50));
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

// Save the user's progress to localStorage
function saveProgress() {
    const urlParams = new URLSearchParams(window.location.search);
    const jsonFile = urlParams.get("jsonFile");
    const storageKey = `genericgame_index_${jsonFile}`;
    localStorage.setItem(storageKey, currentIndex.toString());
}

function resetGame() {
    correctCount = 0;
    currentIndex = 0; // Reset to the beginning
    saveProgress(); // Save the reset progress
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
    
    // Advance progress so next session resumes at the next item rather than restarting
    // Keep currentIndex as-is (it already points to the next item) and persist
    saveProgress();
    
    // Notify parent window that the game is completed
    window.parent.postMessage({ type: "gameCompleted" }, "*");
}

// Helper: Split story into sentences and render each in its own span
function renderStorySentences(storyText, container) {
    // Split on period, exclamation, or question mark followed by space or end
    const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [storyText];
    container.innerHTML = sentences.map((s, i) =>
        `<span class="story-sentence" data-sentence-idx="${i}">${splitTextToSpans(s.trim())}</span>`
    ).join(' ');
    return sentences.map(s => s.trim());
}

// Helper: Speak each sentence in sequence, highlighting as it goes
function speakStorySentences(sentences, container, lang, onend) {
    let idx = 0;
    function speakNext() {
        if (idx >= sentences.length) {
            if (onend) onend();
            return;
        }
        const sentenceSpan = container.querySelector(`[data-sentence-idx='${idx}']`);
        speakWithHighlight(sentences[idx], lang, sentenceSpan, () => {
            idx++;
            speakNext();
        });
    }
    speakNext();
}

// --- Story Mode Main Logic ---
function showStoryQuestion() {
    const storyObj = storyData[currentStoryIndex];
    const questionObj = storyObj.questions[currentQuestionIndex];
    // Render story
    const storyDiv = document.getElementById("storyContainer");
    let storySentences = [storyObj.story];
    if (storyDiv) {
        if (useTTS) {
            storySentences = renderStorySentences(storyObj.story, storyDiv);
        } else {
            storyDiv.innerHTML = storyObj.story;
        }
    }
    // Render question
    const questionDiv = document.getElementById("questionContainer");
    if (questionDiv) {
        questionDiv.innerHTML = useTTS ? splitTextToSpans(questionObj.question) : questionObj.question;
    }
    // Randomize choices and track correct answer index
    let choices = questionObj.choices.slice();
    // Fisher-Yates shuffle
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    const correctAnswer = questionObj.answer;
    const correctIdx = choices.indexOf(correctAnswer);
    // Store for submitStoryAnswer
    showStoryQuestion._choices = choices;
    showStoryQuestion._correctIdx = correctIdx;
    // Render choices
    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = '';
    choices.forEach((choice, idx) => {
        const btn = document.createElement("button");
        btn.innerText = choice;
        btn.className = "button";
        btn.onclick = () => selectStoryChoice(idx);
        choicesDiv.appendChild(btn);
    });
    // Clear any previous selection highlight
    selectedStoryChoice = null;
    Array.from(choicesDiv.children).forEach(btn => btn.classList.remove('selected'));
    // Show submit button
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.style.display = "inline-block";
    submitBtn.onclick = submitStoryAnswer;
    // Play button logic for story mode
    const playBtn = document.getElementById("playButton");
    if (useTTS && playBtn) {
        playBtn.onclick = function() {
            speakStorySentences(storySentences, storyDiv, 'fr-FR', () => {
                setTimeout(() => speakWithHighlight(questionObj.question, 'fr-FR', questionDiv), 400);
            });
        };
    }
    // Clear feedback
    document.getElementById("messageContainer").innerHTML = '';
    // TTS logic
    if (useTTS) {
        speakStorySentences(storySentences, storyDiv, 'fr-FR', () => {
            setTimeout(() => speakWithHighlight(questionObj.question, 'fr-FR', questionDiv), 400);
        });
    }
    // Update stars
    updateStarCount();
}

let selectedStoryChoice = null;
function selectStoryChoice(idx) {
    selectedStoryChoice = idx;
    // Highlight only the selected button and keep it highlighted until another is clicked or next question
    Array.from(document.getElementById("choices").children).forEach((btn, i) => {
        if (i === idx) {
            btn.classList.add("selected");
        } else {
            btn.classList.remove("selected");
        }
    });
    // Play TTS for the selected answer if TTS is enabled
    if (useTTS) {
        const btn = document.getElementById("choices").children[idx];
        speakWithHighlight(btn.innerText, 'fr-FR', btn);
    }
}

function submitStoryAnswer() {
    if (selectedStoryChoice === null) return;
    const choices = showStoryQuestion._choices;
    const correctIdx = showStoryQuestion._correctIdx;
    const questionObj = storyData[currentStoryIndex].questions[currentQuestionIndex];
    const feedback = document.getElementById("messageContainer");
    if (selectedStoryChoice === correctIdx) {
        feedback.innerHTML = "⭐ Correct!";
        correctCount++;
        updateStarCount();
        // Check if we've reached the maximum number of questions
        if (correctCount >= maxQuestions) {
            setTimeout(endGame, 1200);
        } else {
            setTimeout(nextStoryQuestion, 1200);
        }
    } else {
        feedback.innerHTML = `☹️ Incorrect!<br>Correct answer: <b>${questionObj.answer}</b>`;
        // Highlight correct answer
        Array.from(document.getElementById("choices").children).forEach((btn, i) => {
            if (i === correctIdx) btn.style.background = '#b2f2bb';
        });
        setTimeout(nextStoryQuestion, 2200);
    }
}

function nextStoryQuestion() {
    selectedStoryChoice = null;
    // Move to next question or next story
    currentQuestionIndex++;
    if (currentQuestionIndex >= storyData[currentStoryIndex].questions.length) {
        currentStoryIndex++;
        currentQuestionIndex = 0;
    }
    if (currentStoryIndex >= storyData.length) {
        endGame();
    } else {
        showStoryQuestion();
    }
}

// Initialize the game on page load
window.onload = loadGame;