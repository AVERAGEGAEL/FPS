// Get the canvas and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const abilityHud = document.getElementById('ability-hud');

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

// --- Assets ---
const botSprite = new Image();
botSprite.src = 'bot_sprite.png';
const textureWidth = 64;
const textureHeight = 64;

// --- Player ---
const player = { x: 1.5, y: 1.5, dirX: 1.0, dirY: 0.0, planeX: 0.0, planeY: 0.66, moveSpeed: 0.05, health: 100, markCooldown: 0, markActiveTimer: 0 };
const mouseSensitivity = 0.002;
let playerHitTimer = 0;

// --- CPU Bots ---
let bots = [
    { x: 4.5, y: 4.5, health: 100, speed: 0.02, shootCooldown: 120 },
    { x: 10.5, y: 2.5, health: 100, speed: 0.02, shootCooldown: 120 },
    { x: 8.5, y: 12.5, health: 100, speed: 0.02, shootCooldown: 120 }
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
    if (player.health <= 0) return;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
    if (document.pointerLockElement === canvas) {
        shoot();
    }
});

function shoot() {
    gunshotSound.currentTime = 0;
    gunshotSound.play();
    bots.forEach(bot => {
        if (bot.health > 0) {
            const dist = Math.sqrt((player.x - bot.x)**2 + (player.y - bot.y)**2);
            const vecX = (bot.x - player.x) / dist;
            const vecY = (bot.y - player.y) / dist;
            const dotProduct = player.dirX * vecX + player.dirY * vecY;
            if (dotProduct > 0.98 && dist < 15) {
                bot.health -= 34;
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

// --- Game Logic Update ---
function update() {
    if (player.health <= 0) return;

    // --- Player Movement ---
    const moveSpeed = player.moveSpeed;
    let moveX = 0, moveY = 0;
    if (keys['w'] || keys['arrowup']) { moveX += player.dirX; moveY += player.dirY; }
    if (keys['s'] || keys['arrowdown']) { moveX -= player.dirX; moveY -= player.dirY; }
    if (keys['a'] || keys['arrowleft']) { moveX -= player.planeX; moveY -= player.planeY; }
    if (keys['d'] || keys['arrowright']) { moveX += player.planeX; moveY += player.planeY; }

    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
    if (magnitude > 0) {
        moveX = (moveX / magnitude) * moveSpeed;
        moveY = (moveY / magnitude) * moveSpeed;
    }
    const nextX = player.x + moveX;
    const nextY = player.y + moveY;
    if (map[Math.floor(player.y)][Math.floor(nextX)] === 0) player.x = nextX;
    if (map[Math.floor(nextY)][Math.floor(player.x)] === 0) player.y = nextY;

    // --- Bot AI and Movement ---
    bots.forEach(bot => {
        if (bot.health > 0) {
            const dist = Math.sqrt((player.x - bot.x)**2 + (player.y - bot.y)**2);
            bot.shootCooldown--;
            let hasLineOfSight = true;
            const steps = Math.floor(dist * 4);
            if (steps > 0) {
                for (let i = 0; i < steps; i++) {
                    const checkX = Math.floor(bot.x + (player.x - bot.x) * (i / steps));
                    const checkY = Math.floor(bot.y + (player.y - bot.y) * (i / steps));
                    if (map[checkY][checkX] === 1) {
                        hasLineOfSight = false;
                        break;
                    }
                }
            }
            if (hasLineOfSight && dist > 1) {
                const botMoveX = ((player.x - bot.x) / dist) * bot.speed;
                const botMoveY = ((player.y - bot.y) / dist) * bot.speed;
                const botNextX = bot.x + botMoveX;
                const botNextY = bot.y + botMoveY;
                if (map[Math.floor(bot.y)][Math.floor(botNextX)] === 0) bot.x = botNextX;
                if (map[Math.floor(botNextY)][Math.floor(bot.x)] === 0) bot.y = botNextY;
                if (bot.shootCooldown <= 0) {
                    player.health -= 10;
                    if(player.health < 0) player.health = 0;
                    playerHitTimer = 10;
                    bot.shootCooldown = 120 + Math.random() * 60;
                }
            }
        }
    });

    // --- Ability Cooldown Logic ---
    if (player.markCooldown > 0) player.markCooldown--;
    if (player.markActiveTimer > 0) player.markActiveTimer--;
    if (keys['e'] && player.markCooldown <= 0) {
        player.markCooldown = 600; // 10 seconds
        player.markActiveTimer = 180; // 3 seconds
    }
}

function render() {
    const botScreenPos = [];
    bots.forEach(bot => {
        const spriteX = bot.x - player.x;
        const spriteY = bot.y - player.y;
        const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);
        botScreenPos.push({ transformX, transformY, bot });
    });

    ctx.fillStyle = '#3498db'; ctx.fillRect(0, 0, screenWidth, screenHeight / 2);
    ctx.fillStyle = '#7f8c8d'; ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight / 2);

    if (player.markActiveTimer > 0) {
        botScreenPos.forEach(pos => {
            if (pos.bot.health > 0 && pos.transformX > 0) {
                const spriteScreenX = Math.floor((screenWidth / 2) * (1 + pos.transformY / pos.transformX));
                const spriteHeight = Math.abs(Math.floor(screenHeight / pos.transformX));
                const drawStartY = Math.floor(-spriteHeight / 2 + screenHeight / 2);
                ctx.beginPath();
                ctx.arc(spriteScreenX, drawStartY + spriteHeight / 2, spriteHeight / 2, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
                ctx.fill();
            }
        });
    }

    const zBuffer = [];
    for (let x = 0; x < screenWidth; x++) {
        const cameraX = 2 * x / screenWidth - 1;
        const rayDirX = player.dirX + player.planeX * cameraX;
        const rayDirY = player.dirY + player.planeY * cameraX;
        let mapX = Math.floor(player.x), mapY = Math.floor(player.y);
        let deltaDistX = Math.abs(1 / rayDirX), deltaDistY = Math.abs(1 / rayDirY);
        let stepX, stepY, sideDistX, sideDistY, hit = 0, side;
        if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; } else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; } else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }
        while (hit === 0) {
            if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; } else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            if (mapY < 0 || mapY >= mapHeight || mapX < 0 || mapX >= mapWidth || map[mapY][mapX] > 0) hit = 1;
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

    botScreenPos.sort((a, b) => b.transformX - a.transformX);
    botScreenPos.forEach(pos => {
        if (pos.bot.health > 0 && pos.transformX > 0) {
            const spriteScreenX = Math.floor((screenWidth / 2) * (1 + pos.transformY / pos.transformX));
            const spriteHeight = Math.abs(Math.floor(screenHeight / pos.transformX));
            const spriteWidth = spriteHeight;
            const drawStartY = Math.floor(-spriteHeight / 2 + screenHeight / 2);
            const drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
            
            let isVisible = false;
            for(let i = drawStartX; i < drawStartX + spriteWidth; i++) {
                if (i >= 0 && i < screenWidth && pos.transformX < zBuffer[i]) {
                    isVisible = true;
                    break;
                }
            }
            if (isVisible) {
                // --- FINAL FIX: Draw sprite if loaded, otherwise draw a purple box ---
                if (botSprite.width > 0) {
                    ctx.drawImage(botSprite, 0, 0, textureWidth, textureHeight, drawStartX, drawStartY, spriteWidth, spriteHeight);
                } else {
                    ctx.fillStyle = "purple"; // Fallback color
                    ctx.fillRect(drawStartX, drawStartY, spriteWidth, spriteHeight);
                }
            }
        }
    });

    ctx.fillStyle = "white"; ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 10, 30);
    ctx.fillStyle = "red"; ctx.font = "30px Arial";
    ctx.fillText(`❤️ ${player.health}`, 10, screenHeight - 20);
    if (playerHitTimer > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.05 * playerHitTimer})`;
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        playerHitTimer--;
    }
    if (player.markCooldown <= 0) {
        abilityHud.textContent = "Marker Ready (E)"; abilityHud.style.color = "#00FF00";
    } else if (player.markActiveTimer > 0) {
        abilityHud.textContent = `Marker Active! ${(player.markActiveTimer / 60).toFixed(1)}s`; abilityHud.style.color = "#FFFF00";
    } else {
        abilityHud.textContent = `Cooldown ${(player.markCooldown / 60).toFixed(1)}s`; abilityHud.style.color = "#FF0000";
    }
    if (player.health <= 0) {
        document.exitPointerLock();
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
}

// --- Main Game Loop ---
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

botSprite.onload = () => { gameLoop(); };
botSprite.onerror = () => { gameLoop(); }; // Start the game even if the sprite fails, so we can see the fallback

// --- Fullscreen Button Logic ---
const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', () => {
    const elem = document.body;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
});

// --- Version Display ---
const gameVersion = "8.1-fallback";
const updateTimestamp = new Date().toLocaleDateString();
const versionDisplay = document.getElementById('version-info');
versionDisplay.textContent = `v${gameVersion} | ${updateTimestamp}`;

// --- Add Game Over HTML and Restart Logic ---
const gameOverScreen = document.createElement('div');
gameOverScreen.id = 'gameOverScreen';
gameOverScreen.innerHTML = `<div><h1>YOU DIED</h1><p style="font-size: 24px;">Click to Restart</p></div>`;
document.body.appendChild(gameOverScreen);
gameOverScreen.addEventListener('click', () => { document.location.reload(); });
