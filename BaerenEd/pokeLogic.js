function getTodayPokemonIndex() {
    // Rotate through POKEDEX by day
    const today = new Date().toISOString().slice(0, 10);
    const dayNum = Math.floor(new Date(today).getTime() / (1000*60*60*24));
    return dayNum % POKEDEX.length;
}

function getCoins() {
    return parseInt(localStorage.getItem('bm_coins') || "0", 10);
}

function setCoins(val) {
    localStorage.setItem('bm_coins', val);
}

function addCoins(val) {
    setCoins(getCoins() + val);
}

function getUnlockedPokemon() {
    return JSON.parse(localStorage.getItem('bm_pokedex') || "[]");
}

function unlockPokemon(pokemon) {
    let pokedex = getUnlockedPokemon();
    if (!pokedex.find(p => p.id === pokemon.id)) {
        pokedex.push(pokemon);
        localStorage.setItem('bm_pokedex', JSON.stringify(pokedex));
    }
}
function onTaskCompleted() {
    addCoins(1);
    updateCoinDisplay();
    if (allRequiredTasksComplete()) {
        document.getElementById('unlockPokemonBtn').style.display = 'inline-block';
    }
}

function allRequiredTasksComplete() {
    // Adjust selector as needed for your required tasks
    return Array.from(document.querySelectorAll('.task-button.required, .chore-checkbox')).every(
        el => el.checked || el.classList.contains('completed')
    );
}

function updateCoinDisplay() {
    document.getElementById('coinDisplay').innerHTML =
        '🪙 x ' + getCoins();
}


document.addEventListener('DOMContentLoaded', function () {
    updateCoinDisplay();
    
    document.getElementById('viewPokedexBtn').onclick = function() {
        window.open(this.getAttribute('data-target-page'), '_blank');
    };

    // Now the button exists, so this is safe:
    document.getElementById('unlockPokemonBtn').onclick = function() {
        const idx = getTodayPokemonIndex();
        const pokemon = POKEDEX[idx];
        unlockPokemon(pokemon);
        alert(`You unlocked ${pokemon.name}!`);
        this.style.display = 'none';
        updateCoinDisplay();
    };
});