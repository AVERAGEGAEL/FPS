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
const player = { x: 2.5, y: 2.5, dirX: -1.0, dirY: 0.0, planeX: 0.0, planeY: 0.66, moveSpeed: 0.05 };
const mouseSensitivity = 0.002;

// --- Targets and Game State ---
let targets = [
    { x: 4.5, y: 4.5, health: 100 },
    { x: 10.5, y: 2.5, health: 100 },
    { x: 8.5, y: 12.5, health: 100 }
];
let score = 0;
const gunshotSound = new Audio('shot.wav');
gunshotSound.volume = 0.3;

// --- DEBUGGER VARIABLES ---
let debugInfo = {
    keyPressed: "None",
    playerPos: "",
    isMoving: false,
    targetTileValue: null
};

// --- Controls ---
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    debugInfo.keyPressed = e.key.toLowerCase(); // Update debugger
});
document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    debugInfo.keyPressed = "None"; // Update debugger
});

// --- MOUSE AND SHOOTING INPUT ---
canvas.addEventListener('click', () => {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
});

// --- Mouselook Handler ---
function updateRotation(e) {
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

// --- *** STABLE MOVEMENT LOGIC WITH DEBUGGING *** ---
function updateGame() {
    const moveSpeed = player.moveSpeed;
    let moveX = 0;
    let moveY = 0;

    // Reset debug flag
    debugInfo.isMoving = false;

    // GATHER INPUTS
    if (keys['w'] || keys['arrowup']) {
        moveX += player.dirX;
        moveY += player.dirY;
        debugInfo.isMoving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        moveX -= player.dirX;
        moveY -= player.dirY;
        debugInfo.isMoving = true;
    }
    if (keys['a']) {
        moveX -= player.planeX;
        moveY -= player.planeY;
        debugInfo.isMoving = true;
    }
    if (keys['d']) {
        moveX += player.planeX;
        moveY += player.planeY;
        debugInfo.isMoving = true;
    }

    // NORMALIZE MOVEMENT VECTOR
    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
    if (magnitude > 0) {
        moveX = (moveX / magnitude) * moveSpeed;
        moveY = (moveY / magnitude) * moveSpeed;
    }

    // SIMPLE COLLISION CHECK
    const nextX = player.x + moveX;
    const nextY = player.y + moveY;
    const nextMapX = Math.floor(nextX);
    const nextMapY = Math.floor(nextY);
    
    // Update debugger with what it's about to check
    if (nextMapY >= 0 && nextMapY < mapHeight && nextMapX >= 0 && nextMapX < mapWidth) {
        debugInfo.targetTileValue = `Tile (${nextMapX},${nextMapY}) is ${map[nextMapY][nextMapX]}`;
    } else {
        debugInfo.targetTileValue = "OUT OF BOUNDS";
    }

    // If the destination tile is NOT a wall (is 0), then allow the move.
    if (map[nextMapY] !== undefined && map[nextMapY][nextMapX] === 0) {
        player.x = nextX;
        player.y = nextY;
    }
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
    
    // --- *** NEW DEBUGGER DISPLAY *** ---
    // This draws the debug info on top of the game screen.
    debugInfo.playerPos = `Pos: (${player.x.toFixed(2)}, ${player.y.toFixed(2)})`;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(5, 5, 250, 80);
    
    ctx.fillStyle = "white";
    ctx.font = "14px monospace";
    ctx.fillText("--- DEBUGGER ---", 10, 20);
    ctx.fillText(`Key Pressed: ${debugInfo.keyPressed}`, 10, 35);
    ctx.fillText(debugInfo.playerPos, 10, 50);
    ctx.fillText(`Attempting Move: ${debugInfo.isMoving}`, 10, 65);
    ctx.fillText(debugInfo.targetTileValue, 10, 80);
}

// --- Main Game Loop ---
function gameLoop() {
    updateGame();
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
