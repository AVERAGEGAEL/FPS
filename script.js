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
    x: 8.0,         // Player's starting X position
    y: 8.0,         // Player's starting Y position
    dirX: -1.0,     // Direction vector X component
    dirY: 0.0,      // Direction vector Y component
    planeX: 0.0,    // Camera plane X component
    planeY: 0.66,   // Camera plane Y component (determines field of view)
    moveSpeed: 0.05,
    rotSpeed: 0.03
};

// --- Keyboard Input ---
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function updatePlayer() {
    // Move forward/backward
    if (keys['w']) {
        if (map[Math.floor(player.x + player.dirX * player.moveSpeed)][Math.floor(player.y)] === 0) {
            player.x += player.dirX * player.moveSpeed;
        }
        if (map[Math.floor(player.x)][Math.floor(player.y + player.dirY * player.moveSpeed)] === 0) {
            player.y += player.dirY * player.moveSpeed;
        }
    }
    if (keys['s']) {
        if (map[Math.floor(player.x - player.dirX * player.moveSpeed)][Math.floor(player.y)] === 0) {
            player.x -= player.dirX * player.moveSpeed;
        }
        if (map[Math.floor(player.x)][Math.floor(player.y - player.dirY * player.moveSpeed)] === 0) {
            player.y -= player.dirY * player.moveSpeed;
        }
    }

    // Rotate left/right
    if (keys['d']) {
        const oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(-player.rotSpeed) - player.dirY * Math.sin(-player.rotSpeed);
        player.dirY = oldDirX * Math.sin(-player.rotSpeed) + player.dirY * Math.cos(-player.rotSpeed);
        const oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(-player.rotSpeed) - player.planeY * Math.sin(-player.rotSpeed);
        player.planeY = oldPlaneX * Math.sin(-player.rotSpeed) + player.planeY * Math.cos(-player.rotSpeed);
    }
    if (keys['a']) {
        const oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(player.rotSpeed) - player.dirY * Math.sin(player.rotSpeed);
        player.dirY = oldDirX * Math.sin(player.rotSpeed) + player.dirY * Math.cos(player.rotSpeed);
        const oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(player.rotSpeed) - player.planeY * Math.sin(player.rotSpeed);
        player.planeY = oldPlaneX * Math.sin(player.rotSpeed) + player.planeY * Math.cos(player.rotSpeed);
    }
}


function render() {
    // Draw Sky and Floor
    ctx.fillStyle = '#3498db'; // Sky blue
    ctx.fillRect(0, 0, screenWidth, screenHeight / 2);
    ctx.fillStyle = '#7f8c8d'; // Gray floor
    ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight / 2);

    // Ray Casting
    for (let x = 0; x < screenWidth; x++) {
        const cameraX = 2 * x / screenWidth - 1; // x-coordinate in camera space
        const rayDirX = player.dirX + player.planeX * cameraX;
        const rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);

        let deltaDistX = Math.abs(1 / rayDirX);
        let deltaDistY = Math.abs(1 / rayDirY);

        let stepX, stepY;
        let sideDistX, sideDistY;
        let hit = 0;
        let side;

        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (player.x - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
        }

        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (player.y - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
        }

        // DDA (Digital Differential Analysis) algorithm
        while (hit === 0) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0; // Wall hit on X side
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1; // Wall hit on Y side
            }
            if (map[mapX][mapY] > 0) hit = 1;
        }

        let perpWallDist;
        if (side === 0) {
            perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
        } else {
            perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
        }

        // Calculate height of line to draw on screen
        const lineHeight = Math.floor(screenHeight / perpWallDist);

        // Calculate lowest and highest pixel to fill in current stripe
        let drawStart = -lineHeight / 2 + screenHeight / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + screenHeight / 2;
        if (drawEnd >= screenHeight) drawEnd = screenHeight - 1;

        // Choose wall color
        let color = '#34495e'; // A dark blue color
        if (side === 1) {
            color = '#2c3e50'; // A slightly different shade for Y-side walls
        }

        // Draw the vertical stripe
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, drawStart);
        ctx.lineTo(x, drawEnd);
        ctx.stroke();
    }
}


function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop); // This creates a smooth animation loop
}

// Start the game loop
requestAnimationFrame(gameLoop);
