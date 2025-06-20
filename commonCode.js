let pin = "1981"; // Parent PIN for unlocking features

let lastTaskButtonIdx = null;
let lastTaskButtonKid = null;
let lastTaskButtonStartTime = null;

if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('/Baeren/sw.js', { updateViaCache: 'none', scope: '/Baeren/' })
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker error:', err.message));
}

function rewardold(timeInMins) {
    const rewardTime = timeInMins * 60 * 1000;
    if (typeof fully !== "undefined") {
        fully.startApplication("com.netflix.mediaclient");
        setTimeout(() => {
            if (typeof fully.killApp === "function") {
                fully.killApp("com.netflix.mediaclient"); // Kill Netflix app
            }
            if (typeof fully.bringToFront === "function") {
                fully.bringToFront(); // Bring Fully to front
            }
            fully.startURL(); // Go back to your site
        }, rewardTime);
    } else {
        console.warn("Fully Kiosk is not available.");

    }
}


function reward(timeInMins) {
    if (typeof fully !== "undefined") {
        if (timeInMins === 15) {
            fully.startApplication("com.talq2me.netflixreward15"); // Launch Netflix Reward 15 app
        } else if (timeInMins === 30) {
            fully.startApplication("com.talq2me.netflixreward30"); // Launch Netflix Reward 30 app
        } else {
            alert("Please choose a chunk of 15 or 30 minutes."); // alert
        }
    } else {
        
        // Launch Netflix app via intent if not in Fully Kiosk
        window.location.href = "intent://launch?pkg=com.netflix.mediaclient&minutes=" + timeInMins + "#Intent;scheme=http;end";

    }
}


function launchApp(appname, timeInMins) {
    if (typeof fully !== "undefined") {
            fully.startApplication(appname); // Launch app
    } else {
        // Launch app via intent if not in Fully Kiosk
        window.location.href = "intent://launch?pkg=" + appname + "&minutes=" + timeInMins + "#Intent;scheme=http;end";
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* function rewardTasker(minutes)  {
  //  if (typeof fully !== "undefined") {
    alert('Before fetch');

        // Fully Kiosk intent URL for launching Tasker task
        const intentUrl = 'intent://#Intent;package=net.dinglisch.android.taskerm;action=net.dinglisch.android.tasker.ACTION_TASK;extra=task:NetflixReward;extra=par1:' + encodeURIComponent(minutes) + ';end';
        window.location.href = intentUrl;
        alert('After fetch');

/*     fetch('http://192.168.3.146:1821/netflixreward')//?minutes=' + minutes')
        .then(response => {
            console.log('Netflix reward triggered');
            alert('After fetch - Success');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('After fetch - Error: ' + error.message);
        }); */


      /* fully.runShellCommand(
        "am broadcast -a com.baerened.LAUNCH_NETFLIX --es minutes " + minutes,
        false  // runAsRoot
     ); */
     /*   fully.sendIntent(
        "com.baerened.LAUNCH_NETFLIX", // this must match Tasker profile
        "", "", "", 
        "minutes=" + minutes
      );  */
/*       fetch("http://127.0.0.1:8765/trigger_task?minutes=" + minutes)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error)); */
/*   fully.startIntent(
        "com.baerened.LAUNCH_NETFLIX", // Intent URI (package and activity)
        "android.intent.action.VIEW",   // Intent action
        "text/plain",                   // MIME type
        "Hello from Fully Kiosk!",      // Data (optional)
        "minutes=" + minutes,           // Extras (optional)
        false                           // Wait for result (optional)
    ); */


   /*  } else {
      alert("Fully interface not available");
    } 
  } 
    */
/* 

function rewardTaskerOld(timeInMins) {
            // Define the Tasker task name and reward time
            const taskName = 'NetflixReward';
            const rewardTime = timeInMins;
            // Build the intent URL with extras
            const intentUrl = `tasker://secondary?task=${encodeURIComponent(taskName)}&rewardMinutes=${encodeURIComponent(rewardTime)}`;
            document.getElementById('status').innerText = 
            `Great job! Awarded ${minutes} minutes of Netflix time!`;
            window.location.href = intentUrl; // Send intent to Tasker

 }


//this one only works on non android tablets because netflix web will not work on android tablets.
function rewardNetflixWeb(timeInMins) {
    const rewardTime = timeInMins * 60 * 1000;
    // Open Netflix in a new tab/window
    const netflixWindow = window.open("intent://#Intent;package=com.talq2me.netflixreward;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end", "_blank");
    
    setTimeout(() => {
        // Try to close the Netflix tab/window if possible
        if (netflixWindow && !netflixWindow.closed) {
            netflixWindow.close();
        }
        // Regain focus on this page
        window.focus();

        // Optionally, reload the startURL (if using Fully Kiosk or want to force a page)
        if (typeof fully !== "undefined" && typeof fully.startURL === "function") {
            fully.startURL();
        } else {
            // As a fallback, reload the current page
            // window.location.reload();
        }
    }, rewardTime);
}

function pokemonGo() {
    const rewardTime = 60 * 60 * 1000; // Convert 60 minutes to milliseconds
    if (typeof fully !== "undefined") {
        fully.startApplication("com.nianticlabs.pokemongo"); // 🚀 Launch pokemon go app
        setTimeout(() => {
            fully.startURL();      // 🔁 Go back to your site after timeInMins min
        }, rewardTime);
    } else {
        console.warn("Fully Kiosk is not available.");
    }
}

function exitFullyKiosk(){
    if (typeof fully !== "undefined") {
        
        const userPIN = prompt("Enter Parent PIN:");

        if (userPIN !== pin) {
            alert("Sorry, that's not the right PIN.");
            return;
        }
        fully.unlockKiosk();
        fully.enableMaintenanceMode();
        //
        //fully.exitKioskMode();
    } else {
        console.warn("Fully Kiosk is not available.");
    }
}

function resumeFullyKiosk() {
    if (typeof fully !== "undefined") {
        fully.disableMaintenanceMode();
        fully.lockKiosk();
        //fully.setDefaultLauncher();
        //fully.startURL(); // Go back to your site
    } else {
        console.warn("Fully Kiosk is not available.");
    }
}

function kioskSettings() {
    if (typeof fully !== "undefined") {
        const userPIN = prompt("Enter Parent PIN:");

        if (userPIN !== pin) {
            alert("Sorry, that's not the right PIN.");
            return;
        }
        fully.openSettings();
    } else {
        console.warn("Fully Kiosk is not available.");
    }
} */


document.addEventListener("DOMContentLoaded", function () {
    // Hide Back and Home buttons if running in Fully Kiosk Browser
    if (typeof fully !== "undefined") {
        document.querySelectorAll("button[onclick*='goBack()'], button[onclick*=\"location.href='../index.html'\"]").forEach(btn => {
            btn.style.display = "none";
        });
    }

    // Reset checkboxes for new day BEFORE restoring their state
    const today = new Date().toISOString().slice(0, 10);
    const storedDate = localStorage.getItem('lastCheckboxReset');
    if (storedDate !== today) {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
            localStorage.removeItem(checkbox.id);
        });
        localStorage.setItem('lastCheckboxReset', today);
    }

    // Now restore checkbox state and attach change listeners
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach(checkbox => {
        const isChecked = localStorage.getItem(checkbox.id) === "true";
        checkbox.checked = isChecked;
        checkbox.addEventListener("change", () => {
            localStorage.setItem(checkbox.id, checkbox.checked);
        });
    });

    // Show/hide controls for the day
    showControlsForDay();

    // Attach event listeners to all task buttons
    document.querySelectorAll(".task-button[data-target-page]").forEach((button) => {
        const kidId = button.getAttribute("data-kid") || (document.getElementById("codeDisplay")?.getAttribute("data-kid") || "kid1");
        const key = button.getAttribute("data-key");
        button.addEventListener("click", function () {
            console.log("Task button clicked:", kidId, key);
            lastTaskButtonIdx = key;
            lastTaskButtonKid = kidId;
            launchGameInModal(button.getAttribute("data-target-page"));
        });
    });

    // Attach the modal close handler
    const closeModalButton = document.querySelector("#iframeModal button[onclick='closeModal()']");
    if (closeModalButton) {
        closeModalButton.removeEventListener("click", handleModalClose);
        closeModalButton.addEventListener("click", handleModalClose);
    }

    // Override button logic
    const overrideBtn = document.getElementById('overrideBtn');
    const kid = document.getElementById("codeDisplay")?.getAttribute("data-kid") || "kid1";
    if (overrideBtn) {
        overrideBtn.addEventListener('click', function () {
            const userPIN = prompt("Parent PIN:");
            if (userPIN !== pin) {
                alert("Sorry, that's not the right PIN.");
                return;
            }
            let mins = prompt("How many extra minutes would you like to grant?");
            mins = parseInt(mins, 10);
            if (isNaN(mins) || mins <= 0) {
                alert("Please enter a valid number of minutes.");
                return;
            }
            const today = new Date().toISOString().slice(0, 10);
            const overrideKey = `override_${kid}_${today}`;
            let current = parseInt(localStorage.getItem(overrideKey) || "0", 10);
            localStorage.setItem(overrideKey, (current + mins).toString());
            alert(`Granted ${mins} extra minutes!`);
            updateCodeDisplay();
        });
    }

/*     // Checkbox state logic
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach(checkbox => {
        const isChecked = localStorage.getItem(checkbox.id) === "true";
        checkbox.checked = isChecked;
        checkbox.addEventListener("change", () => {
            localStorage.setItem(checkbox.id, checkbox.checked);
        });
    }); */

    // Non-task required buttons that reveal code
    const revealButtons = Array.from(document.querySelectorAll('.button.required[data-reveal-code="true"]'));
    revealButtons.forEach((button) => {
        if (button.classList.contains('non-task')) {
            const kidId = button.getAttribute("data-kid") || (document.getElementById("codeDisplay")?.getAttribute("data-kid") || "kid1");
            const key = button.getAttribute("data-key");
            button.addEventListener("click", function () {
                if (typeof unlockNextPiece === "function" && key) {
                    unlockNextPiece(kidId, key);
                }
            });
        }
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
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = days[new Date().getDay()];

    document.querySelectorAll("[data-show-days]").forEach(el => {
        const showDays = el.getAttribute("data-show-days")
            .split(",")
            .map(d => d.trim().toLowerCase());
        if (showDays.includes(today)) {
            el.style.display = "block";
        } else {
            el.style.display = "none";
        }
    });
}


let ttsQueue = [];
let ttsInProgress = false;

function enqueueTTS(text, lang, onEnd = null) {
    if (lang === "en-US") lang = "en";
    if (lang === "fr-FR") lang = "fr";
    console.log(`Enqueuing TTS: text="${text}", lang="${lang}"`);
    ttsQueue.push({ text, lang, onEnd });
    processTTSQueue();
}

function processTTSQueue() {
    if (ttsInProgress || ttsQueue.length === 0) {
        console.log(`Queue processing skipped: inProgress=${ttsInProgress}, queueLength=${ttsQueue.length}`);
        return;
    }

    const { text, lang, onEnd } = ttsQueue.shift();
    ttsInProgress = true;
    console.log(`Processing TTS: text="${text}", lang="${lang}"`);

    try {
        if (typeof AndroidTTS !== 'undefined') {
            console.log('Using AndroidTTS bridge');
            window.onTTSFinish = () => {
                console.log(`TTS finished for text="${text}"`);
                ttsInProgress = false;
                if (typeof onEnd === 'function') {
                    console.log('Calling onEnd callback');
                    try {
                        onEnd();
                    } catch (e) {
                        console.error('Error in onEnd callback:', e);
                    }
                }
                console.log('Advancing TTS queue');
                processTTSQueue();
            };
            AndroidTTS.speak(text, lang);
        } else {
            console.log('Falling back to Web Speech API');
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = lang;
            utter.rate = 0.8;
            utter.pitch = 1;
            utter.volume = 1;
            utter.onend = () => {
                console.log(`Web Speech finished for text="${text}"`);
                ttsInProgress = false;
                if (typeof onEnd === 'function') {
                    console.log('Calling onEnd callback');
                    try {
                        onEnd();
                    } catch (e) {
                        console.error('Error in onEnd callback:', e);
                    }
                }
                console.log('Advancing TTS queue');
                processTTSQueue();
            };
            speechSynthesis.speak(utter);
        }
    } catch (e) {
        console.error('Error in processTTSQueue:', e);
        ttsInProgress = false;
        processTTSQueue(); // Attempt to recover
    }
}




// Update readText to store callback like before
function readText(text, lang = "en-US", onEnd = null) {
  if (typeof fully !== "undefined" && typeof fully.textToSpeech === "function") {
    if (lang === "en-US") lang = "en";
    if (lang === "fr-FR") lang = "fr";
    fully.textToSpeech(text, lang);
    if (typeof onEnd === "function") {
      const duration = Math.min(Math.max(text.length * 60, 1000), 6000);
      setTimeout(onEnd, duration);
    }
  } else if (typeof AndroidTTS !== 'undefined') {
    if (lang === "en-US") lang = "en";
    if (lang === "fr-FR") lang = "fr";
    
    AndroidTTS.speak(text, lang);
  } else {
    window.speechSynthesis.cancel();
    let utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.8;
    utter.pitch = 1;
    utter.volume = 1;
    if (typeof onEnd === "function") utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
  }
}


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
    lastTaskButtonStartTime = null;
    // Optionally unlock on close if needed (already handled by gameCompleted)
}

// Listen for game completion messages
window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "gameCompleted") {
        const modal = document.getElementById("iframeModal");
        console.log("Game completed message received");
        if (modal.style.display === "block") {
            console.log("modal is open, unlocking next piece");
            if (typeof unlockNextPiece === "function" && lastTaskButtonKid !== null && lastTaskButtonIdx !== null) {
                unlockNextPiece(lastTaskButtonKid, lastTaskButtonIdx);
                console.log(`Unlocking next piece for kid: ${lastTaskButtonKid}, key: ${lastTaskButtonIdx}`);
            }
            setTimeout(handleModalClose, 2000);
        }
    }
    if (event.data && event.data.type === "closeModal") {
        const modal = document.getElementById("iframeModal");
        if (modal.style.display === "block") {
            console.log("Closing Modal Fast");
            setTimeout(handleModalClose, 0);
        }
    }
});
