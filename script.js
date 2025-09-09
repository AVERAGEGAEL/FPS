// Get the canvas and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Settings ---
const screenWidth = 640;
const screenHeight = 480;
canvas.width = screenWidth;
canvas.height = screenHeight;

// --- Map ---
const mapHeight = 16;
const mapWidth = 16;
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
const player = { x: 1.5, y: 1.5, dirX: 1.0, dirY: 0.0, planeX: 0.0, planeY: 0.66, moveSpeed: 0.05 };
const mouseSensitivity = 0.002;

// --- NEW: CPU Bots ---
let bots = [
    { x: 4.5, y: 4.5, health: 100, speed: 0.02 },
    { x: 10.5, y: 2.5, health: 100, speed: 0.02 },
    { x: 8.5, y: 12.5, health: 100, speed: 0.02 }
];
let score = 0;
const gunshotSound = new Audio('shot.wav');
gunshotSound.volume = 0.3;

// --- Controls ---
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// --- MOUSE AND SHOOTING INPUT ---
canvas.addEventListener('click', () => {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
    if (document.pointerLockElement === canvas) {
        shoot();
    }
});

// UPDATED to shoot bots
function shoot() {
    gunshotSound.currentTime = 0;
    gunshotSound.play();
    bots.forEach(bot => {
        if (bot.health > 0) {
            const dist = Math.sqrt((player.x - bot.x)**2 + (player.y - bot.y)**2);
            const vecX = (bot.x - player.x) / dist;
            const vecY = (bot.y - player.y) / dist;
            const dotProduct = player.dirX * vecX + player.dirY * vecY;
            if (dotProduct > 0.98 && dist < 15) { // Check if bot is in front of player
                bot.health -= 34; // 3-4 shots to kill
                if (bot.health <= 0) {
                    bot.health = 0;
                    score += 100;
                }
            }
        }
    });
}

// --- Mouselook Handler ---
function updateRotation(e) {
    if (document.pointerLockElement === canvas) {
        const rotSpeed = e.movementX * mouseSensitivity;
        const oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(rotSpeed) - player.dirY * Math.sin(rotSpeed);
        player.dirY = oldDirX * Math.sin(rotSpeed) + player.dirY * Math.cos(rotSpeed);
        const oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed);
        player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
    }
}
document.addEventListener('mousemove', updateRotation);

// --- Player Movement Logic ---
function updatePlayerMovement() {
    const moveSpeed = player.moveSpeed;
    let moveX = 0;
    let moveY = 0;

    if (keys['w'] || keys['arrowup']) {
        moveX += player.dirX;
        moveY += player.dirY;
    }
    if (keys['s'] || keys['arrowdown']) {
        moveX -= player.dirX;
        moveY -= player.dirY;
    }
    if (keys['a'] || keys['arrowleft']) {
        moveX -= player.planeX;
        moveY -= player.planeY;
    }
    if (keys['d'] || keys['arrowright']) {
        moveX += player.planeX;
        moveY += player.planeY;
    }

    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
    if (magnitude > 0) {
        moveX = (moveX / magnitude) * moveSpeed;
        moveY = (moveY / magnitude) * moveSpeed;
    }
    
    const nextX = player.x + moveX;
    const nextY = player.y + moveY;
    
    if (map[Math.floor(player.y)][Math.floor(nextX)] === 0) {
        player.x = nextX;
    }
    if (map[Math.floor(nextY)][Math.floor(player.x)] === 0) {
        player.y = nextY;
    }
}

// --- NEW: Bot AI and Movement ---
function updateBots() {
    bots.forEach(bot => {
        if (bot.health > 0) {
            const dist = Math.sqrt((player.x - bot.x)**2 + (player.y - bot.y)**2);
            
            // Check for line of sight
            let hasLineOfSight = true;
            const steps = Math.floor(dist * 2); // Check every half a grid square
            for (let i = 0; i < steps; i++) {
                const checkX = Math.floor(bot.x + (player.x - bot.x) * (i / steps));
                const checkY = Math.floor(bot.y + (player.y - bot.y) * (i / steps));
                if (map[checkY][checkX] === 1) {
                    hasLineOfSight = false;
                    break;
                }
            }

            // If bot sees player and is not too close, it chases
            if (hasLineOfSight && dist > 1) {
                const moveX = ((player.x - bot.x) / dist) * bot.speed;
                const moveY = ((player.y - bot.y) / dist) * bot.speed;
                const nextX = bot.x + moveX;
                const nextY = bot.y + moveY;
                
                if (map[Math.floor(bot.y)][Math.floor(nextX)] === 0) bot.x = nextX;
                if (map[Math.floor(nextY)][Math.floor(bot.x)] === 0) bot.y = nextY;
            }
        }
    });
}


function render() {
    // Draw sky and floor
    ctx.fillStyle = '#3498db';
    ctx.fillRect(0, 0, screenWidth, screenHeight / 2);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight / 2);

    const zBuffer = [];

    // Ray casting for walls
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
            if (mapY < 0 || mapY >= mapHeight || mapX < 0 || mapX >= mapWidth || map[mapY][mapX] > 0) {
                hit = 1;
            }
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

    // --- NEW: Render Bots ---
    // Sort bots from farthest to nearest
    bots.sort((a, b) => ((player.x - b.x)**2 + (player.y - b.y)**2) - ((player.x - a.x)**2 + (player.y - a.y)**2));

    bots.forEach(bot => {
        if (bot.health > 0) {
            const spriteX = bot.x - player.x;
            const spriteY = bot.y - player.y;
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
                        ctx.fillStyle = "green"; // Bots are green
                        ctx.fillRect(stripe, drawStartY, 1, spriteHeight);
                    }
                }
            }
        }
    });

    // Render HUD
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

// --- Main Game Loop ---
function gameLoop() {
    updatePlayerMovement();
    updateBots();
    render();
    requestAnimationFrame(gameLoop);
}
gameLoop();

// --- Fullscreen Button Logic ---
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

// --- Version Display ---
const gameVersion = "6.0-bots";
const updateTimestamp = new Date().toLocaleDateString();
const versionDisplay = document.getElementById('version-info');
versionDisplay.textContent = `v${gameVersion} | ${updateTimestamp}`;
