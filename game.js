/**
 * Atari Pac-Man Clone - Estável com Auto-Start
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const messageElement = document.getElementById('message');

const TILE_SIZE = 20;
const ROWS = 21;
const COLS = 19;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

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
let gameState = 'START';
let powerModeTimer = null;

let pacman = {
    x: 0, y: 0, dir: {x:0, y:0}, nextDir: {x:0, y:0}, speed: 2, radius: 8, mouth: 0, mouthOpen: 1
};

const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
let ghosts = [];

function canMove(x, y, dir, speed) {
    const nextX = x + dir.x * speed;
    const nextY = y + dir.y * speed;
    const p = 8; // Padding strito para não entrar nas paredes
    const corners = [
        {x: nextX-p, y: nextY-p}, {x: nextX+p, y: nextY-p},
        {x: nextX-p, y: nextY+p}, {x: nextX+p, y: nextY+p}
    ];
    for (let c of corners) {
        let col = Math.floor(c.x / TILE_SIZE);
        let row = Math.floor(c.y / TILE_SIZE);
        if (workMap[row] && workMap[row][col] === 1) return false;
    }
    return true;
}

function initEntities() {
    pacman.x = 9 * TILE_SIZE + TILE_SIZE/2;
    pacman.y = 15 * TILE_SIZE + TILE_SIZE/2;
    pacman.dir = {x:0, y:0};
    pacman.nextDir = {x:0, y:0};
    
    const cx = 9 * TILE_SIZE + TILE_SIZE/2;
    const cy = 9 * TILE_SIZE + TILE_SIZE/2;
    ghosts = ghostColors.map((color, i) => ({
        x: cx + (i-1.5)*TILE_SIZE, y: cy, color: color, 
        dir: {x: 0, y: -1}, speed: 2, state: 'normal'
    }));
}

function resetGame() {
    workMap = MAP.map(row => [...row]);
    score = 0;
    lives = 3;
    if (scoreElement) scoreElement.innerText = "000000";
    if (livesElement) livesElement.innerText = "3";
    initEntities();
    if (overlay) overlay.classList.add('hidden');
}

window.addEventListener('keydown', (e) => {
    // START TRIGGER
    if (gameState !== 'PLAYING' && gameState !== 'FRIGHTENED') {
        const triggers = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (triggers.includes(e.key)) {
            resetGame();
            gameState = 'PLAYING';
        }
    }
    
    // INPUT DURING GAME
    if (gameState === 'PLAYING' || gameState === 'FRIGHTENED') {
        const keys = {ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0}};
        if (keys[e.key]) pacman.nextDir = keys[e.key];
    }
});

function update() {
    // Pac-Man Logic
    if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
        const cx = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        const cy = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        // Permite virar se estiver próximo ao centro do tile
        if (Math.abs(pacman.x - cx) < 6 && Math.abs(pacman.y - cy) < 6) {
           if (canMove(cx, cy, pacman.nextDir, pacman.speed)) {
               pacman.x = cx; pacman.y = cy;
               pacman.dir = {...pacman.nextDir};
           }
        }
    }
    
    if (canMove(pacman.x, pacman.y, pacman.dir, pacman.speed)) {
        pacman.x += pacman.dir.x * pacman.speed;
        pacman.y += pacman.dir.y * pacman.speed;
    }

    // Wrap around
    if (pacman.x < 0) pacman.x = canvas.width;
    if (pacman.x > canvas.width) pacman.x = 0;

    // Collect Dots
    const c = Math.floor(pacman.x / TILE_SIZE), r = Math.floor(pacman.y / TILE_SIZE);
    if (workMap[r] && workMap[r][c] > 1) {
        if (workMap[r][c] === 3) {
            gameState = 'FRIGHTENED';
            ghosts.forEach(g => g.state = 'frightened');
            clearTimeout(powerModeTimer);
            powerModeTimer = setTimeout(() => { 
                if (gameState === 'FRIGHTENED') gameState = 'PLAYING'; 
                ghosts.forEach(g => g.state = 'normal'); 
            }, 7000);
        }
        score += workMap[r][c] === 2 ? 10 : 50;
        workMap[r][c] = 0;
        if (scoreElement) scoreElement.innerText = score.toString().padStart(6, '0');
    }

    // Ghost Logic
    ghosts.forEach(g => {
        const s = g.state === 'frightened' ? 1 : g.speed;
        const cx = Math.floor(g.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        const cy = Math.floor(g.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        
        const atCenter = Math.abs(g.x - cx) < 3 && Math.abs(g.y - cy) < 3;
        
        if (!canMove(g.x, g.y, g.dir, s) || atCenter) {
            const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d => 
                (d.x !== -g.dir.x || d.y !== -g.dir.y) && canMove(g.x, g.y, d, s)
            );
            if (dirs.length > 0 && (Math.random() < 0.3 || !canMove(g.x, g.y, g.dir, s))) {
                g.dir = dirs[Math.floor(Math.random() * dirs.length)];
            }
        }
        
        if (canMove(g.x, g.y, g.dir, s)) {
            g.x += g.dir.x * s;
            g.y += g.dir.y * s;
        }

        // Ghost collision
        if (Math.hypot(pacman.x - g.x, pacman.y - g.y) < 16) {
            if (g.state === 'frightened') {
                score += 200; g.x = 9*TILE_SIZE+10; g.y = 9*TILE_SIZE+10; g.state = 'normal';
            } else {
                lives--; if (livesElement) livesElement.innerText = lives;
                if (lives <= 0) { 
                    gameState = 'GAMEOVER'; 
                    if (overlay) overlay.classList.remove('hidden'); 
                    if (messageElement) messageElement.innerText = "GAME OVER"; 
                } else initEntities();
            }
        }
    });

    // Win condition
    if (workMap.flat().filter(t => t > 1).length === 0) {
        gameState = 'WON'; 
        if (overlay) overlay.classList.remove('hidden'); 
        if (messageElement) messageElement.innerText = "YOU WIN!";
    }
}

function draw() {
    ctx.fillStyle = 'black'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let r=0; r<ROWS; r++) {
        for (let c=0; c<COLS; c++) {
            if (MAP[r][c] === 1) { 
                ctx.fillStyle = 'blue'; 
                ctx.fillRect(c*20+1, r*20+1, 18, 18); 
            }
            if (workMap[r][c] === 2) { 
                ctx.fillStyle = 'white'; 
                ctx.fillRect(c*20+8, r*20+8, 4, 4); 
            }
            if (workMap[r][c] === 3) { 
                ctx.fillStyle = 'white'; 
                ctx.beginPath(); 
                ctx.arc(c*20+10, r*20+10, 6, 0, 6.28); 
                ctx.fill(); 
            }
        }
    }
    
    // Pacman Draw
    ctx.fillStyle = 'yellow'; 
    ctx.beginPath(); 
    ctx.arc(pacman.x, pacman.y, pacman.radius, 0.2, 6.08); 
    ctx.lineTo(pacman.x, pacman.y);
    ctx.fill();
    
    // Ghosts Draw
    ghosts.forEach(g => {
        ctx.fillStyle = g.state === 'frightened' ? 'blue' : g.color;
        ctx.fillRect(g.x-8, g.y-8, 16, 16);
    });
}

function loop() {
    if (gameState === 'PLAYING' || gameState === 'FRIGHTENED') update();
    draw();
    requestAnimationFrame(loop);
}

workMap = MAP.map(row => [...row]);
initEntities();
loop();
