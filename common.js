        // Function to go back to the previous page
        function goBack() {
            if (document.referrer) {
                window.location.href = document.referrer; // Takes you back to the referring page
            } else {
                window.history.back(); // Fallback method
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

        function readText(text) {
            let speech = new SpeechSynthesisUtterance(text);
            speech.lang = "en-US"; // You can change this for other languages (e.g., "fr-FR" for French)
            
            // Adjust the rate (speed) of the speech (1 is normal speed, 0.5 is slower)
            utterance.rate = 0.5;  // Set it to a value less than 1 for slower speech

            // Optionally, you can adjust the pitch and volume as well
            utterance.pitch = 1;   // Normal pitch, range from 0 to 2
            utterance.volume = 1;  // Volume, range from 0 to 1
            window.speechSynthesis.speak(speech);
        }