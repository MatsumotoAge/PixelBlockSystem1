const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dropZone = document.getElementById('drop-zone');

const GRID_SIZE = 16;
let COLS, ROWS;

let grid;
let currentBlock = 1;
let textures = {};
let isDrawing = false;
let lastCell = null;

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    COLS = Math.floor(canvas.width / GRID_SIZE);
    ROWS = Math.floor(canvas.height / GRID_SIZE);
    grid = new Array(ROWS).fill(null).map(() => new Array(COLS).fill(0));
    render();
}

window.addEventListener('resize', initCanvas);

function loadTexture(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const index = Object.keys(textures).length + 1;
            textures[index] = img;
            createTextureButton(index, img);
            resolve();
        };
        img.onerror = reject;
        if (file instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => img.src = e.target.result;
            reader.readAsDataURL(file);
        } else {
            img.src = `textures/${file}`;
        }
    });
}

function createTextureButton(index, img) {
    const texturesDiv = document.getElementById('textures');
    const button = document.createElement('button');
    button.className = 'texture-button';
    button.style.backgroundImage = `url(${img.src})`;
    button.addEventListener('click', () => {
        currentBlock = parseInt(index);
        document.querySelectorAll('.texture-button').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
    });
    texturesDiv.appendChild(button);
}

function drawGrid() {
    ctx.strokeStyle = '#ccc';
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }
    for (let j = 0; j <= COLS; j++) {
        ctx.beginPath();
        ctx.moveTo(j * GRID_SIZE, 0);
        ctx.lineTo(j * GRID_SIZE, canvas.height);
        ctx.stroke();
    }
}

function drawBlocks() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const blockType = grid[i][j];
            if (blockType !== 0 && textures[blockType]) {
                ctx.drawImage(textures[blockType], j * GRID_SIZE, i * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }
}

function render(showGrid = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBlocks();
    if (showGrid) {
        drawGrid();
    }
}

function drawLine(startCell, endCell) {
    const dx = endCell.col - startCell.col;
    const dy = endCell.row - startCell.row;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= steps; i++) {
        const t = (steps === 0) ? 0.0 : i / steps;
        const col = Math.round(startCell.col + t * dx);
        const row = Math.round(startCell.row + t * dy);
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            grid[row][col] = currentBlock;
        }
    }
}

function getCellFromMouseEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / GRID_SIZE);
    const row = Math.floor(y / GRID_SIZE);
    return { row, col };
}

canvas.addEventListener('mousedown', (event) => {
    isDrawing = true;
    const cell = getCellFromMouseEvent(event);
    if (cell.row >= 0 && cell.row < ROWS && cell.col >= 0 && cell.col < COLS) {
        grid[cell.row][cell.col] = currentBlock;
        lastCell = cell;
        render();
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;
    
    const cell = getCellFromMouseEvent(event);
    if (cell.row !== lastCell.row || cell.col !== lastCell.col) {
        drawLine(lastCell, cell);
        lastCell = cell;
        render();
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

canvas.addEventListener('click', (event) => {
    const cell = getCellFromMouseEvent(event);
    if (cell.row >= 0 && cell.row < ROWS && cell.col >= 0 && cell.col < COLS) {
        grid[cell.row][cell.col] = currentBlock;
        render();
    }
});

document.getElementById('eraser').addEventListener('click', () => {
    currentBlock = 0;
    document.querySelectorAll('.texture-button').forEach(btn => btn.classList.remove('selected'));
});

document.getElementById('save').addEventListener('click', () => {
    localStorage.setItem('pixelArtGame', JSON.stringify(grid));
    alert('ゲームが保存されました！');
});

document.getElementById('load').addEventListener('click', () => {
    const savedGame = localStorage.getItem('pixelArtGame');
    if (savedGame) {
        grid = JSON.parse(savedGame);
        render();
        alert('ゲームが読み込まれました！');
    } else {
        alert('保存されたゲームがありません。');
    }
});

document.getElementById('export').addEventListener('click', () => {
    render(false);  // グリッドなしでレンダリング
    const link = document.createElement('a');
    link.download = 'pixel_art.png';
    link.href = canvas.toDataURL();
    link.click();
    render();  // グリッドありで再レンダリング
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            loadTexture(file).then(() => render());
        }
    }
});

initCanvas();