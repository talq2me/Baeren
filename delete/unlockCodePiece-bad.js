document.addEventListener("DOMContentLoaded", () => {
    console.log("unlockCodePiece.js: DOMContentLoaded fired");

    // Go through all clickable reveal buttons and check off tasks
    document.querySelectorAll('[data-reveal-code="true"]').forEach(btn => {
        btn.addEventListener("click", () => {
            console.log("Task button clicked");

            const kid = btn.getAttribute("data-kid");
            const targetPage = btn.getAttribute("data-target");

            if (!kid) {
                console.warn("No data-kid specified");
                return;
            }

            if (targetPage) {
                console.log("Opening page:", targetPage);
                window.open(targetPage, "_blank");
            }

            unlockNextPiece(kid);
            checkOffTask(btn);
        });
    });

    // On page load, show any previously revealed pieces and check off tasks
    document.querySelectorAll(".unlock-code[data-kid]").forEach(container => {
        const kid = container.getAttribute("data-kid");
        const fullCode = container.getAttribute("data-full-code");

        const revealedCount = parseInt(localStorage.getItem(`revealedChunks_${kid}`)) || 0;
        const chunks = fullCode.split("-");

        let displayCode = chunks.map((chunk, idx) => {
            return idx < revealedCount ? chunk : "••••";
        }).join("-");

        container.textContent = displayCode;
    });
});

function unlockNextPiece(kid) {
    const codeContainer = document.querySelector(`.unlock-code[data-kid="${kid}"]`);
    const fullCode = codeContainer?.getAttribute("data-full-code");

    if (!codeContainer || !fullCode) {
        console.warn("Missing code container or full code");
        return;
    }

    const chunks = fullCode.split("-");
    const revealedKey = `revealedChunks_${kid}`;
    let revealedCount = parseInt(localStorage.getItem(revealedKey)) || 0;

    if (revealedCount >= chunks.length) {
        console.log("All code pieces already revealed.");
        return;
    }

    revealedCount++;
    localStorage.setItem(revealedKey, revealedCount);

    const displayCode = chunks.map((chunk, idx) => {
        return idx < revealedCount ? chunk : "••••";
    }).join("-");

    codeContainer.textContent = displayCode;
    console.log(`Revealed chunk ${revealedCount} of ${chunks.length} for ${kid}`);
}

function checkOffTask(btn) {
    // Find the task and mark it as completed
    const task = btn.closest(".task");
    if (task) {
        task.classList.add("completed");
        task.querySelector(".task-status").textContent = "✔️ Task Completed";
    }
}
