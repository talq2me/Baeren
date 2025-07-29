const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 40;
const gridSize = 8;

let levels = [];
let levelIndex = 0;
let levelData = null;

let player = { x: 0, y: 0, dir: 'right' };

fetch('codingGameData.json')
  .then(res => res.json())
  .then(data => {
    levels = data.levels;
    loadLevel(0);
  });

function loadLevel(index) {
  levelIndex = index;
  levelData = levels[index];
  player.x = levelData.start[0];
  player.y = levelData.start[1];
  player.dir = 'right';
  drawGrid();
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#bbb';

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  ctx.fillStyle = 'gray';
  levelData.obstacles.forEach(([ox, oy]) => {
    ctx.fillRect(ox * tileSize, oy * tileSize, tileSize, tileSize);
  });

  ctx.fillStyle = 'green';
  ctx.fillRect(levelData.goal[0] * tileSize, levelData.goal[1] * tileSize, tileSize, tileSize);

  ctx.fillStyle = 'blue';
  ctx.fillRect(player.x * tileSize + 5, player.y * tileSize + 5, tileSize - 10, tileSize - 10);

  ctx.fillStyle = 'white';
  ctx.beginPath();
  const cx = player.x * tileSize + tileSize / 2;
  const cy = player.y * tileSize + tileSize / 2;
  const arrowSize = 10;
  switch (player.dir) {
    case 'up': ctx.moveTo(cx, cy - arrowSize); ctx.lineTo(cx - arrowSize, cy + arrowSize); ctx.lineTo(cx + arrowSize, cy + arrowSize); break;
    case 'down': ctx.moveTo(cx, cy + arrowSize); ctx.lineTo(cx - arrowSize, cy - arrowSize); ctx.lineTo(cx + arrowSize, cy - arrowSize); break;
    case 'left': ctx.moveTo(cx - arrowSize, cy); ctx.lineTo(cx + arrowSize, cy - arrowSize); ctx.lineTo(cx + arrowSize, cy + arrowSize); break;
    case 'right': ctx.moveTo(cx + arrowSize, cy); ctx.lineTo(cx - arrowSize, cy - arrowSize); ctx.lineTo(cx - arrowSize, cy + arrowSize); break;
  }
  ctx.closePath();
  ctx.fill();
}

function pathAheadClear() {
  let dx = 0, dy = 0;
  if (player.dir === 'up') dy = -1;
  if (player.dir === 'down') dy = 1;
  if (player.dir === 'left') dx = -1;
  if (player.dir === 'right') dx = 1;

  const nx = player.x + dx;
  const ny = player.y + dy;

  return (
    nx >= 0 && nx < gridSize &&
    ny >= 0 && ny < gridSize &&
    !levelData.obstacles.some(o => o[0] === nx && o[1] === ny)
  );
}

function move_forward() {
  if (pathAheadClear()) {
    if (player.dir === 'up') player.y--;
    else if (player.dir === 'down') player.y++;
    else if (player.dir === 'left') player.x--;
    else if (player.dir === 'right') player.x++;
    drawGrid();
    checkGoal();
  }
}

function turn_left() {
  const dirs = ['up', 'left', 'down', 'right'];
  let i = dirs.indexOf(player.dir);
  i = (i + 1) % 4;
  player.dir = dirs[i];
  drawGrid();
}

function turn_right() {
  const dirs = ['up', 'right', 'down', 'left'];
  let i = dirs.indexOf(player.dir);
  i = (i + 1) % 4;
  player.dir = dirs[i];
  drawGrid();
}

function checkGoal() {
  if (player.x === levelData.goal[0] && player.y === levelData.goal[1]) {
    setTimeout(() => {
      alert('You reached the goal! 🎉');
      if (levelIndex + 1 < levels.length) {
        loadLevel(levelIndex + 1);
      } else {
        alert('All levels completed! 🏁');
      }
    }, 100);
  }
}

// Define Blockly custom blocks
Blockly.defineBlocksWithJsonArray([
  {
    "type": "move_forward",
    "message0": "move forward",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160
  },
  {
    "type": "turn_left",
    "message0": "turn left",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160
  },
  {
    "type": "turn_right",
    "message0": "turn right",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160
  },
  {
    "type": "if_path_clear",
    "message0": "if path ahead %1 %2",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 210
  }
]);

// Define generators for custom blocks
Blockly.JavaScript['move_forward'] = () => 'move_forward();\n';
Blockly.JavaScript['turn_left'] = () => 'turn_left();\n';
Blockly.JavaScript['turn_right'] = () => 'turn_right();\n';
Blockly.JavaScript['if_path_clear'] = function (block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  return `if (pathAheadClear()) {\n${branch}}\n`;
};

// Inject Blockly
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: document.getElementById('toolbox')
});

// Run the code
document.getElementById('runButton').addEventListener('click', () => {
  const code = Blockly.JavaScript.workspaceToCode(workspace);
  try {
    eval(`
      window.move_forward = move_forward;
      window.turn_left = turn_left;
      window.turn_right = turn_right;
      window.pathAheadClear = pathAheadClear;
      ${code}
    `);
  } catch (e) {
    alert('Error: ' + e.message);
  }
});
