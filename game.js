/**
 * Atari Pac-Man Clone - Versão Restaurada 1.3
 * Labirinto detalhado e movimentação estável.
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
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
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
    [1,2,2,2,2,2,2,2,2,0,2,2,2,2,2,2,2,2,1],
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

let pacman = {
    x: 0, y: 0, 
    dir: {x:0, y:0}, 
    nextDir: {x:0, y:0}, 
    speed: 2, 
    radius: 8
};

let ghosts = [];

function isWall(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    return !workMap[row] || workMap[row][col] === 1;
}

function canMove(x, y, dx, dy) {
    const m = 5; 
    const nx = x + dx * 2;
    const ny = y + dy * 2;
    return !isWall(nx-m, ny-m) && !isWall(nx+m, ny-m) && !isWall(nx-m, ny+m) && !isWall(nx+m, ny+m);
}

function initEntities() {
    workMap = MAP.map(row => [...row]);
    pacman.x = 9 * TILE_SIZE + 10;
    pacman.y = 15 * TILE_SIZE + 10;
    pacman.dir = {x:0, y:0};
    pacman.nextDir = {x:0, y:0};
    
    ghosts = [
        {x: 190, y: 150, color: '#FF0000', dir: {x:1, y:0}},
        {x: 190, y: 190, color: '#FFB8FF', dir: {x:-1, y:0}},
        {x: 150, y: 190, color: '#00FFFF', dir: {x:0, y:1}},
        {x: 230, y: 190, color: '#FFB852', dir: {x:0, y:-1}}
    ];
}

window.addEventListener('keydown', e => {
    if (gameState === 'START') { 
        gameState = 'PLAYING'; 
        if (overlay) overlay.classList.add('hidden'); 
    }
    const keys = {ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0}};
    if (keys[e.key]) {
        // Imediatamente muda se possível
        if (canMove(pacman.x, pacman.y, keys[e.key].x, keys[e.key].y)) {
             pacman.dir = keys[e.key];
        }
        pacman.nextDir = keys[e.key];
    }
});

function update() {
    // Pacman
    if (canMove(pacman.x, pacman.y, pacman.dir.x, pacman.dir.y)) {
        pacman.x += pacman.dir.x * 2;
        pacman.y += pacman.dir.y * 2;
    }

    // Dots
    const c = Math.floor(pacman.x / TILE_SIZE), r = Math.floor(pacman.y / TILE_SIZE);
    if (workMap[r] && workMap[r][c] === 2) {
        workMap[r][c] = 0;
        score += 10;
        if(scoreElement) scoreElement.innerText = score.toString().padStart(6, '0');
    }

    // Ghosts
    ghosts.forEach(g => {
        if (!canMove(g.x, g.y, g.dir.x, g.dir.y) || Math.random() < 0.05) {
            const d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(dir => canMove(g.x, g.y, dir.x, dir.y));
            if (d.length > 0) g.dir = d[Math.floor(Math.random()*d.length)];
        }
        g.x += g.dir.x * 2;
        g.y += g.dir.y * 2;

        if (Math.hypot(pacman.x - g.x, pacman.y - g.y) < 15) {
            lives--;
            if (livesElement) livesElement.innerText = lives;
            if (lives <= 0) {
                gameState = 'START';
                if (overlay) overlay.classList.remove('hidden');
                if (messageElement) messageElement.innerText = "GAME OVER";
                initEntities();
            } else {
                pacman.x = 9 * 20 + 10;
                pacman.y = 15 * 20 + 10;
                pacman.dir = {x:0, y:0};
            }
        }
    });
}

function draw() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            if (MAP[r][c] === 1) { ctx.fillStyle = '#0000FF'; ctx.fillRect(c*20+1, r*20+1, 18, 18); }
            if (workMap[r][c] === 2) { ctx.fillStyle = '#FFB8AE'; ctx.fillRect(c*20+9, r*20+9, 2, 2); }
        }
    }
    ctx.fillStyle = 'yellow'; ctx.beginPath(); ctx.arc(pacman.x, pacman.y, 8, 0, 6.28); ctx.fill();
    ghosts.forEach(g => { ctx.fillStyle = g.color; ctx.fillRect(g.x-8, g.y-8, 16, 16); });
}

function loop() {
    if (gameState === 'PLAYING') update();
    draw();
    requestAnimationFrame(loop);
}

initEntities();
loop();
