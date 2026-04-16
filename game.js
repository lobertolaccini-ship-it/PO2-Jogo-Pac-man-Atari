/**
 * Atari Pac-Man Clone
 * Lógica principal do jogo usando Canvas API
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const messageElement = document.getElementById('message');

// Configurações do Grid
const TILE_SIZE = 20;
const ROWS = 21;
const COLS = 19;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

// 1: Parede, 2: Ponto, 3: Super-Ponto, 0: Vazio
const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let workMap = [];
let score = 0;
let lives = 3;
let gameState = 'START'; // START, PLAYING, WON, GAMEOVER, FRIGHTENED
let powerModeTimer = null;

// Entidades
let pacman = {
    x: 9 * TILE_SIZE,
    y: 15 * TILE_SIZE,
    dir: { x: 0, y: 0 },
    nextDir: { x: 0, y: 0 },
    speed: 2,
    radius: 8,
    mouth: 0,
    mouthOpen: 1
};

const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
let ghosts = [];

function initGhosts() {
    ghosts = [
        { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, color: ghostColors[0], dir: { x: 1, y: 0 }, speed: 2, state: 'normal' },
        { x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, color: ghostColors[1], dir: { x: -1, y: 0 }, speed: 2, state: 'normal' },
        { x: 10 * TILE_SIZE, y: 9 * TILE_SIZE, color: ghostColors[2], dir: { x: 0, y: -1 }, speed: 2, state: 'normal' },
        { x: 9 * TILE_SIZE, y: 8 * TILE_SIZE, color: ghostColors[3], dir: { x: 0, y: 1 }, speed: 2, state: 'normal' }
    ];
}

function resetGame() {
    workMap = MAP.map(row => [...row]);
    score = 0;
    lives = 3;
    scoreElement.innerText = "000000";
    livesElement.innerText = "3";
    resetPositions();
    gameState = 'START';
    overlay.classList.remove('hidden');
    messageElement.innerText = "ATARI PAC-MAN";
}

function resetPositions() {
    pacman.x = 9 * TILE_SIZE;
    pacman.y = 15 * TILE_SIZE;
    pacman.dir = { x: 0, y: 0 };
    pacman.nextDir = { x: 0, y: 0 };
    initGhosts();
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (gameState === 'START' || gameState === 'GAMEOVER' || gameState === 'WON') {
        if (e.key === 'Enter') {
            resetGame();
            gameState = 'PLAYING';
            overlay.classList.add('hidden');
        }
        return;
    }

    switch(e.key) {
        case 'ArrowUp': pacman.nextDir = { x: 0, y: -1 }; break;
        case 'ArrowDown': pacman.nextDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft': pacman.nextDir = { x: -1, y: 0 }; break;
        case 'ArrowRight': pacman.nextDir = { x: 1, y: 0 }; break;
    }
});

function canMove(x, y, dir) {
    const nextX = x + dir.x * pacman.speed;
    const nextY = y + dir.y * pacman.speed;
    
    // Check corners for wall collision
    const corners = [
        { x: nextX - 7, y: nextY - 7 },
        { x: nextX + 7, y: nextY - 7 },
        { x: nextX - 7, y: nextY + 7 },
        { x: nextX + 7, y: nextY + 7 }
    ];

    for (let c of corners) {
        const col = Math.floor(c.x / TILE_SIZE);
        const row = Math.floor(c.y / TILE_SIZE);
        if (workMap[row] && workMap[row][col] === 1) return false;
    }
    return true;
}

function updatePacman() {
    // Try to change to nextDir if possible
    if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
        // Alinhamento no grid para facilitar curvas
        const centerX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        const centerY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        
        if (Math.abs(pacman.x - centerX) < 4 && Math.abs(pacman.y - centerY) < 4) {
            if (canMove(centerX, centerY, pacman.nextDir)) {
                pacman.x = centerX;
                pacman.y = centerY;
                pacman.dir = { ...pacman.nextDir };
            }
        }
    }

    if (canMove(pacman.x, pacman.y, pacman.dir)) {
        pacman.x += pacman.dir.x * pacman.speed;
        pacman.y += pacman.dir.y * pacman.speed;
    }

    // Teletransporte lateral
    if (pacman.x < 0) pacman.x = canvas.width;
    if (pacman.x > canvas.width) pacman.x = 0;

    // Comer pontos
    const col = Math.floor(pacman.x / TILE_SIZE);
    const row = Math.floor(pacman.y / TILE_SIZE);
    
    if (workMap[row][col] === 2) {
        workMap[row][col] = 0;
        score += 10;
        checkWin();
    } else if (workMap[row][col] === 3) {
        workMap[row][col] = 0;
        score += 50;
        activatePowerMode();
        checkWin();
    }
    
    scoreElement.innerText = score.toString().padStart(6, '0');
    
    // Animação boca
    pacman.mouth += 0.1 * pacman.mouthOpen;
    if (pacman.mouth > 0.2 || pacman.mouth < 0) pacman.mouthOpen *= -1;
}

function activatePowerMode() {
    gameState = 'FRIGHTENED';
    ghosts.forEach(g => g.state = 'frightened');
    if (powerModeTimer) clearTimeout(powerModeTimer);
    powerModeTimer = setTimeout(() => {
        gameState = 'PLAYING';
        ghosts.forEach(g => g.state = 'normal');
    }, 7000);
}

function checkWin() {
    const remaining = workMap.flat().filter(tile => tile === 2 || tile === 3).length;
    if (remaining === 0) {
        gameState = 'WON';
        overlay.classList.remove('hidden');
        messageElement.innerText = "YOU WIN!";
    }
}

function updateGhosts() {
    ghosts.forEach(g => {
        // IA simples: segue reto até bater numa parede ou encontrar interseção
        const col = Math.floor(g.x / TILE_SIZE);
        const row = Math.floor(g.y / TILE_SIZE);
        
        const possibleDirs = [
            { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
        ].filter(d => {
            // Não volta para trás a menos que não tenha opção
            if (d.x === -g.dir.x && d.y === -g.dir.y) return false;
            const nextR = row + d.y;
            const nextC = col + d.x;
            return workMap[nextR] && workMap[nextR][nextC] !== 1;
        });

        const atIntersection = (g.x % TILE_SIZE === TILE_SIZE/2 && g.y % TILE_SIZE === TILE_SIZE/2);
        
        if (atIntersection && (possibleDirs.length > 0)) {
            // Decide mudar de direção aleatoriamente em interseções
            if (Math.random() < 0.3 || workMap[row + g.dir.y] && workMap[row + g.dir.y][col + g.dir.x] === 1) {
                g.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            }
        }

        g.x += g.dir.x * (g.state === 'frightened' ? 1 : g.speed);
        g.y += g.dir.y * (g.state === 'frightened' ? 1 : g.speed);

        // Teletransporte lateral
        if (g.x < 0) g.x = canvas.width;
        if (g.x > canvas.width) g.x = 0;

        // Colisão com Pac-Man
        const dist = Math.hypot(pacman.x - g.x, pacman.y - g.y);
        if (dist < 15) {
            if (g.state === 'frightened') {
                score += 200;
                g.x = 9 * TILE_SIZE;
                g.y = 9 * TILE_SIZE;
                g.state = 'normal';
            } else {
                handleDeath();
            }
        }
    });
}

function handleDeath() {
    lives--;
    livesElement.innerText = lives;
    if (lives <= 0) {
        gameState = 'GAMEOVER';
        overlay.classList.remove('hidden');
        messageElement.innerText = "GAME OVER";
    } else {
        resetPositions();
    }
}

// Rendering Functions
function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = workMap[r][c];
            if (tile === 1) {
                ctx.fillStyle = '#0000FF'; // Blue walls
                ctx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === 2) {
                ctx.fillStyle = '#FFB8AE'; // Pellets
                ctx.fillRect(c * TILE_SIZE + 8, r * TILE_SIZE + 8, 4, 4);
            } else if (tile === 3) {
                ctx.fillStyle = '#FFB8AE'; // Power pellets
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + 10, r * TILE_SIZE + 10, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw Pac-Man
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    let rotation = 0;
    if (pacman.dir.x === 1) rotation = 0;
    else if (pacman.dir.x === -1) rotation = Math.PI;
    else if (pacman.dir.y === 1) rotation = Math.PI/2;
    else if (pacman.dir.y === -1) rotation = -Math.PI/2;

    ctx.moveTo(pacman.x, pacman.y);
    ctx.arc(pacman.x, pacman.y, pacman.radius, rotation + pacman.mouth, rotation + 2 * Math.PI - pacman.mouth);
    ctx.fill();

    // Draw Ghosts
    ghosts.forEach(g => {
        ctx.fillStyle = g.state === 'frightened' ? '#2121ff' : g.color;
        
        // Forma de fantasma simplificada Atari
        ctx.fillRect(g.x - 8, g.y - 8, 16, 12);
        ctx.beginPath();
        ctx.arc(g.x, g.y - 4, 8, Math.PI, 0);
        ctx.fill();
        
        // "Pezinhos"
        ctx.fillRect(g.x - 8, g.y + 4, 4, 4);
        ctx.fillRect(g.x - 2, g.y + 4, 4, 4);
        ctx.fillRect(g.x + 4, g.y + 4, 4, 4);
        
        // Olhos
        ctx.fillStyle = 'white';
        ctx.fillRect(g.x - 5, g.y - 4, 4, 4);
        ctx.fillRect(g.x + 1, g.y - 4, 4, 4);
    });
}

function gameLoop() {
    if (gameState === 'PLAYING' || gameState === 'FRIGHTENED') {
        updatePacman();
        updateGhosts();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
workMap = MAP.map(row => [...row]);
initGhosts();
gameLoop();
window.game = { resetGame }; // For manual reset if needed
