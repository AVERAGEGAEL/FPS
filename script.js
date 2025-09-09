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

// --- DEBUGGER VARIABLES ---
const debug = {
    imageLoaded: false,
    imageWidth: 0,
    bot_0_depth: "N/A",
    bot_0_screenX: "N/A",
    wall_depth_at_bot_X: "N/A",
    is_bot_in_front: "N/A"
};
botSprite.onload = () => { debug.imageLoaded = true; debug.imageWidth = botSprite.width; gameLoop(); };
botSprite.onerror = () => { gameLoop(); };

// --- Controls ---
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// --- MOUSE AND SHOOTING INPUT ---
canvas.addEventListener('click', () => {
    if (player.health <= 0) return;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
    if (document.pointerLockElement === canvas) { shoot(); }
});

function shoot() { /* ... shooting logic is fine ... */ }

// --- Mouselook Handler ---
function updateRotation(e) { /* ... rotation logic is fine ... */ }

// --- Game Logic Update ---
function update() {
    if (player.health <= 0) return;

    // Player Movement
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

    // Bot AI
    bots.forEach(bot => { /* ... bot AI is fine ... */ });

    // Ability Cooldowns
    if (player.markCooldown > 0) player.markCooldown--;
    if (player.markActiveTimer > 0) player.markActiveTimer--;
    if (keys['e'] && player.markCooldown <= 0) {
        player.markCooldown = 600;
        player.markActiveTimer = 180;
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

    if (player.markActiveTimer > 0) { /* ... marker logic is fine ... */ }

    const zBuffer = [];
    for (let x = 0; x < screenWidth; x++) {
        // Wall casting logic is fine
        const cameraX = 2*x/screenWidth-1; const rayDirX = player.dirX+player.planeX*cameraX; const rayDirY = player.dirY+player.planeY*cameraX;
        let mapX = Math.floor(player.x), mapY = Math.floor(player.y);
        let deltaDistX = Math.abs(1/rayDirX), deltaDistY = Math.abs(1/rayDirY);
        let stepX, stepY, sideDistX, sideDistY, hit=0, side;
        if(rayDirX<0){stepX=-1;sideDistX=(player.x-mapX)*deltaDistX;}else{stepX=1;sideDistX=(mapX+1.0-player.x)*deltaDistX;}
        if(rayDirY<0){stepY=-1;sideDistY=(player.y-mapY)*deltaDistY;}else{stepY=1;sideDistY=(mapY+1.0-player.y)*deltaDistY;}
        while(hit===0){if(sideDistX<sideDistY){sideDistX+=deltaDistX;mapX+=stepX;side=0;}else{sideDistY+=deltaDistY;mapY+=stepY;side=1;} if(mapY<0||mapY>=mapHeight||mapX<0||mapX>=mapWidth||map[mapY][mapX]>0)hit=1;}
        const perpWallDist = (side===0)?(mapX-player.x+(1-stepX)/2)/rayDirX:(mapY-player.y+(1-stepY)/2)/rayDirY;
        zBuffer[x] = perpWallDist;
        const lineHeight = Math.floor(screenHeight/perpWallDist);
        let drawStart = -lineHeight/2+screenHeight/2; if(drawStart<0)drawStart=0;
        let drawEnd = lineHeight/2+screenHeight/2; if(drawEnd>=screenHeight)drawEnd=screenHeight-1;
        const color = (side===1)?'#2c3e50':'#34495e';
        ctx.strokeStyle=color; ctx.beginPath(); ctx.moveTo(x,drawStart); ctx.lineTo(x,drawEnd); ctx.stroke();
    }

    botScreenPos.sort((a, b) => b.transformX - a.transformX);
    
    // --- DEBUGGER DATA GATHERING ---
    // We will get data for the first living bot to see what's happening
    const firstBot = botScreenPos.find(p => p.bot.health > 0);
    if (firstBot) {
        debug.bot_0_depth = firstBot.transformX.toFixed(2);
        const screenX = Math.floor((screenWidth / 2) * (1 + firstBot.transformY / firstBot.transformX));
        debug.bot_0_screenX = screenX;
        if (screenX >= 0 && screenX < screenWidth) {
            debug.wall_depth_at_bot_X = zBuffer[screenX].toFixed(2);
            debug.is_bot_in_front = (firstBot.transformX < zBuffer[screenX]);
        }
    }
    
    botScreenPos.forEach(pos => {
        if (pos.bot.health > 0 && pos.transformX > 0) {
            const spriteScreenX = Math.floor((screenWidth / 2) * (1 + pos.transformY / pos.transformX));
            const spriteHeight = Math.abs(Math.floor(screenHeight / pos.transformX));
            const spriteWidth = spriteHeight;
            const drawStartY = Math.floor(-spriteHeight / 2 + screenHeight / 2);
            const drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);

            for (let stripe = drawStartX; stripe < drawStartX + spriteWidth; stripe++) {
                if (stripe >= 0 && stripe < screenWidth && pos.transformX < zBuffer[stripe]) {
                    const texX = Math.floor((stripe - drawStartX) * textureWidth / spriteWidth);
                    if (botSprite.width > 0) {
                        ctx.drawImage(botSprite, texX, 0, 1, textureHeight, stripe, drawStartY, 1, spriteHeight);
                    } else {
                        ctx.fillStyle = "purple";
                        ctx.fillRect(stripe, drawStartY, 1, spriteHeight);
                    }
                }
            }
        }
    });

    // --- Render HUD and Debugger Info ---
    ctx.fillStyle = "white"; ctx.font = "24px Arial"; ctx.fillText("Score: " + score, 10, 30);
    ctx.fillStyle = "red"; ctx.font = "30px Arial"; ctx.fillText(`❤️ ${player.health}`, 10, screenHeight - 20);
    
    // Draw Debugger Box
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(5, 5, 300, 120);
    ctx.fillStyle = "lime";
    ctx.font = "14px monospace";
    ctx.fillText("--- ULTIMATE DEBUGGER ---", 10, 20);
    ctx.fillText(`Image Loaded: ${debug.imageLoaded} (Width: ${debug.imageWidth}px)`, 10, 35);
    ctx.fillText(`Bot 0 Depth (Dist): ${debug.bot_0_depth}`, 10, 50);
    ctx.fillText(`Bot 0 Screen X-Pos: ${debug.bot_0_screenX}`, 10, 65);
    ctx.fillText(`Wall Depth at X-Pos: ${debug.wall_depth_at_bot_X}`, 10, 80);
    ctx.fillText(`Is Visible? (Bot < Wall): ${debug.is_bot_in_front}`, 10, 95);
    ctx.fillText(`Player Pos: (${player.x.toFixed(2)},${player.y.toFixed(2)})`, 10, 110);
    
    // Other HUD elements...
    if (player.health <= 0) { /* ... */ }
    if (playerHitTimer > 0) { /* ... */ playerHitTimer--; }
    if (player.markCooldown <= 0) { /* ... */ } else if (player.markActiveTimer > 0) { /* ... */ } else { /* ... */ }
}

// --- Main Game Loop ---
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// All functions called from here are truncated for brevity but are the same as before
// shoot() { ... }
// updateRotation(e) { ... }
// fullscreenBtn logic { ... }
// versionDisplay logic { ... }
// gameOverScreen logic { ... }
