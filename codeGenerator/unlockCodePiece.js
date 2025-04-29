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


// unlockCodePiece.js
function unlockNextPiece(kidId) {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const storageKey = `progress_${kidId}_${today}`; // Daily unique
    const codes = getTodayCodes();  // Get today's fresh codes
    const fullCode = codes[kidId];  // e.g., today's 15-digit code
    const flaggedTasks = document.querySelectorAll(`[data-reveal-code="true"][data-kid="${kidId}"]`);
    const totalTasks = flaggedTasks.length;
    
    if (!fullCode) {
        console.error(`No code found for ${kidId}`);
        showCodePopup("Error: No code for this kid.");
        return;
    }

    let progress = parseInt(localStorage.getItem(storageKey) || "0", 10);

    if (progress >= totalTasks) {
        showCodePopup("You unlocked the full code: " + fullCode);
        return;
    }

    let pieceSize = 1;
    if (progress === totalTasks - 1) {
        pieceSize = 15 - (totalTasks - 1); // Last task gets rest
    }

    const start = progress;
    const end = start + pieceSize;
    const codePiece = fullCode.slice(start, end);

    showCodePopup("Your code piece: " + codePiece);

    localStorage.setItem(storageKey, (progress + 1).toString());
}


// Popup message function for feedback
function showCodePopup(message) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    overlay.style.zIndex = "9998";
    document.body.appendChild(overlay);

    // Create modal
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "#fff";
    modal.style.color = "#000";
    modal.style.padding = "20px 30px";
    modal.style.borderRadius = "10px";
    modal.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    modal.style.zIndex = "9999";
    modal.style.textAlign = "center";

    // Message
    const msg = document.createElement("div");
    msg.innerText = message;
    msg.style.marginBottom = "20px";
    modal.appendChild(msg);

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✖ Close";
    closeBtn.style.padding = "8px 16px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.backgroundColor = "#333";
    closeBtn.style.color = "#fff";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "5px";
    closeBtn.onclick = function () {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
    };
    modal.appendChild(closeBtn);

    document.body.appendChild(modal);
}




document.addEventListener('DOMContentLoaded', function () {
    console.log("DOMContentLoaded fired");

    // Handle task button click
    document.querySelectorAll('.task-button').forEach(element => {
        element.addEventListener('click', () => {
            console.log("Task button clicked"); // Debugging log
            const kid = element.getAttribute('data-kid');
            const page = element.getAttribute('data-target-page');

            if (kid) {
                console.log(`Unlocking next piece for ${kid}`);  // Debugging log
                unlockNextPiece(kid);
            }
            if (page) {
                console.log(`Opening page: ${page}`); // Debugging log
                openModalPage(page);
            }
        });
    });

    // Handle checkbox change
    document.querySelectorAll('.chore-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            console.log("Checkbox changed"); // Debugging log
            if (event.target.checked) { // only when checking ON
                const kid = checkbox.getAttribute('data-kid');
                console.log(`Chore completed for ${kid}`);  // Debugging log
                if (kid) {
                    unlockNextPiece(kid);
                }
            }
        });
    });
});