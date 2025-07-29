document.addEventListener("DOMContentLoaded", function () {
    const sentenceContainer = document.getElementById("sentence-container");
    const wordBank = document.getElementById("word-bank");
    const userAnswerContainer = document.getElementById("user-answer");
    const submitBtn = document.getElementById("submit-btn");
    const playAgainBtn = document.getElementById("play-again");
    const feedback = document.getElementById("feedback");
    const starsContainer = document.getElementById("stars");
    const resetBtn = document.getElementById("reset-btn"); // Reset button element
    const deleteBtn = document.getElementById("delete-btn");



    let sentences = [];
    let correctAnswer = [];
    let userAnswer = [];
    let stars = 0;

    // Load sentences from the JSON file
    fetch("duologicalGame.json")
        .then(response => response.json())
        .then(data => {
            sentences = data.sentences;
            loadRandomSentence(); // Start with a random sentence
        })
        .catch(error => console.error("Error loading sentences:", error));

    function loadRandomSentence() {
        // Pick a random sentence from the array
        const randomIndex = Math.floor(Math.random() * sentences.length);
        const sentence = sentences[randomIndex];
        
        sentenceContainer.textContent = sentence.english;

        // Add period as part of the correct answer
        correctAnswer = [...sentence.correctWords, "."];
        userAnswer = [];
        userAnswerContainer.innerHTML = ""; // Reset user answer display
        wordBank.innerHTML = ""; // Clear the word bank

        // Create the word bank
        const allWords = [...sentence.correctWords, ...sentence.extraWords, "."];
        shuffleArray(allWords);

        allWords.forEach(word => {
            const wordButton = document.createElement("button");
            wordButton.classList.add("buttontight");
            wordButton.textContent = word;
            wordButton.addEventListener("click", () => addWordToAnswer(word));
            wordBank.appendChild(wordButton);
        });
    }

    function addWordToAnswer(word) {
        if (userAnswer.length < correctAnswer.length) {
            userAnswer.push(word);
            const wordSpan = document.createElement("span");
            wordSpan.textContent = word + " ";
            userAnswerContainer.appendChild(wordSpan);
        }
    }

    // Global function to check the user's answer
    window.checkAnswer = function() {
        if (userAnswer.length !== correctAnswer.length) {
            feedback.textContent = "Try adding a bit more before submitting.";
            return;
        }

        if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
            feedback.textContent = "Correct!";
            stars++;
            updateStars();
            setTimeout(() => loadRandomSentence(), 1000); // Load a random sentence after correct answer
        } else {
            feedback.textContent = "Incorrect, try again.";
            resetAnswerArea();
        }
    }

    function updateStars() {
        starsContainer.innerHTML = ""; // Clear any previous stars
        for (let i = 0; i < stars; i++) {
            const star = document.createElement("span");
            star.textContent = "⭐"; // Using Unicode star symbol
            starsContainer.appendChild(star);
        }

        if (stars >= 5) {
            endGame();
        }
    }

    function resetAnswerArea() {
        userAnswer = [];
        userAnswerContainer.innerHTML = ""; // Reset user input display
        wordBank.querySelectorAll("button").forEach(button => {
            button.disabled = false; // Enable all buttons again for retry
        });
    }

    function endGame() {
        submitBtn.style.display = "none"; // Hide submit button
        playAgainBtn.style.display = "block"; // Show play again button
        resetBtn.style.display = "none"; // Hide reset button during game over
        feedback.textContent = "Game Over! You earned " + stars + " stars.";
    }

    function restartGame() {
        stars = 0;
        starsContainer.innerHTML = "";
        feedback.textContent = "";
        submitBtn.style.display = "block"; // Show submit button
        playAgainBtn.style.display = "none"; // Hide play again button
        resetBtn.style.display = "block"; // Show reset button
        loadRandomSentence(); // Start with a random sentence
    }

    // Function to shuffle array (for randomizing word bank)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // Reset button functionality
    resetBtn.addEventListener("click", function() {
        resetAnswerArea(); // Clear current answer and re-enable buttons
    });

    
    deleteBtn.addEventListener("click", function() {
    if (userAnswer.length > 0) {
        userAnswer.pop(); // Remove last word from the array
        userAnswerContainer.removeChild(userAnswerContainer.lastChild); // Remove last word from display
    }
   });
});
