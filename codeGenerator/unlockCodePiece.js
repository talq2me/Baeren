function getQueryParams() {
    const params = {};
    window.location.search.slice(1).split("&").forEach(pair => {
        const [key, value] = pair.split("=");
        if (key && value) params[key] = decodeURIComponent(value);
    });
    return params;
}

// generateCode.js (or dailyCodeGenerator.js)
function generateCode(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    let code = "";
    for (let i = 0; i < 15; i++) {
        const digit = Math.abs((hash + i * 31) % 10);
        code += digit;
        hash = (hash * 31 + digit) | 0;
    }
    return code;
}

function getTodayCodes() {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    return {
        kid1: generateCode("kid1-" + today),
        kid2: generateCode("kid2-" + today),
    };
}

function countVisibleRevealCodeElements() {
    return Array.from(document.querySelectorAll('[data-reveal-code="true"]'))
        .filter(el => el.offsetParent !== null)
        .length;
}

/**
 * Unlocks the next code piece for a kid, only once per day per buttonKey.
 * @param {string} kidId
 * @param {string} buttonKey - unique per button (e.g. index or id)
 */
function unlockNextPiece(kidId, buttonKey) {
    console.log("unlockNextPiece called with", kidId, buttonKey);
    const today = new Date().toISOString().slice(0, 10);
    const unlockKey = `unlocked_${buttonKey}_${kidId}_${today}`;
    if (localStorage.getItem(unlockKey)) return; // Already unlocked today

    const storageKey = `progress_${kidId}_${today}`;
    const codes = getTodayCodes();
    const fullCode = codes[kidId];

    if (!fullCode) {
        showCodePopup && showCodePopup("Error: No code for this kid.");
        return;
    }

    const totalTasks = countVisibleRevealCodeElements();
    let progress = parseInt(localStorage.getItem(storageKey) || "0", 10);

    if (progress >= totalTasks) {
        console.log("All code pieces already unlocked for today.");
        return;
    }

    const pieceSize = Math.ceil(fullCode.length / totalTasks);
    const start = progress * pieceSize;
    const end = Math.min(start + pieceSize, fullCode.length);
    const codePiece = fullCode.slice(start, end);

    // You may want to display the codePiece here, e.g. update the UI

    localStorage.setItem(storageKey, (progress + 1).toString());
    localStorage.setItem(unlockKey, "1");
    updateCodeDisplay(); // <-- This must be present
}

function resetAllProgressIfRequested() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("resetprogress")) {
        // Option 1: Remove only progress/unlocked keys
        Object.keys(localStorage)
            .filter(key => key.startsWith("progress_") || key.startsWith("unlocked_"))
            .forEach(key => localStorage.removeItem(key));

        // Option 2: Remove everything (uncomment if you want a full wipe)
        localStorage.clear();

        // Reset the code display
        const codeDisplay = document.getElementById("codeDisplay");
        if (codeDisplay) {
            codeDisplay.textContent = "Your Secret Code: ****-****-****-****";
        }
        alert("Progress has been reset!");
        // Reload the page without the resetprogress param
        setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("resetprogress");
            window.location.href = url.toString();
        }, 100); // Give the user a moment to see the alert
        // Prevent further code from running in this session
        return true;
    }
    return false;
}

function updateCodeDisplay() {
    const codeDisplay = document.getElementById("codeDisplay");
    if (!codeDisplay) return;
    const kid = codeDisplay.getAttribute("data-kid");
    if (!kid) {
        codeDisplay.textContent = "Your Secret Code: ****";
        return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `progress_${kid}_${today}`;
    let progress = parseInt(localStorage.getItem(storageKey) || "0", 10);

    const codes = getTodayCodes();
    const fullCode = codes[kid];
    const totalTasks = countVisibleRevealCodeElements();

    if (!fullCode || isNaN(progress) || progress === 0 || !totalTasks) {
        codeDisplay.textContent = "Your Secret Code: " + "•".repeat(totalTasks);
    } else {
        let revealed = "";
        for (let i = 0; i < totalTasks; i++) {
            if (i < progress) {
                revealed += fullCode[i] || "•";
            } else {
                revealed += "•";
            }
        }
        codeDisplay.textContent = "Your Secret Code: " + revealed;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (resetAllProgressIfRequested()) return; // Stop further code if reset happened

    updateCodeDisplay(); // <-- Always update code display based on current progress

    const query = getQueryParams();
    const kidId = query.kid;
    const totalTasks = countVisibleRevealCodeElements();


    // New unified handler for all reveal-code elements
    // Get all reveal-code elements in DOM order
    const revealElements = Array.from(document.querySelectorAll('[data-reveal-code="true"]'));

    revealElements.forEach((el, idx) => {
        // For checkboxes, unlock on check
        if (el.type === "checkbox") {
            el.addEventListener('change', function (event) {
                if (event.target.checked) {
                    const codeDisplay = document.getElementById("codeDisplay");
                    const kid = codeDisplay ? codeDisplay.getAttribute("data-kid") : el.getAttribute('data-kid');
                    if (kid) unlockNextPiece(kid, "reveal" + idx);
                }
            });
        } else {
            // For buttons or other elements, unlock on click
            el.addEventListener('click', function () {
                const codeDisplay = document.getElementById("codeDisplay");
                const kid = codeDisplay ? codeDisplay.getAttribute("data-kid") : el.getAttribute('data-kid');
                if (kid) unlockNextPiece(kid, "reveal" + idx);
            });
        }
    });
});

window.unlockNextPiece = unlockNextPiece;


