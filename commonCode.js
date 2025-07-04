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
        //send usage report to parent
        window.location.href = "intent://sendusagereport";

    }
}


function launchApp(appname, timeInMins) {
    // Launch app via intent to communicate with Android app for whitelist management
    window.location.href = "intent://launch?pkg=" + appname + "&minutes=" + timeInMins + "#Intent;scheme=http;end";
    //send usage report to parent
    window.location.href = "intent://sendusagereport";
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



document.addEventListener("DOMContentLoaded", function () {
    // Hide Back and Home buttons if running in Android WebView or Fully Kiosk Browser
    function isAndroidWebView() {
        // Check for Fully Kiosk Browser
        if (typeof fully !== "undefined") {
            return true;
        }
        
        // Check for Android WebView user agent
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('android') && userAgent.includes('wv')) {
            return true;
        }
        
        // Check for Android WebView specific features
        if (window.Android && typeof window.Android !== 'undefined') {
            return true;
        }
        
        // Check for Android intent support
        if (typeof window.AndroidInterface !== 'undefined') {
            return true;
        }
        
        return false;
    }
    
    if (isAndroidWebView()) {
        document.querySelectorAll("button[onclick*='goBack()'], button[onclick*='history.back()'], button[onclick*=\"location.href='../index.html'\"]").forEach(btn => {
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
            requestParentPin(function(userPIN) {
                if (userPIN !== pin) {
                    alert("Sorry, that's not the right PIN.");
                    return;
                }
                requestRewardMinutes(function(mins) {
                    if (mins === null) return;
                    const today = new Date().toISOString().slice(0, 10);
                    const overrideKey = `override_${kid}_${today}`;
                    let current = parseInt(localStorage.getItem(overrideKey) || "0", 10);
                    localStorage.setItem(overrideKey, (current + mins).toString());
                    alert(`Granted ${mins} extra minutes!`);
                    updateCodeDisplay();
                });
            });
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
                    updateBonusWorkVisibility();
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

let startTime = Date.now();

window.addEventListener("beforeunload", () => {
    const duration = Math.round((Date.now() - startTime) / 1000); // in seconds
    const page = window.location.pathname.split("/").pop();
    if (window.AndroidUsageTracker) {
        window.AndroidUsageTracker.logVisit(page, duration);
    }
});

// --- Generalized Number Pad Modal ---
function showNumberPadPrompt({ title, maxLength = 3, onSubmit, allowZero = false }) {
    // Remove any existing modal
    const oldModal = document.getElementById('pinPadModal');
    if (oldModal) oldModal.remove();

    // Create modal elements
    const modal = document.createElement('div');
    modal.id = 'pinPadModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div style="background:#fff;padding:24px 16px 16px 16px;border-radius:12px;box-shadow:0 2px 16px #0003;min-width:260px;display:flex;flex-direction:column;align-items:center;position:relative;">
        <button id="pinPadCancel" aria-label="Cancel" style="position:absolute;top:8px;right:8px;font-size:1.3em;background:none;border:none;cursor:pointer;">✖</button>
        <h2 style="margin:0 0 12px 0;font-size:1.2em;">${title}</h2>
        <input id="pinPadInput" type="password" inputmode="numeric" maxlength="${maxLength}" style="font-size:2em;text-align:center;width:100%;margin-bottom:12px;letter-spacing:0.3em;" readonly />
        <div id="pinPadButtons" style="display:grid;grid-template-columns:repeat(3,60px);gap:8px;margin-bottom:12px;"></div>
        <div style="display:flex;gap:8px;width:100%;justify-content:center;">
          <button id="pinPadDelete" style="padding:8px 16px;font-size:1.3em;">⌫</button>
          <button id="pinPadEnter" style="padding:8px 16px;font-size:1.3em;">⏎</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#pinPadInput');
    const buttons = modal.querySelector('#pinPadButtons');
    const deleteBtn = modal.querySelector('#pinPadDelete');
    const enterBtn = modal.querySelector('#pinPadEnter');
    const cancelBtn = modal.querySelector('#pinPadCancel');

    // Create number buttons
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style.cssText = 'font-size:1.3em;padding:12px 0;';
        btn.onclick = () => {
            if (input.value.length < maxLength) input.value += i;
        };
        buttons.appendChild(btn);
    }
    // Zero button
    const zeroBtn = document.createElement('button');
    zeroBtn.textContent = '0';
    zeroBtn.style.cssText = 'font-size:1.3em;padding:12px 0;grid-column:2/3;';
    zeroBtn.onclick = () => {
        if (input.value.length < maxLength) input.value += '0';
    };
    buttons.appendChild(document.createElement('div'));
    buttons.appendChild(zeroBtn);
    buttons.appendChild(document.createElement('div'));

    deleteBtn.onclick = () => {
        input.value = input.value.slice(0, -1);
    };
    enterBtn.onclick = () => {
        const val = input.value;
        if (val.length > 0 && (allowZero || parseInt(val, 10) > 0)) {
            document.body.removeChild(modal);
            onSubmit(val);
        }
    };
    cancelBtn.onclick = () => {
        document.body.removeChild(modal);
        onSubmit(null);
    };
}

// --- PIN Prompt Logic ---
function requestParentPin(onPinEntered) {
    if (window.Android && typeof window.Android.showPinPrompt === 'function') {
        // Call Android's PIN prompt
        window.onPinResult = function(pin) {
            onPinEntered(pin);
        };
        window.Android.showPinPrompt();
    } else {
        // Fallback: show custom HTML PIN pad
        showHtmlPinPad(onPinEntered);
    }
}

function showHtmlPinPad(onPinEntered) {
    showNumberPadPrompt({
        title: "Enter Parent PIN",
        maxLength: 8,
        onSubmit: onPinEntered
    });
}

function requestRewardMinutes(onMinutesEntered) {
    showNumberPadPrompt({
        title: "How many extra minutes?",
        maxLength: 3,
        onSubmit: (val) => {
            if (val === null) return onMinutesEntered(null);
            const mins = parseInt(val, 10);
            if (isNaN(mins) || mins <= 0) {
                alert("Please enter a valid number of minutes.");
                return requestRewardMinutes(onMinutesEntered); // Retry
            }
            onMinutesEntered(mins);
        }
    });
}


function updateBonusWorkVisibility() {
    // Count required buttons and checkboxes
    const requiredButtons = document.querySelectorAll('.button.required[data-reveal-code="true"]');
    const requiredCheckboxes = document.querySelectorAll('input[type="checkbox"].required[data-reveal-code="true"]');
    const allRequired = [...requiredButtons, ...requiredCheckboxes];

    // Check if all required tasks are completed
    const allCompleted = allRequired.every(el => {
        if (el.tagName === 'BUTTON') {
            return el.classList.contains('completed');
        } else if (el.type === 'checkbox') {
            return el.checked;
        }
        return false;
    });

    // Show/hide the bonus work section
    const bonusSection = document.getElementById('bonusWork');
    if (bonusSection) {
        bonusSection.style.display = allCompleted ? 'block' : 'none';
    }
}