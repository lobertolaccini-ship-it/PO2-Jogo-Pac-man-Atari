/**
 * ATARI PAC-MAN - VERSÃO 1.5 FINAL
 * Foco: Movimentação Fluida + Sistema de Vidas e Reinício
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
    [1,2,2,2,2,2,2,2,2,0,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,0,0,0,0,0,0,0,0,0,2,2,2,2,1],
    [1,2,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,2,1],
    [1,2,2,2,2,1,0,0,0,0,0,0,0,1,2,2,2,2,1],
    [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,1,1,0,0,0,1,1,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,1,1,0,0,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,0,0,0,0,1,0,0,0,0,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,0,0,0,0,0,0,0,0,0,0,0,2,2,2,1], 
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
let pacman = { x: 190, y: 310, dir: {x:0, y:0}, speed:3 };
let ghosts = [];

function isWall(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    return !workMap[row] || workMap[row][col] === 1;
}

function canMove(x, y, dx, dy, speed = 2) {
    const nx = x + dx * speed;
    const ny = y + dy * speed;
    const m = 6; 
    return !isWall(nx-m, ny-m) && !isWall(nx+m, ny-m) && !isWall(nx-m, ny+m) && !isWall(nx+m, ny+m);
}

function init(resetMap = false) {
    if (resetMap) {
        workMap = MAP.map(row => [...row]);
        score = 0;
        lives = 3;
        if(scoreElement) scoreElement.innerText = "000000";
        if(livesElement) livesElement.innerText = "3";
    }
    pacman.x = 190; pacman.y = 310; pacman.dir = {x:0,y:0};
    ghosts = [
        {x: 60, y: 60, color: '#FF0000', dir: {x:1, y:0}},
        {x: 320, y: 60, color: '#FFB8FF', dir: {x:-1, y:0}},
        {x: 60, y: 360, color: '#00FFFF', dir: {x:0, y:-1}},
        {x: 320, y: 360, color: '#FFB852', dir: {x:0, y:1}}
    ];
}

window.addEventListener('keydown', e => {
    if (gameState === 'START' || gameState === 'GAMEOVER') {
        const triggers = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (triggers.includes(e.key)) {
            init(true);
            gameState = 'PLAYING';
            if (overlay) overlay.classList.add('hidden');
        }
        return;
    }
    
    if (e.key === 'ArrowUp')    pacman.dir = {x:0, y:-1};
    if (e.key === 'ArrowDown')  pacman.dir = {x:0, y:1};
    if (e.key === 'ArrowLeft')  pacman.dir = {x:-1, y:0};
    if (e.key === 'ArrowRight') pacman.dir = {x:1, y:0};
});

function update() {
    // Pacman Move
    if (canMove(pacman.x, pacman.y, pacman.dir.x, pacman.dir.y, pacman.speed)) {
        pacman.x += pacman.dir.x * pacman.speed;
        pacman.y += pacman.dir.y * pacman.speed;
    }

    // Points
    const c = Math.floor(pacman.x/20), r = Math.floor(pacman.y/20);
    if (workMap[r] && workMap[r][c] === 2) {
        workMap[r][c] = 0;
        score += 10;
        if(scoreElement) scoreElement.innerText = score.toString().padStart(6, '0');
    }

    // Ghosts
    ghosts.forEach(g => {
        if (!canMove(g.x, g.y, g.dir.x, g.dir.y, 2) || Math.random() < 0.05) {
            const d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(dir => canMove(g.x, g.y, dir.x, dir.y, 2));
            if (d.length > 0) g.dir = d[Math.floor(Math.random()*d.length)];
        }
        g.x += g.dir.x * 2; g.y += g.dir.y * 2;

        // Life Detection
        if (Math.hypot(pacman.x - g.x, pacman.y - g.y) < 16) {
            lives--;
            if (livesElement) livesElement.innerText = lives;
            if (lives <= 0) {
                gameState = 'GAMEOVER';
                if (overlay) overlay.classList.remove('hidden');
                if (messageElement) messageElement.innerText = "GAME OVER";
            } else {
                init(false); // Reset positions but keep dots/score
            }
        }
    });

    // Win Check
    if (workMap.flat().filter(t => t === 2).length === 0) {
        gameState = 'GAMEOVER';
        if (overlay) overlay.classList.remove('hidden');
        if (messageElement) messageElement.innerText = "YOU WIN!";
    }
}

function draw() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            if (MAP[r][c] === 1) { ctx.fillStyle = '#0000FF'; ctx.fillRect(c*20+1, r*20+1, 18, 18); }
            if (workMap[r][c] === 2) { ctx.fillStyle = '#FFB8AE'; ctx.fillRect(c*tileX=c*20+9, tileY=r*20+9, 3, 3); }
        }
    }
    // Fixed dot drawing loop
    ctx.fillStyle = '#FFB8AE';
    for(let r=0; r<ROWS; r++) for(let c=0; c<COLS; c++) if(workMap[r][c] === 2) ctx.fillRect(c*20+9, r*20+9, 3, 3);

    ctx.fillStyle = 'yellow'; ctx.beginPath(); ctx.arc(pacman.x, pacman.y, 9, 0, 6.28); ctx.fill();
    ghosts.forEach(g => { ctx.fillStyle = g.color; ctx.fillRect(g.x-8, g.y-8, 16, 16); });
}

function loop() {
    if (gameState === 'PLAYING') update();
    draw();
    requestAnimationFrame(loop);
}

init(true);
loop();
