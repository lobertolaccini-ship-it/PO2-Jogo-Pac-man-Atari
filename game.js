/**
 * Atari Pac-Man Clone
 * Lógica principal do jogo usando Canvas API
 * Atualizado: IA de Fantasmas, Colisões e Sistema de Respawn
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
    x: 9 * TILE_SIZE + TILE_SIZE/2,
    y: 15 * TILE_SIZE + TILE_SIZE/2,
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
    const centerX = 9 * TILE_SIZE + TILE_SIZE/2;
    const centerY = 9 * TILE_SIZE + TILE_SIZE/2;
    
    ghosts = [
        { x: centerX, y: centerY, color: ghostColors[0], dir: { x: 1, y: 0 }, speed: 2, state: 'normal' },
        { x: centerX - TILE_SIZE, y: centerY, color: ghostColors[1], dir: { x: -1, y: 0 }, speed: 2, state: 'normal' },
        { x: centerX + TILE_SIZE, y: centerY, color: ghostColors[2], dir: { x: 0, y: -1 }, speed: 2, state: 'normal' },
        { x: centerX, y: centerY - TILE_SIZE, color: ghostColors[3], dir: { x: 0, y: 1 }, speed: 2, state: 'normal' }
    ];
}

function resetGame() {
    workMap = MAP.map(row => [...row]);
    score = 0;
    lives = 3;
    if(scoreElement) scoreElement.innerText = "000000";
    if(livesElement) livesElement.innerText = "3";
    resetPositions();
    gameState = 'START';
    overlay.classList.remove('hidden');
    messageElement.innerText = "ATARI PAC-MAN";
}

function resetPositions() {
    pacman.x = 9 * TILE_SIZE + TILE_SIZE/2;
    pacman.y = 15 * TILE_SIZE + TILE_SIZE/2;
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

function canMove(x, y, dir, speed = 2) {
    const nextX = x + dir.x * speed;
    const nextY = y + dir.y * speed;
    const padding = 7;

    const corners = [
        { x: nextX - padding, y: nextY - padding },
        { x: nextX + padding, y: nextY - padding },
        { x: nextX - padding, y: nextY + padding },
        { x: nextX + padding, y: nextY + padding }
    ];

    for (let c of corners) {
        const col = Math.floor(c.x / TILE_SIZE);
        const row = Math.floor(c.y / TILE_SIZE);
        if (workMap[row] && workMap[row][col] === 1) return false;
    }
    return true;
}

function updatePacman() {
    if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
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

    if (pacman.x < 0) pacman.x = canvas.width;
    if (pacman.x > canvas.width) pacman.x = 0;

    const col = Math.floor(pacman.x / TILE_SIZE);
    const row = Math.floor(pacman.y / TILE_SIZE);
    
    if (workMap[row] && workMap[row][col] === 2) {
        workMap[row][col] = 0;
        score += 10;
        checkWin();
    } else if (workMap[row] && workMap[row][col] === 3) {
        workMap[row][col] = 0;
        score += 50;
        activatePowerMode();
        checkWin();
    }
    
    if(scoreElement) scoreElement.innerText = score.toString().padStart(6, '0');
    
    pacman.mouth += 0.1 * pacman.mouthOpen;
    if (pacman.mouth > 0.2 || pacman.mouth < 0) pacman.mouthOpen *= -1;
}

function activatePowerMode() {
    gameState = 'FRIGHTENED';
    ghosts.forEach(g => g.state = 'frightened');
    if (powerModeTimer) clearTimeout(powerModeTimer);
    powerModeTimer = setTimeout(() => {
        if (gameState === 'FRIGHTENED') gameState = 'PLAYING';
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
        const col = Math.floor(g.x / TILE_SIZE);
        const row = Math.floor(g.y / TILE_SIZE);
        
        const centerX = col * TILE_SIZE + TILE_SIZE/2;
        const centerY = row * TILE_SIZE + TILE_SIZE/2;

        const atCenter = Math.abs(g.x - centerX) < 2 && Math.abs(g.y - centerY) < 2;

        if (atCenter) {
            const possibleDirs = [
                { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
            ].filter(d => {
                if (d.x === -g.dir.x && d.y === -g.dir.y) return false;
                return canMove(g.x, g.y, d, 2);
            });

            if (!canMove(g.x, g.y, g.dir, 2) || (possibleDirs.length > 1 && Math.random() < 0.3)) {
                if (possibleDirs.length > 0) {
                    g.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                } else {
                    g.dir = { x: -g.dir.x, y: -g.dir.y };
                }
            }
        }

        const speed = g.state === 'frightened' ? 1 : g.speed;
        if (canMove(g.x, g.y, g.dir, speed)) {
            g.x += g.dir.x * speed;
            g.y += g.dir.y * speed;
        }

        if (g.x < 0) g.x = canvas.width;
        if (g.x > canvas.width) g.x = 0;

        const dist = Math.hypot(pacman.x - g.x, pacman.y - g.y);
        if (dist < 15) {
            if (g.state === 'frightened') {
                score += 200;
                g.x = 9 * TILE_SIZE + TILE_SIZE/2;
                g.y = 9 * TILE_SIZE + TILE_SIZE/2;
                g.state = 'normal';
            } else {
                handleDeath();
            }
        }
    });
}

function handleDeath() {
    lives--;
    if(livesElement) livesElement.innerText = lives;
    if (lives <= 0) {
        gameState = 'GAMEOVER';
        overlay.classList.remove('hidden');
        messageElement.innerText = "GAME OVER";
    } else {
        resetPositions();
    }
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = workMap[r][c];
            if (tile === 1) {
                ctx.fillStyle = '#0000FF';
                ctx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === 2) {
                ctx.fillStyle = '#FFB8AE';
                ctx.fillRect(c * TILE_SIZE + 8, r * TILE_SIZE + 8, 4, 4);
            } else if (tile === 3) {
                ctx.fillStyle = '#FFB8AE';
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + 10, r * TILE_SIZE + 10, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

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

    ghosts.forEach(g => {
        ctx.fillStyle = g.state === 'frightened' ? '#2121ff' : g.color;
        
        ctx.fillRect(g.x - 8, g.y - 8, 16, 12);
        ctx.beginPath();
        ctx.arc(g.x, g.y - 4, 8, Math.PI, 0);
        ctx.fill();
        
        ctx.fillRect(g.x - 8, g.y + 4, 4, 4);
        ctx.fillRect(g.x - 2, g.y + 4, 4, 4);
        ctx.fillRect(g.x + 4, g.y + 4, 4, 4);
        
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

workMap = MAP.map(row => [...row]);
initGhosts();
gameLoop();
window.game = { resetGame };
