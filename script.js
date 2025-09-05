// Get the canvas and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Settings ---
const screenWidth = 640;
const screenHeight = 480;
canvas.width = screenWidth;
canvas.height = screenHeight;

// --- Map ---
// 1 represents a wall, 0 is an empty space.
const mapWidth = 16;
const mapHeight = 16;
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,1,0,1,1,1,0,1,0,0,1],
    [1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,1],
    [1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,1,1,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,0,0,0,0,0,1,0,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,1,1,1,1,0,0,1],
    [1,0,1,0,1,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// --- Player ---
const player = {
    x: 8.0,
    y: 8.0,
    dirX: -1.0,
    dirY: 0.0,
    planeX: 0.0,
    planeY: 0.66,
    moveSpeed: 0.05,
    rotSpeed: 0.03
};

// --- NEW: Collectible Treasure ---
const treasure = {
    x: 3.5,
    y: 3.5,
    collected: false
};
const initialPlayerPos = {x: player.x, y: player.y}; // Store initial positions for reset

// --- Keyboard Input ---
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function updateGame() {
    // Move forward/backward (with Arrow Keys and WASD)
    if (keys['w'] || keys['arrowup']) {
        if (map[Math.floor(player.x + player.dirX * player.moveSpeed)][Math.floor(player.y)] === 0) player.x += player.dirX * player.moveSpeed;
        if (map[Math.floor(player.x)][Math.floor(player.y + player.dirY * player.moveSpeed)] === 0) player.y += player.dirY * player.moveSpeed;
    }
    if (keys['s'] || keys['arrowdown']) {
        if (map[Math.floor(player.x - player.dirX * player.moveSpeed)][Math.floor(player.y)] === 0) player.x -= player.dirX * player.moveSpeed;
        if (map[Math.floor(player.x)][Math.floor(player.y - player.dirY * player.moveSpeed)] === 0) player.y -= player.dirY * player.moveSpeed;
    }

    // Rotate left/right (with Arrow Keys and WASD)
    if (keys['d'] || keys['arrowright']) {
        const oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(-player.rotSpeed) - player.dirY * Math.sin(-player.rotSpeed);
        player.dirY = oldDirX * Math.sin(-player.rotSpeed) + player.dirY * Math.cos(-player.rotSpeed);
        const oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(-player.rotSpeed) - player.planeY * Math.sin(-player.rotSpeed);
        player.planeY = oldPlaneX * Math.sin(-player.rotSpeed) + player.planeY * Math.cos(-player.rotSpeed);
    }
    if (keys['a'] || keys['arrowleft']) {
        const oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(player.rotSpeed) - player.dirY * Math.sin(player.rotSpeed);
        player.dirY = oldDirX * Math.sin(player.rotSpeed) + player.dirY * Math.cos(player.rotSpeed);
        const oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(player.rotSpeed) - player.planeY * Math.sin(player.rotSpeed);
        player.planeY = oldPlaneX * Math.sin(player.rotSpeed) + player.planeY * Math.cos(player.rotSpeed);
    }

    // --- NEW: Check for Win Condition ---
    const distToTreasure = Math.sqrt((player.x - treasure.x)**2 + (player.y - treasure.y)**2);
    if (distToTreasure < 0.5 && !treasure.collected) {
        treasure.collected = true;
        alert("You found the treasure! You win!");
        // Reset game
        player.x = initialPlayerPos.x;
        player.y = initialPlayerPos.y;
        treasure.collected = false;
    }
}

function render() {
    // Draw Sky and Floor
    ctx.fillStyle = '#3498db';
    ctx.fillRect(0, 0, screenWidth, screenHeight / 2);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight / 2);

    const zBuffer = []; // Array to store wall distances for each vertical stripe

    // Ray Casting for Walls
    for (let x = 0; x < screenWidth; x++) {
        const cameraX = 2 * x / screenWidth - 1;
        const rayDirX = player.dirX + player.planeX * cameraX;
        const rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);

        let deltaDistX = Math.abs(1 / rayDirX);
        let deltaDistY = Math.abs(1 / rayDirY);
        let stepX, stepY, sideDistX, sideDistY, hit = 0, side;

        if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
        else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
        else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

        while (hit === 0) {
            if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
            else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            if (map[mapX][mapY] > 0) hit = 1;
        }

        const perpWallDist = (side === 0) ? (mapX - player.x + (1 - stepX) / 2) / rayDirX : (mapY - player.y + (1 - stepY) / 2) / rayDirY;
        zBuffer[x] = perpWallDist; // Store distance in z-buffer

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

    // --- NEW: Sprite (Treasure) Rendering ---
    if (!treasure.collected) {
        const spriteX = treasure.x - player.x;
        const spriteY = treasure.y - player.y;

        const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY); // Depth
        const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY); // Screen X

        if (transformX > 0) { // Check if sprite is in front of the player
            const spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformY / transformX));
            const spriteHeight = Math.abs(Math.floor(screenHeight / transformX));
            const spriteWidth = spriteHeight;

            const drawStartY = -spriteHeight / 2 + screenHeight / 2;
            const drawStartX = -spriteWidth / 2 + spriteScreenX;

            // Loop through the sprite's vertical stripes
            for (let stripe = Math.floor(drawStartX); stripe < Math.floor(drawStartX + spriteWidth); stripe++) {
                // Check if the stripe is on screen and in front of a wall
                if (stripe > 0 && stripe < screenWidth && transformX < zBuffer[stripe]) {
                    ctx.beginPath();
                    ctx.fillStyle = "yellow"; // Treasure color
                    ctx.arc(stripe, drawStartY + spriteHeight / 2, spriteWidth / 10, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}

function gameLoop() {
    updateGame();
    render();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
