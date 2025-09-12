function getQueryParams() {
    const params = {};
    window.location.search.slice(1).split("&").forEach(pair => {
        const [key, value] = pair.split("=");
        if (key && value) params[key] = decodeURIComponent(value);
    });
    return params;
}

/* function generateCode(seed, length) {
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
} */

/* function getTodayCodes(codeLength) {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    return {
        kid1: generateCode("kid1-" + today, codeLength),
        kid2: generateCode("kid2-" + today, codeLength),
    };
} */

function countVisibleRevealCodeElements() {
    showControlsForDay(); // Show/hide controls based on the day of the week

    // Count visible required buttons
    const visibleButtons = Array.from(document.querySelectorAll('.button.required[data-reveal-code="true"]'))
        .filter(el => el.offsetParent !== null);

    // Count visible checkboxes
    const visibleCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-reveal-code="true"]'))
        .filter(el => el.offsetParent !== null);

    return visibleButtons.length + visibleCheckboxes.length;
}

function countVisibleBonusTasks() {
    return Array.from(document.querySelectorAll('.bonus-task[data-reveal-code="true"]'))
        .filter(el => el.offsetParent !== null)
        .length;
}

function unlockNextPiece(kidId, buttonKey) {
    const today = new Date().toISOString().slice(0, 10);
    const unlockKey = `unlocked_${buttonKey}_${kidId}_${today}`;
    if (localStorage.getItem(unlockKey)) return; // Already unlocked today

    const storageKey = `progress_${kidId}_${today}`;
    const bonusStorageKey = `bonus_${kidId}_${today}`;
    const totalTasks = countVisibleRevealCodeElements();
    const totalBonusTasks = countVisibleBonusTasks();
    let progress = parseInt(localStorage.getItem(storageKey) || "0", 10);
    let bonusProgress = parseInt(localStorage.getItem(bonusStorageKey) || "0", 10);

    // Determine if this is a bonus task
    const el = document.querySelector(`[data-reveal-code="true"][data-key="${buttonKey}"]`);
    const isBonus = el && el.classList.contains('bonus-task');

    if (isBonus) {
        if (bonusProgress >= totalBonusTasks) return;
        localStorage.setItem(bonusStorageKey, (bonusProgress + 1).toString());
    } else {
        if (progress >= totalTasks) return;
        localStorage.setItem(storageKey, (progress + 1).toString());
        // --- Grant 10 coins for each required task completed ---
        addCoins(10);
        updateCoinDisplay();
    }

    localStorage.setItem(unlockKey, "1");
    updateCodeDisplay();

    // Mark ALL buttons with this data-key as completed (task, video, non-task, etc)
    document.querySelectorAll(`.button[data-key="${buttonKey}"]`).forEach(btn => {
        btn.classList.add('completed');
    });
}

function resetAllProgressIfRequested() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("resetprogress")) {
        Object.keys(localStorage)
            .filter(key =>
                key.startsWith("progress_") ||
                key.startsWith("unlocked_") ||
                key.startsWith("bonus_") ||
                key.startsWith("checkbox_") ||
                key.match(/^item\d+$/)
            )
            .forEach(key => localStorage.removeItem(key));
        // Optionally uncheck all checkboxes in the DOM
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        // Remove the query param and reload the page
        setTimeout(() => {
            location.replace(location.pathname);
        }, 100);
        return true;
    }
    return false;
}

function updateCodeDisplay() {
    const codeDisplay = document.getElementById("codeDisplay");
    const rewardBtn15 = document.getElementById("rewardBtn15");
    const rewardBtn30 = document.getElementById("rewardBtn30");
    if (!codeDisplay) return;
    const kid = codeDisplay.getAttribute("data-kid");
    if (!kid) {
        codeDisplay.textContent = "Progress: 0/0";
        if (rewardBtn15) rewardBtn15.style.display = "none";
        if (rewardBtn30) rewardBtn30.style.display = "none";
        return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `progress_${kid}_${today}`;
    const bonusStorageKey = `bonus_${kid}_${today}`;
    const rewardUsedKey = `rewardUsed_${kid}_${today}`;
    const overrideKey = `override_${kid}_${today}`;
    let progress = parseInt(localStorage.getItem(storageKey) || "0", 10);
    let bonusProgress = parseInt(localStorage.getItem(bonusStorageKey) || "0", 10);
    let rewardUsed = parseInt(localStorage.getItem(rewardUsedKey) || "0", 10);
    let overrideMinutes = parseInt(localStorage.getItem(overrideKey) || "0", 10);
    const totalTasks = countVisibleRevealCodeElements();
    const totalBonusTasks = countVisibleBonusTasks();
    let rewardMinutes = (progress + bonusProgress) * 5 + overrideMinutes - rewardUsed;

    codeDisplay.textContent =
        `Progress: ${progress}/${totalTasks}  ~  Rewards: ${Math.max(rewardMinutes,0)} mins`;

    // Show unlock button exactly when required progress completes and not already unlocked today
    const unlockBtn = document.getElementById('unlockPokemonBtn');
    if (unlockBtn) {
        const unlockedTodayKey = `pokedex_unlocked_today_${kid}_${today}`;
        const alreadyUnlockedToday = localStorage.getItem(unlockedTodayKey) === '1';
        if (progress >= totalTasks && totalTasks > 0 && !alreadyUnlockedToday) {
            unlockBtn.style.display = '';
        } else {
            unlockBtn.style.display = 'none';
        }
    }

    // Remove previous click handlers to avoid stacking
    if (rewardBtn15) rewardBtn15.onclick = null;
    if (rewardBtn30) rewardBtn30.onclick = null;

    // Show/hide reward buttons and set their actions
    if (rewardBtn30) {
        if (rewardMinutes >= 30) {
            rewardBtn30.style.display = "";
            rewardBtn30.textContent = `Reward 30`;
            rewardBtn30.onclick = function() {
                localStorage.setItem(rewardUsedKey, (rewardUsed + 30).toString());
                updateCodeDisplay();
                //reward(30);
                launchApp('com.netflix.mediaclient', 30);
            };
        } else {
            rewardBtn30.style.display = "none";
        }
    }

    if (rewardBtn15) {
        if (rewardMinutes >= 15) {
            rewardBtn15.style.display = "";
            rewardBtn15.textContent = `Reward 15`;
            rewardBtn15.onclick = function() {
                localStorage.setItem(rewardUsedKey, (rewardUsed + 15).toString());
                updateCodeDisplay();
                //reward(15);
                launchApp('com.netflix.mediaclient', 15);
            };
        } else {
            rewardBtn15.style.display = "none";
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (resetAllProgressIfRequested()) return;

    updateCodeDisplay();

    // Attach unlock button handler to increment kid-specific unlocked count
    const unlockBtn = document.getElementById('unlockPokemonBtn');
    if (unlockBtn) {
        unlockBtn.onclick = function() {
            const codeDisplay = document.getElementById('codeDisplay');
            const kid = codeDisplay ? codeDisplay.getAttribute('data-kid') : (localStorage.getItem('kid') || 'am');
            const today = new Date().toISOString().slice(0, 10);
            const unlockedTodayKey = `pokedex_unlocked_today_${kid}_${today}`;
            if (localStorage.getItem(unlockedTodayKey) === '1') {
                this.style.display = 'none';
                return;
            }
            const countKey = `${kid}_pokedex_unlocked`;
            const current = parseInt(localStorage.getItem(countKey) || '0', 10);
            localStorage.setItem(countKey, String(current + 1));
            localStorage.setItem(unlockedTodayKey, '1');
            this.style.display = 'none';
            alert("You unlocked a new Pokémon!");
        };
    }

    const codeDisplay = document.getElementById("codeDisplay");
    const kid = codeDisplay ? codeDisplay.getAttribute("data-kid") : "am";
    const today = new Date().toISOString().slice(0, 10);

    // Mark ALL buttons with data-key as completed if unlocked
    document.querySelectorAll('.button[data-key]').forEach((button) => {
        const key = button.getAttribute('data-key');
        const unlockKey = `unlocked_${key}_${kid}_${today}`;
        if (localStorage.getItem(unlockKey)) {
            button.classList.add('completed');
        }
    });

    // --- VIDEO BUTTONS ---
    const videoButtons = Array.from(document.querySelectorAll('.video-button.required[data-reveal-code="true"]'));
    videoButtons.forEach((button) => {
        const key = button.getAttribute('data-key');
        const unlockKey = `unlocked_${key}_${kid}_${today}`; 
        if (localStorage.getItem(unlockKey)) {
            button.classList.add('completed');
        }
    });

    const revealElements = Array.from(document.querySelectorAll('[data-reveal-code="true"]'));
    revealElements.forEach((el) => {
        if (el.type === "checkbox") {
            el.addEventListener('change', function (event) {
                if (event.target.checked) {
                    const codeDisplay = document.getElementById("codeDisplay");
                    const kid = codeDisplay ? codeDisplay.getAttribute("data-kid") : el.getAttribute('data-kid');
                    const key = el.getAttribute('data-key');
                    if (kid && key) unlockNextPiece(kid, key);
                }
            });
        }
    });


});

window.unlockNextPiece = unlockNextPiece;


