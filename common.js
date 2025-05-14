// Function to go back to the previous page
        function goBack() {
            const previousPage = sessionStorage.getItem('previousPage');
        
            if (document.referrer) {
                window.location.href = document.referrer;
            } else if (previousPage) {
                window.location.href = previousPage;
            } else if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/'; // Fallback to homepage or a default
            }
        }

        document.addEventListener("DOMContentLoaded", function () {
            const checkboxes = document.querySelectorAll("input[type='checkbox']");
            
            // Load saved state from localStorage
            checkboxes.forEach(checkbox => {
                const isChecked = localStorage.getItem(checkbox.id) === "true";
                checkbox.checked = isChecked;
                
                checkbox.addEventListener("change", () => {
                    localStorage.setItem(checkbox.id, checkbox.checked);
                });
            });
        });

        document.addEventListener("DOMContentLoaded", function () {
            const checkboxes = document.querySelectorAll(".chore-checkbox");
            const secretCodeContainer = document.getElementById("secretCodeContainer");
            const secretCodeParts = ["A", "B", "C", "D", "E"]; // Replace with your actual secret code parts
            let revealedParts = new Set(); // Track which checkboxes have revealed their part
        
            checkboxes.forEach((checkbox, index) => {
                checkbox.addEventListener("change", function () {
                    if (checkbox.checked && !revealedParts.has(index)) {
                        // Reveal the next part of the code
                        const codePart = document.createElement("span");
                        codePart.textContent = secretCodeParts[index] || "X"; // Fallback if parts run out
                        secretCodeContainer.appendChild(codePart);
        
                        // Mark this checkbox as having revealed its part
                        revealedParts.add(index);
                    }
                });
            });
        });
        
        
        function loadIframe(url) {
            window.location.href = `../iframePage/iframePage.html?url=${encodeURIComponent(url)}`;
        }

        function openNewWindow(url) {
            window.open(url, "_blank", "width=1000,height=1200");
        }

        function showControlsForDay() {
            let days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            let today = days[new Date().getDay()];

            // Show/hide based on specific days
            document.querySelectorAll(`[class*="day-"]`).forEach(el => {
                if (el.classList.contains(`day-${today}`)) {
                    el.style.display = "block";
                } else {
                    el.style.display = "none";
                }
            });

            // Show only on weekdays (Monday-Friday)
            if (["monday", "tuesday", "wednesday", "thursday", "friday"].includes(today)) {
                document.querySelectorAll(".weekday-only").forEach(el => el.style.display = "block");
            } else {
                document.querySelectorAll(".weekday-only").forEach(el => el.style.display = "none");
            }

            // Show on Tuesday-Monday (every day except Monday)
            if (today !== "monday") {
                document.querySelectorAll(".tuesday-monday").forEach(el => el.style.display = "block");
            } else {
                document.querySelectorAll(".tuesday-monday").forEach(el => el.style.display = "none");
            }

            // Show only on Sundays and Tuesdays
            if (["sunday", "tuesday"].includes(today)) {
                document.querySelectorAll(".sunday-tuesday").forEach(el => el.style.display = "block");
            } else {
                document.querySelectorAll(".sunday-tuesday").forEach(el => el.style.display = "none");
            }

            // Show only on Sundays and Mondays
            if (["sunday", "monday"].includes(today)) {
                document.querySelectorAll(".sunday-monday").forEach(el => el.style.display = "block");
            } else {
                document.querySelectorAll(".sunday-monday").forEach(el => el.style.display = "none");
            }
        }

        document.addEventListener("DOMContentLoaded", showControlsForDay);

        function readText(text, lang = "en-US") {
            let utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;        // Use passed-in language or default to "en-US"
            utterance.rate = 0.5;         // Slower speech
            utterance.pitch = 1;          // Normal pitch
            utterance.volume = 1;         // Full volume
        
            window.speechSynthesis.speak(utterance);
        }


        let correctCount = 0;
        let questionData = [];
        let currentQuestionData = {};



        document.addEventListener('DOMContentLoaded', () => {
            const today = new Date().toISOString().slice(0, 10);
            const storedDate = localStorage.getItem('lastCheckboxReset');
        
            const jsonConfig = document.getElementById('json-config');
            const jsonPath = jsonConfig ? jsonConfig.getAttribute('data-json') : null;
        
            if (storedDate !== today) {
                // It's a new day — reset checkboxes
                document.querySelectorAll('.chore-checkbox').forEach(checkbox => {
                    checkbox.checked = false;
                });
        
                // Update the stored date
                localStorage.setItem('lastCheckboxReset', today);
            }
        
            if (jsonPath) {
                fetch(jsonPath)
                    .then(response => response.json())
                    .then(data => {
                        console.log("Loaded JSON data:", data);
                        questionData = data;
                        initializeGame(data);
                        nextRound();
                    })
                    .catch(error => console.error("Error loading JSON:", error));
            } else {
                console.log("No game JSON needed on this page.");
            }
        });
        

        // Function to move to the next round
        function nextRound() {
            currentQuestionData = getRandomQuestion();
            updateChoices(currentQuestionData.choicesList);
            document.getElementById("messageContainer").innerHTML = "";
            const playButton = document.getElementById("replayBtn");
            playButton.innerHTML = "&#9654; Play"; // Play icon
            playButton.setAttribute("onclick", "readText(\"" + currentQuestionData.correctWord + "\")");
        }

            // Function to get a random word object from the JSON data
        function getRandomQuestion() {
            return questionData[Math.floor(Math.random() * questionData.length)];
        }

        document.addEventListener("DOMContentLoaded", function () {
            let currentKidId = null; // Track the current kid ID for the active game
            let totalTasks = 0; // Track the total number of tasks for the current kid
        
            // Function to launch the game in the modal
            function launchGameInModal(gameUrl, kidId) {
                const iframe = document.getElementById("iframeContent");
                const modal = document.getElementById("iframeModal");
        
                currentKidId = kidId;
                totalTasks = document.querySelectorAll(`[data-reveal-code="true"][data-kid="${kidId}"]`).length;
        
                iframe.src = gameUrl;
                modal.style.display = "block";
            }
        
            // Function to handle modal close
            function handleModalClose() {
                const modal = document.getElementById("iframeModal");
                modal.style.display = "none";
            
                const today = new Date().toISOString().slice(0, 10);
                const codes = getTodayCodes(); // Assuming getTodayCodes() is defined elsewhere
                const fullCode = codes.kid1; // Replace 'kid1' with the appropriate kid ID if needed
            
                // Load revealed parts from localStorage
                const storageKey = `revealedParts_${today}`;
                let revealedParts = parseInt(localStorage.getItem(storageKey) || "0", 10);
            
                // Increment revealed parts if the modal was closed after completing a task
                revealedParts = Math.min(revealedParts + 1, document.querySelectorAll(".task-button[data-reveal-code='true']").length);
            
                // Save the updated revealed parts to localStorage
                localStorage.setItem(storageKey, revealedParts);
            
                // Update the code display
                const codeDisplay = document.getElementById("codeDisplay");
                if (codeDisplay) {
                    updateCodeDisplay(fullCode, revealedParts, document.querySelectorAll(".task-button[data-reveal-code='true']").length);
                }
            
                console.log(`Modal closed. Updated revealed parts: ${revealedParts}`);
            }
        
            // Attach event listeners to all task buttons
            document.querySelectorAll(".task-button[data-target-page]").forEach((button) => {
                const gameUrl = button.getAttribute("data-target-page");
                const kidId = button.getAttribute("data-kid");
        
                button.addEventListener("click", function () {
                    launchGameInModal(gameUrl, kidId);
                });
            });
        
            // Attach the modal close handler
            const closeModalButton = document.querySelector("#iframeModal button[onclick='closeModal()']");
            if (closeModalButton) {
                closeModalButton.removeEventListener("click", handleModalClose); // Ensure no duplicate listeners
                closeModalButton.addEventListener("click", handleModalClose);
            }
        
            // Listen for game completion messages
            window.addEventListener("message", function (event) {
                if (event.data && event.data.type === "gameCompleted") {
                    const modal = document.getElementById("iframeModal");
                    if (modal.style.display === "block") {
                        console.log("Game completed. Closing modal in 2 seconds...");
                        setTimeout(handleModalClose, 2000); // Close the modal after 2 seconds
                    }
                }
            });
        });

document.addEventListener("DOMContentLoaded", function () {
    const checkboxes = document.querySelectorAll(".chore-checkbox");
    const taskButtons = document.querySelectorAll(".task-button[data-reveal-code='true']");
    const today = new Date().toISOString().slice(0, 10);
    const codes = getTodayCodes(); // Assuming getTodayCodes() is defined elsewhere
    const fullCode = codes.kid1; // Replace 'kid1' with the appropriate kid ID if needed

    // Debug: Log today's full code
    console.log("Today's full code:", fullCode);

    // Check for reset parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetCode = urlParams.get("resetCode");

    // LocalStorage key for revealed parts
    const storageKey = `revealedParts_${today}`;
    let revealedParts = 0;

    if (resetCode === "true") {
        // Reset revealed parts if resetCode is passed
        localStorage.removeItem(storageKey);
        console.log("Code progress has been reset.");
    } else {
        // Load revealed parts from localStorage
        revealedParts = parseInt(localStorage.getItem(storageKey) || "0", 10);
        console.log(`Loaded revealed parts from storage: ${revealedParts}`);
    }

    // Initialize the code display
    const codeDisplay = document.getElementById("codeDisplay");
    if (codeDisplay) {
        updateCodeDisplay(fullCode, revealedParts, checkboxes.length + taskButtons.length);
    }

    const revealedCheckboxes = new Set(); // Track which checkboxes have revealed a code part
    const revealedButtons = new Set(); // Track which buttons have revealed a code part

    // Add change event listeners to checkboxes
    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener("change", function () {
            if (checkbox.checked && !revealedCheckboxes.has(checkbox.id)) {
                // Debug: Log which part this checkbox reveals
                console.log(`Checkbox checked: Revealing part ${index + 1} of the code`);

                // Update the code display
                revealedParts = Math.min(revealedParts + 1, checkboxes.length + taskButtons.length);
                updateCodeDisplay(fullCode, revealedParts, checkboxes.length + taskButtons.length);

                // Save progress to localStorage
                localStorage.setItem(storageKey, revealedParts);
                console.log(`Updated revealed parts in storage: ${revealedParts}`);

                // Mark this checkbox as having revealed its part
                revealedCheckboxes.add(checkbox.id);
            }
        });
    });

    // Add click event listeners to task buttons
    taskButtons.forEach((button) => {
        const gameUrl = button.getAttribute("data-target-page");
        const kidId = button.getAttribute("data-kid");

        button.addEventListener("click", function () {
            launchGameInModal(gameUrl, kidId);
        });
    });
});

/**
 * Updates the code display to show revealed parts and mask the rest.
 * @param {string} fullCode - The full code to display.
 * @param {number} revealedParts - The number of parts revealed so far.
 * @param {number} totalParts - The total number of parts in the code.
 */
function updateCodeDisplay(fullCode, revealedParts, totalParts) {
    const partSize = Math.ceil(fullCode.length / totalParts);
    let displayCode = "";

    for (let i = 0; i < totalParts; i++) {
        if (i < revealedParts) {
            // Reveal this part
            displayCode += fullCode.slice(i * partSize, (i + 1) * partSize);
        } else {
            // Mask this part
            displayCode += "*".repeat(partSize);
        }

        // Add a dash between parts (but not at the end)
        if (i < totalParts - 1) {
            displayCode += "-";
        }
    }

    // Update the code display element
    const codeDisplay = document.getElementById("codeDisplay");
    if (codeDisplay) {
        codeDisplay.textContent = displayCode;
    }
}