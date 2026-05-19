

// Canvas setup 
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var CELL_SIZE = 12;
var COLS = 60;
var ROWS = 45;

canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

// Grid: 0 = dead, 1 = alive
var grid = createEmptyGrid();

//  State variables 
var isRunning = false;// initially not running
var generation = 0;
var simInterval = null;// holds the setInterval reference for the simulation loop
var isDrawing = false;//initially not drawing
var drawValue = 1;// when drawing with mouse, this is the value (0 or 1) that will be set in the grid ,taken as 1 arbitrarily, will be toggled on mousedown

//  Button events
var btnPlay = document.getElementById('btn-play');

btnPlay.addEventListener('click', function () {
    if (isRunning) {
        stopSim();
    } else {
        startSim();
    }
});

document.getElementById('btn-step').addEventListener('click', function () {
    stopSim();
    nextGeneration();
    drawGrid();
});

document.getElementById('btn-clear').addEventListener('click', function () {
    stopSim();
    grid = createEmptyGrid();
    generation = 0;
    updateStats();
    drawGrid();
});

document.getElementById('btn-random').addEventListener('click', function () {
    stopSim();
    grid = createRandomGrid();
    generation = 0;
    updateStats();
    drawGrid();
});

document.getElementById('speed-slider').addEventListener('input', function () {
    if (isRunning) {
        stopSim();
        startSim();
    }
});

// Mouse drawing 
canvas.addEventListener('mousedown', function (e) {
    isDrawing = true;
    var pos = getCellFromMouse(e);
    drawValue = grid[pos.row][pos.col] === 1 ? 0 : 1;
    grid[pos.row][pos.col] = drawValue;
    updateStats();
    drawGrid();
});

canvas.addEventListener('mousemove', function (e) {
    if (!isDrawing) return;
    var pos = getCellFromMouse(e);
    grid[pos.row][pos.col] = drawValue;
    updateStats();
    drawGrid();
});

canvas.addEventListener('mouseup', function () { isDrawing = false; });
canvas.addEventListener('mouseleave', function () { isDrawing = false; });

//  Get row/col from mouse position 
function getCellFromMouse(e) {
    var rect = canvas.getBoundingClientRect();
    var col = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    var row = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    col = Math.max(0, Math.min(COLS - 1, col));
    row = Math.max(0, Math.min(ROWS - 1, row));
    return { row: row, col: col };
}

// Create a blank grid
function createEmptyGrid() {
    var g = [];
    for (var r = 0; r < ROWS; r++) {
        g[r] = [];
        for (var c = 0; c < COLS; c++) {
            g[r][c] = 0;
        }
    }
    return g;
}

// Create a random grid
function createRandomGrid() {
    var g = [];
    for (var r = 0; r < ROWS; r++) {
        g[r] = [];
        for (var c = 0; c < COLS; c++) {
            g[r][c] = Math.random() < 0.25 ? 1 : 0;
        }
    }
    return g;
}

// Compute next generation
function nextGeneration() {
    var next = createEmptyGrid();

    for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
            var neighbors = countNeighbors(r, c);
            var alive = grid[r][c] === 1;

            if (alive && (neighbors === 2 || neighbors === 3)) {
                next[r][c] = 1;   // survives
            } else if (!alive && neighbors === 3) {
                next[r][c] = 1;   // born
            } else {
                next[r][c] = 0;   // dies
            }
        }
    }

    grid = next;
    generation++;//new generation is created
}

//  Count live neighbors (wraps around edges) 
function countNeighbors(row, col) {
    var count = 0;
    for (var Vertical_offset = -1; Vertical_offset <= 1; Vertical_offset++) {
        for (var Horizontal_offset = -1; Horizontal_offset <= 1; Horizontal_offset++) {
            if (Vertical_offset === 0 && Horizontal_offset === 0) continue;
            var r = (row + Vertical_offset + ROWS) % ROWS;// if row index is from [1,ROWS-2] then the remainder will be row +dr
            var c = (col + Horizontal_offset + COLS) % COLS;// if column index is from [1,COLS-2] then the remainder will be col +dc
            count += grid[r][c];//this will count the total number of alive neighours
        }
    }
    return count;
}

// ── Draw the grid ──
function drawGrid() {
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);//canvas rectangle

    // Grid lines
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    for (var r = 0; r <= ROWS; r++) {//ROWS+2 grid lines
        ctx.beginPath();// starts a new path
        ctx.moveTo(0, r * CELL_SIZE);//cell size 12px
        ctx.lineTo(canvas.width, r * CELL_SIZE); //this will make horizontal lines
        ctx.stroke();// makes the line visible
    }
    for (var c = 0; c <= COLS; c++) {//this is for vertical lines
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, canvas.height);
        ctx.stroke();
    }

    // Alive cells
    ctx.fillStyle = '#444';
    for (var row = 0; row < ROWS; row++) {
        for (var col = 0; col < COLS; col++) {
            if (grid[row][col] === 1) {//if value is 1 then it is alive
                ctx.fillRect(//will make a rectangle
                    col * CELL_SIZE + 1,//x -coordinate
                    row * CELL_SIZE + 1,// y- coordinate
                    CELL_SIZE - 2,//10 is the width 
                    CELL_SIZE - 2//10 is the height
                );
            }
        }
    }
}

//  Update stat numbers 
function updateStats() {
    var alive = 0;//intitially the number of alive cells is zero
    for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
            alive += grid[r][c];//this will count all the alive cells everytime a new grid is made
        }
    }
    document.getElementById('gen-count').textContent = generation;//each time a new generation is made the count is increased 
    document.getElementById('alive-count').textContent = alive;//after each generation the alive count is updated 
}

// Start simulation 
function startSim() {
    isRunning = true;
    btnPlay.textContent = '⏸ Pause';
    btnPlay.classList.add('active');
    var fps = parseInt(document.getElementById('speed-slider').value);//parseint converts the string value from the slider into int
    simInterval = setInterval(function () { //we store the set interval function inside a  variable so that it can be used to stop the loop in the future
        nextGeneration();//calculate position in new generation
        drawGrid();//draw the new grid
        updateStats(); //update the stats
    }, 1000 / fps);
}

//  Stop simulation 
function stopSim() {
    isRunning = false;
    btnPlay.textContent = '▶ Play';
    btnPlay.classList.remove('active');
    clearInterval(simInterval);//used to stop the repeating loop code above
}

// Preset patterns 
var PRESETS = {
  glider: [
    [21,30],
    [22,31],
    [23,29],
    [23,30],
    [23,31]
  ],

  blinker: [
    [22,29],
    [22,30],
    [22,31]
  ],

  pulsar: [
    [16,28],[16,29],[16,30],[16,34],[16,35],[16,36],

    [18,26],[19,26],[20,26],
    [18,31],[19,31],[20,31],
    [18,33],[19,33],[20,33],
    [18,38],[19,38],[20,38],

    [21,28],[21,29],[21,30],[21,34],[21,35],[21,36],

    [23,28],[23,29],[23,30],[23,34],[23,35],[23,36],

    [24,26],[25,26],[26,26],
    [24,31],[25,31],[26,31],
    [24,33],[25,33],[26,33],
    [24,38],[25,38],[26,38],

    [28,28],[28,29],[28,30],[28,34],[28,35],[28,36]
  ],

  glidergun: [
    [5,6],[5,7],
    [6,6],[6,7],

    [5,16],[6,16],[7,16],
    [4,17],[8,17],
    [3,18],[9,18],
    [3,19],[9,19],

    [6,20],

    [4,21],[8,21],

    [5,22],[6,22],[7,22],

    [6,23],

    [3,26],[4,26],[5,26],
    [3,27],[4,27],[5,27],

    [2,28],[6,28],

    [1,30],[2,30],
    [6,30],[7,30],

    [3,40],[4,40],
    [3,41],[4,41]
  ]
};

function placePreset(name) {
  stopSim();

  var pattern = PRESETS[name];

  for (var i = 0; i < pattern.length; i++) {

    var r = pattern[i][0];
    var c = pattern[i][1];

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      grid[r][c] = 1;
    }
  }

  generation = 0;

  updateStats();
  drawGrid();
}

// Start
drawGrid();
updateStats();