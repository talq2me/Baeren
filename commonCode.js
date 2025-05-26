function reward(timeInMins) {
    const rewardTime = timeInMins * 60 * 1000; // Convert minutes to milliseconds
  if (typeof fully !== "undefined") {
    fully.startApplication("com.netflix.mediaclient"); // 🚀 Launch Netflix app
    setTimeout(() => {
      fully.startURL();      // 🔁 Go back to your site after 30 min
    }, rewardTime);
  }
}

document.addEventListener('DOMContentLoaded', function() {
    const overrideBtn = document.getElementById('overrideBtn');
    const kid = document.getElementById("codeDisplay")?.getAttribute("data-kid") || "kid1"; // fallback if not set
    overrideBtn.addEventListener('click', function() {
        const pin = prompt("Parent PIN:");
        const correctPin = "1981"; // <-- Change this to your secret PIN!
        if (pin !== correctPin) {
            alert("Sorry, that's not the right PIN.");
            return;
        }
        let mins = prompt("How many extra minutes would you like to grant?");
        mins = parseInt(mins, 10);
        if (isNaN(mins) || mins <= 0) {
            alert("Please enter a valid number of minutes.");
            return;
        }
        // Store override minutes for today
        const today = new Date().toISOString().slice(0, 10);
        const overrideKey = `override_${kid}_${today}`;
        let current = parseInt(localStorage.getItem(overrideKey) || "0", 10);
        localStorage.setItem(overrideKey, (current + mins).toString());
        alert(`Granted ${mins} extra minutes!`);
        updateCodeDisplay();
    });
});
        
        function openNewWindow(url) {
            const w = window.screen.availWidth;
            const h = window.screen.availHeight;
            window.open(
                url,
                "_blank",
                `width=${w},height=${h},left=0,top=0`
            );
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
                document.querySelectorAll(".notmonday").forEach(el => el.style.display = "block");
            } else {
                document.querySelectorAll(".notmonday").forEach(el => el.style.display = "none");
            }

            // Show on Tuesday-Monday (every day except Monday)
            if (today !== "friday") {
                document.querySelectorAll(".notfriday").forEach(el => el.style.display = "block");
            } else {
                document.querySelectorAll(".notfriday").forEach(el => el.style.display = "none");
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
            if (typeof fully !== "undefined" && typeof fully.textToSpeech === "function") {
                // Use Fully Kiosk Browser TTS
                fully.textToSpeech(text, lang);
            } else {
                // Use browser TTS
                let utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = lang;
                utterance.rate = 0.5;
                utterance.pitch = 1;
                utterance.volume = 1;
                window.speechSynthesis.speak(utterance);
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
    
    // Add click event listeners to task buttons
    const taskButtons = document.querySelectorAll('.task-button');
    taskButtons.forEach((button) => {
        const gameUrl = button.getAttribute("data-target-page");

        button.addEventListener("click", function () {
            launchGameInModal(gameUrl);
        });
    });
});

 document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().slice(0, 10);
    const storedDate = localStorage.getItem('lastCheckboxReset');

    if (storedDate !== today) {
        // It's a new day — reset checkboxes
        document.querySelectorAll('.chore-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Update the stored date
        localStorage.setItem('lastCheckboxReset', today);
    }
});
        

          // Function to launch the game in the modal
            function launchGameInModal(gameUrl) {
                const iframe = document.getElementById("iframeContent");
                const modal = document.getElementById("iframeModal");
        
        
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
                    launchGameInModal(gameUrl);
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
                if (event.data && event.data.type === "closeModal") {
                    const modal = document.getElementById("iframeModal");
                    if (modal.style.display === "block") {
                        console.log("Closing Modal Fast");
                        setTimeout(handleModalClose, 0); // Close the modal immediately
                    }
                }
            });
