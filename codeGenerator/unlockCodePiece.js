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


// unlockCodePiece.js
function unlockNextPiece(kidId, totalTasks) {
    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `progress_${kidId}_${today}`;
    const codes = getTodayCodes();
    const fullCode = codes[kidId];

    if (!fullCode) {
        showCodePopup("Error: No code for this kid.");
        return;
    }

    let progress = parseInt(localStorage.getItem(storageKey) || "0", 10);

    if (progress >= totalTasks) {
        return;
    }

    const pieceSize = Math.ceil(fullCode.length / totalTasks);
    const start = progress * pieceSize;
    const end = Math.min(start + pieceSize, fullCode.length);
    const codePiece = fullCode.slice(start, end);


    localStorage.setItem(storageKey, (progress + 1).toString());
}





document.addEventListener('DOMContentLoaded', function () {
    console.log("DOMContentLoaded fired");
    const query = getQueryParams();
    const kidId = query.kid;
    const totalTasks = parseInt(query.totalTasks || "0", 10);

    if (kidId && totalTasks > 0) {
        unlockNextPiece(kidId, totalTasks);
    }
/* 
    // Handle task button click
    document.querySelectorAll('.task-button').forEach(element => {
        element.addEventListener('click', () => {
            const page = element.getAttribute('data-target-page');
            const kidId = element.getAttribute('data-kid');
    
            if (page && kidId) {
                const totalTasks = document.querySelectorAll(`[data-reveal-code="true"][data-kid="${kidId}"]`).length;
                const url = `${page}?kid=${kidId}&totalTasks=${totalTasks}`;
                openModalPage(url);
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
    }); */
});

