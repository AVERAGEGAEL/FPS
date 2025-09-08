// Get the canvas and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Settings ---
const screenWidth = 640;
const screenHeight = 480;
canvas.width = screenWidth;
canvas.height = screenHeight;

// --- Map ---
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,0,1,0,0,0,0,1,1,0,0,0,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,0,0,0,1,0,0,1],
    [1,0,0,0,0,1,1,0,0,0,0,0,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,1,1,0,0,1],
    [1,0,1,1,1,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,1,1,1,1,0,0,1],
    [1,0,1,0,1,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// --- Player ---
const player = { x: 2.5, y: 2.5, dirX: -1.0, dirY: 0.0, planeX: 0.0, planeY: 0.66, moveSpeed: 0.05, rotSpeed: 0.03 };

// --- NEW: Mouselook ---
const mouseSensitivity = 0.002;

// --- Targets and Game State ---
let targets = [
    { x: 4.5, y: 4.5, health: 100 },
    { x: 10.5, y: 2.5, health: 100 },
    { x: 8.5, y: 12.5, health: 100 }
];
let score = 0;
const gunshotSound = new Audio('shot.wav');
gunshotSound.volume = 0.5;

// --- Controls ---
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// --- MOUSE AND SHOOTING INPUT ---
canvas.addEventListener('click', () => {
    // Request pointer lock to capture the mouse
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
    
    // The shooting logic now only runs if the pointer is locked
    if(document.pointerLockElement === canvas) {
        shoot();
    }
});

function shoot() {
    gunshotSound.currentTime = 0;
    gunshotSound.play();

    targets.forEach(target => {
        if (target.health > 0) {
            const dist = Math.sqrt((player.x - target.x)**2 + (player.y - target.y)**2);
            const targetVecX = (target.x - player.x) / dist;
            const targetVecY = (target.y - player.y) / dist;
            const dotProduct = player.dirX * targetVecX + player.dirY * targetVecY;
            if (dotProduct > 0.98 && dist < 10) {
                target.health -= 25;
                if (target.health <= 0) {
                    score += 100;
                }
            }
        }
    });
}

// --- NEW: Mouse Movement Handler for Mouselook ---
function updateRotation(e) {
    // Only rotate if the pointer is locked
    if (document.pointerLockElement === canvas) {
        const rotSpeed = e.movementX * mouseSensitivity;
        
        const oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(-rotSpeed) - player.dirY * Math.sin(-rotSpeed);
        player.dirY = oldDirX * Math.sin(-rotSpeed) + player.dirY * Math.cos(-rotSpeed);
        
        const oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(-rotSpeed) - player.planeY * Math.sin(-rotSpeed);
        player.planeY = oldPlaneX * Math.sin(-rotSpeed) + player.planeY * Math.cos(-rotSpeed);
    }
}
document.addEventListener('mousemove', updateRotation);


function updateGame() {
    // Movement (WASD and Arrow Keys)
    if (keys['w'] || keys['arrowup']) {
        const moveVecX = player.dirX * player.moveSpeed;
        const moveVecY = player.dirY * player.moveSpeed;
        if (map[Math.floor(player.x + moveVecX)][Math.floor(player.y)] === 0) player.x += moveVecX;
        if (map[Math.floor(player.x)][Math.floor(player.y + moveVecY)] === 0) player.y += moveVecY;
    }
    if (keys['s'] || keys['arrowdown']) {
        const moveVecX = player.dirX * player.moveSpeed;
        const moveVecY = player.dirY * player.moveSpeed;
        if (map[Math.floor(player.x - moveVecX)][Math.floor(player.y)] === 0) player.x -= moveVecX;
        if (map[Math.floor(player.x)][Math.floor(player.y - moveVecY)] === 0) player.y -= moveVecY;
    }

    // Strafing (A and D keys) - Changed from rotation to strafing
    if (keys['d']) {
        const strafeVecX = player.planeX * player.moveSpeed;
        const strafeVecY = player.planeY * player.moveSpeed;
        if (map[Math.floor(player.x + strafeVecX)][Math.floor(player.y)] === 0) player.x += strafeVecX;
        if (map[Math.floor(player.x)][Math.floor(player.y + strafeVecY)] === 0) player.y += strafeVecY;
    }
    if (keys['a']) {
        const strafeVecX = player.planeX * player.moveSpeed;
        const strafeVecY = player.planeY * player.moveSpeed;
        if (map[Math.floor(player.x - strafeVecX)][Math.floor(player.y)] === 0) player.x -= strafeVecX;
        if (map[Math.floor(player.x)][Math.floor(player.y - strafeVecY)] === 0) player.y -= strafeVecY;
    }
}

function render() {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(0, 0, screenWidth, screenHeight / 2);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight / 2);

    const zBuffer = [];

    for (let x = 0; x < screenWidth; x++) {
        const cameraX = 2 * x / screenWidth - 1;
        const rayDirX = player.dirX + player.planeX * cameraX;
        const rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);
        let deltaDistX = Math.abs(1 / rayDirX);
        let deltaDistY = Math.abs(1 / rayDirY);
        let stepX, stepY, sideDistX, sideDistY, hit = 0, side;

        if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; } else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; } else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

        while (hit === 0) {
            if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; } else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            if (map[mapX][mapY] > 0) hit = 1;
        }

        const perpWallDist = (side === 0) ? (mapX - player.x + (1 - stepX) / 2) / rayDirX : (mapY - player.y + (1 - stepY) / 2) / rayDirY;
        zBuffer[x] = perpWallDist;

        const lineHeight = Math.floor(screenHeight / perpWallDist);
        let drawStart = -lineHeight / 2 + screenHeight / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + screenHeight / 2;
        if (drawEnd >= screenHeight) drawEnd = screenHeight - 1;

        const color = (side === 1) ? '#2c3e50' : '#34495e';
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, drawStart);
        ctx.lineTo(x, drawEnd);
        ctx.stroke();
    }

    targets.sort((a, b) => ((player.x - b.x)**2 + (player.y - b.y)**2) - ((player.x - a.x)**2 + (player.y - a.y)**2));
    targets.forEach(target => {
        if (target.health > 0) {
            const spriteX = target.x - player.x;
            const spriteY = target.y - player.y;
            const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
            const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
            const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);
            if (transformX > 0) {
                const spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformY / transformX));
                const spriteHeight = Math.abs(Math.floor(screenHeight / transformX));
                const spriteWidth = spriteHeight;
                const drawStartY = Math.floor(-spriteHeight / 2 + screenHeight / 2);
                const drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
                const drawEndX = Math.floor(spriteWidth / 2 + spriteScreenX);
                for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                    if (stripe >= 0 && stripe < screenWidth && transformX < zBuffer[stripe]) {
                        ctx.fillStyle = "red";
                        ctx.fillRect(stripe, drawStartY, 1, spriteHeight);
                    }
                }
            }
        }
    });

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

function gameLoop() {
    updateGame();
    render();
    requestAnimationFrame(gameLoop);
}
gameLoop();

const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', () => {
    const elem = document.body; 
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
});
