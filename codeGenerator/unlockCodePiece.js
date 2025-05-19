function getQueryParams() {
    const params = {};
    window.location.search.slice(1).split("&").forEach(pair => {
        const [key, value] = pair.split("=");
        if (key && value) params[key] = decodeURIComponent(value);
    });
    return params;
}

function generateCode(seed, length) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    let code = "";
    for (let i = 0; i < length; i++) {
        const digit = Math.abs((hash + i * 31) % 10);
        code += digit;
        hash = (hash * 31 + digit) | 0;
    }
    return code;
}

function getTodayCodes(codeLength) {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    return {
        kid1: generateCode("kid1-" + today, codeLength),
        kid2: generateCode("kid2-" + today, codeLength),
    };
}

function countVisibleRevealCodeElements() {
    return Array.from(document.querySelectorAll('[data-reveal-code="true"]'))
        .filter(el => el.offsetParent !== null)
        .length;
}

function unlockNextPiece(kidId, buttonKey) {
    const today = new Date().toISOString().slice(0, 10);
    const unlockKey = `unlocked_${buttonKey}_${kidId}_${today}`;
    if (localStorage.getItem(unlockKey)) return; // Already unlocked today

    const storageKey = `progress_${kidId}_${today}`;
    const totalTasks = countVisibleRevealCodeElements();
    let progress = parseInt(localStorage.getItem(storageKey) || "0", 10);

    if (progress >= totalTasks) return;

    localStorage.setItem(storageKey, (progress + 1).toString());
    localStorage.setItem(unlockKey, "1");
    updateCodeDisplay();
}

function resetAllProgressIfRequested() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("resetprogress")) {
        Object.keys(localStorage)
            .filter(key => key.startsWith("progress_") || key.startsWith("unlocked_"))
            .forEach(key => localStorage.removeItem(key));
        const codeDisplay = document.getElementById("codeDisplay");
        if (codeDisplay) {
            codeDisplay.textContent = "Progress: 0/" + countVisibleRevealCodeElements();
        }
        alert("Progress has been reset!");
        setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("resetprogress");
            window.location.href = url.toString();
        }, 100);
        return true;
    }
    return false;
}

function updateCodeDisplay() {
    const codeDisplay = document.getElementById("codeDisplay");
    if (!codeDisplay) return;
    const kid = codeDisplay.getAttribute("data-kid");
    if (!kid) {
        codeDisplay.textContent = "Progress: 0/0";
        return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `progress_${kid}_${today}`;
    let progress = parseInt(localStorage.getItem(storageKey) || "0", 10);
    const totalTasks = countVisibleRevealCodeElements();
    codeDisplay.textContent = `Progress: ${progress}/${totalTasks}`;
}

document.addEventListener('DOMContentLoaded', function () {
    if (resetAllProgressIfRequested()) return;

    // Ensure all DOM manipulation (show/hide tasks) is done before this line!
    updateCodeDisplay();

    const revealElements = Array.from(document.querySelectorAll('[data-reveal-code="true"]'));
    revealElements.forEach((el, idx) => {
        if (el.type === "checkbox") {
            el.addEventListener('change', function (event) {
                if (event.target.checked) {
                    const codeDisplay = document.getElementById("codeDisplay");
                    const kid = codeDisplay ? codeDisplay.getAttribute("data-kid") : el.getAttribute('data-kid');
                    if (kid) unlockNextPiece(kid, "reveal" + idx);
                }
            });
        } else {
            el.addEventListener('click', function () {
                const codeDisplay = document.getElementById("codeDisplay");
                const kid = codeDisplay ? codeDisplay.getAttribute("data-kid") : el.getAttribute('data-kid');
                if (kid) unlockNextPiece(kid, "reveal" + idx);
            });
        }
    });
});

window.unlockNextPiece = unlockNextPiece;


