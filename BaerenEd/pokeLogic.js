function getCoins() {
    return parseInt(localStorage.getItem('bm_coins') || "0", 10);
}

function setCoins(val) {
    localStorage.setItem('bm_coins', val);
}

function addCoins(val) {
    setCoins(getCoins() + val);
}

function onTaskCompleted() {
    addCoins(1);
    updateCoinDisplay();
}

function allRequiredTasksComplete() {
    const requiredTasks = Array.from(document.querySelectorAll('.task-button.required'));
    const requiredChecks = Array.from(document.querySelectorAll('.chore-checkbox'));
    const allTasksDone = requiredTasks.every(el => el.classList.contains('completed'));
    const allChecksDone = requiredChecks.every(cb => cb.checked);
    return allTasksDone && allChecksDone;
}

function updateCoinDisplay() {
    document.getElementById('coinDisplay').innerHTML =
        '🪙 x ' + getCoins();
}


document.addEventListener('DOMContentLoaded', function () {
    updateCoinDisplay();

    // Attach to checkboxes
    document.querySelectorAll('.chore-checkbox').forEach(cb => {
        cb.addEventListener('change', onTaskCompleted);
    });

    // Attach to required task buttons
    document.querySelectorAll('.task-button.required').forEach(btn => {
        btn.addEventListener('click', function() {
            // If your logic marks as completed, call onTaskCompleted after completion
            setTimeout(onTaskCompleted, 200); // Delay if needed for async completion
        });
    });

    document.getElementById('viewPokedexBtn').onclick = function() {
        window.open(this.getAttribute('data-target-page'), '_blank');
    };

    // Refresh coin display on load
    onTaskCompleted();
});