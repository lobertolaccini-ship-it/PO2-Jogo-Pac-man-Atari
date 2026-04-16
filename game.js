/** 
 * ATARI PAC-MAN - VERSÃO ULTRA ESTÁVEL 1.3
 * Correção: Movimentação livre para todos os fantasmas e Pac-man
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

// 1: Parede, 2: Ponto, 0: Vazio
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
    // Margem de colisão reduzida para 4 para dar fluidez
    const m = 4; 
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
        {x: 9 * TILE_SIZE + 10, y: 7 * TILE_SIZE + 10, color: 'red', dir: {x:1, y:0}},
        {x: 9 * TILE_SIZE + 10, y: 9 * TILE_SIZE + 10, color: 'pink', dir: {x:-1, y:0}},
        {x: 7 * TILE_SIZE + 10, y: 9 * TILE_SIZE + 10, color: 'cyan', dir: {x:0, y:1}},
        {x: 11 * TILE_SIZE + 10, y: 9 * TILE_SIZE + 10, color: 'orange', dir: {x:0, y:-1}}
    ];
}

window.addEventListener('keydown', e => {
    if (gameState === 'START') { 
        gameState = 'PLAYING'; 
        if (overlay) overlay.classList.add('hidden'); 
    }
    const keys = {ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0}};
    if (keys[e.key]) pacman.nextDir = keys[e.key];
});

function loop() {
    if (gameState === 'PLAYING') {
        // Lógica Pac-Man
        if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
             const cx = Math.floor(pacman.x/TILE_SIZE)*TILE_SIZE+10;
             const cy = Math.floor(pacman.y/TILE_SIZE)*TILE_SIZE+10;
             if (Math.abs(pacman.x-cx)<6 && Math.abs(pacman.y-cy)<6) {
                 if (canMove(cx, cy, pacman.nextDir.x, pacman.nextDir.y)) {
                     pacman.x = cx; pacman.y = cy;
                     pacman.dir = {...pacman.nextDir};
                 }
             }
        }
        
        if (canMove(pacman.x, pacman.y, pacman.dir.x, pacman.dir.y)) {
            pacman.x += pacman.dir.x * 2;
            pacman.y += pacman.dir.y * 2;
        }

        // Lógica Pontos
        const c = Math.floor(pacman.x / TILE_SIZE), r = Math.floor(pacman.y / TILE_SIZE);
        if (workMap[r] && workMap[r][c] === 2) {
            workMap[r][c] = 0;
            score += 10;
            if (scoreElement) scoreElement.innerText = score.toString().padStart(6, '0');
        }

        // Lógica Fantasmas
        ghosts.forEach(g => {
            // Se bater ou aleatoriamente, muda direção
            if (!canMove(g.x, g.y, g.dir.x, g.dir.y) || Math.random() < 0.05) {
                const d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(dir => canMove(g.x, g.y, dir.x, dir.y));
                if (d.length > 0) g.dir = d[Math.floor(Math.random()*d.length)];
            }
            g.x += g.dir.x * 2;
            g.y += g.dir.y * 2;
            
            // Colisão fantasma
            if (Math.hypot(pacman.x - g.x, pacman.y - g.y) < 15) {
                lives--;
                if (livesElement) livesElement.innerText = lives;
                if (lives <= 0) {
                    gameState = 'GAMEOVER';
                    if (overlay) overlay.classList.remove('hidden');
                    if (messageElement) messageElement.innerText = "GAME OVER";
                } else initEntities();
            }
        });
    }

    // Desenho
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            if (MAP[r][c] === 1) { ctx.fillStyle = 'blue'; ctx.fillRect(c*20+1, r*20+1, 18, 18); }
            if (workMap[r][c] === 2) { ctx.fillStyle = 'white'; ctx.fillRect(c*20+9, r*20+9, 2, 2); }
        }
    }
    
    // Desenhar Pacman
    ctx.fillStyle = 'yellow';
    ctx.beginPath(); ctx.arc(pacman.x, pacman.y, 8, 0, 6.28); ctx.fill();
    
    // Desenhar Fantasmas
    ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.fillRect(g.x-8, g.y-8, 16, 16);
    });
    
    requestAnimationFrame(loop);
}

initEntities();
loop();
