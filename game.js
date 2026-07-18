// ===================================
// WHO MOVED MY CHEESE? - THE GAME
// Game Logic & Engine
// ===================================

// --- Game State ---
const GameState = {
    currentScreen: 'loading-screen',
    selectedCharacter: null,
    difficulty: 'easy',
    score: 0,
    timeLeft: 60,
    level: 1,
    lives: 3,
    cheeseCollected: 0,
    isPlaying: false,
    isPaused: false,
    maze: [],
    mazeWidth: 0,
    mazeHeight: 0,
    cellSize: 0,
    player: { x: 0, y: 0 },
    multiplayer: false,
    selectedCharacter2: null,
    player2: { x: 0, y: 0 },
    score2: 0,
    cheese: { x: 0, y: 0, type: 'regular', moving: false, warningTimer: 0 },
    cheeseMoveInterval: null,
    gameTimer: null,
    cheeseWarningTimer: null,
    lastKeyTime: 0,
    quotes: [
        "The faster you let go of old cheese, the sooner you find new cheese.",
        "It is safer to search the maze for new cheese.",
        "What you fear is never as bad as what you imagine.",
        "Change happens. Anticipate, adapt, and enjoy change.",
        "The only thing that is constant is change.",
        "When you change what you believe, you change what you do.",
        "Movement in a new direction helps you find new cheese.",
        "They may move your cheese, but you can find new cheese too!",
        "If you do not change, you can become extinct.",
        "Notice the small changes. It prepares you for the big changes to come."
    ],
    resultQuotes: [
        "Everyone is changing their cheese. The question is, are you?",
        "If you are not afraid to wander in the maze, you will find more cheese.",
        "You can change what you feel by changing what you do and think.",
        "Sometimes you need to hold on tight to your cheese... and sometimes let it go."
    ],
    characters: {
        sniff: {
            name: 'Sniff',
            icon: '🐭',
            description: 'Smells out change early',
            ability: 'Cheese warning appears 2 seconds earlier',
            abilityClass: 'sniff',
            stats: { speed: 1, perception: 3, adaptability: 1 }
        },
        scurry: {
            name: 'Scurry',
            icon: '🐹',
            description: 'Runs fast through the maze',
            ability: 'Move 2 cells instead of 1 (double speed)',
            abilityClass: 'scurry',
            stats: { speed: 3, perception: 1, adaptability: 1 }
        },
        hem: {
            name: 'Hem',
            icon: '🐀',
            description: 'Resists change but learns',
            ability: '+1 extra life at start',
            abilityClass: 'hem',
            stats: { speed: 1, perception: 1, adaptability: 2 }
        },
        haw: {
            name: 'Haw',
            icon: '🦉',
            description: 'Sees the big picture',
            ability: 'Can see cheese location on minimap',
            abilityClass: 'haw',
            stats: { speed: 1, perception: 2, adaptability: 3 }
        }
    },
    leaderboard: {
        easy: JSON.parse(localStorage.getItem('cheese_leaderboard_easy') || '[]'),
        medium: JSON.parse(localStorage.getItem('cheese_leaderboard_medium') || '[]'),
        hard: JSON.parse(localStorage.getItem('cheese_leaderboard_hard') || '[]')
    }
};

// --- Canvas Setup ---
const canvas = document.getElementById('maze-canvas');
const ctx = canvas.getContext('2d');

// --- Screen Management ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    GameState.currentScreen = screenId;
}

function showMainMenu() {
    stopGame();
    showScreen('main-menu');
    populateMenuCharacters();
}

function showCharacterSelect() {
    GameState.selectedCharacter = null;
    GameState.selectedCharacter2 = null;
    showScreen('character-select');
    populateCharacterGrid();
    updateCharSelectSubtitle();
}

function startSinglePlayerSelect() {
    GameState.multiplayer = false;
    showCharacterSelect();
}

function startMultiplayerSelect() {
    GameState.multiplayer = true;
    showCharacterSelect();
}

function updateCharSelectSubtitle() {
    const subtitle = document.getElementById('select-subtitle');
    if (!subtitle) return;
    if (!GameState.multiplayer) {
        subtitle.textContent = 'Each cheese eater has unique abilities!';
    } else if (!GameState.selectedCharacter) {
        subtitle.textContent = 'Player 1: choose your character (Arrow Keys)';
    } else {
        subtitle.textContent = 'Player 2: choose your character (WASD)';
    }
}

function showInstructions() {
    document.getElementById('instructions-modal').classList.add('active');
}

function showLeaderboard() {
    document.getElementById('leaderboard-modal').classList.add('active');
    switchLeaderboardTab(GameState.difficulty);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// --- Character Selection ---
function populateMenuCharacters() {
    const grid = document.getElementById('menu-char-grid');
    if (grid.children.length > 0) return; // Already populated
    
    Object.entries(GameState.characters).forEach(([key, char]) => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.innerHTML = `
            <div class="char-icon">${char.icon}</div>
            <div class="char-name">${char.name}</div>
        `;
        card.onclick = () => {
            GameState.multiplayer = false;
            GameState.selectedCharacter2 = null;
            GameState.selectedCharacter = key;
            showScreen('difficulty-select');
        };
        grid.appendChild(card);
    });
}

function populateCharacterGrid() {
    const grid = document.getElementById('char-grid');
    grid.innerHTML = '';

    Object.entries(GameState.characters).forEach(([key, char]) => {
        const card = document.createElement('div');
        card.className = 'char-card' + (key === GameState.selectedCharacter ? ' selected' : '');
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="char-icon">${char.icon}</div>
            <div class="char-name">${char.name}</div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">${char.description}</p>
            <p style="font-size: 0.75rem; color: var(--primary); margin-top: 0.5rem;">${char.ability}</p>
        `;
        card.onclick = () => selectCharacter(key);
        grid.appendChild(card);
    });
}

function selectCharacter(key) {
    if (!GameState.multiplayer) {
        GameState.selectedCharacter = key;
        showScreen('difficulty-select');
        return;
    }

    if (!GameState.selectedCharacter) {
        GameState.selectedCharacter = key;
        populateCharacterGrid();
        updateCharSelectSubtitle();
        return;
    }

    if (key === GameState.selectedCharacter) return; // players need different characters

    GameState.selectedCharacter2 = key;
    showScreen('difficulty-select');
}

// --- Maze Generation (Recursive Backtracker) ---
function generateMaze(width, height) {
    const maze = [];
    for (let y = 0; y < height; y++) {
        maze[y] = [];
        for (let x = 0; x < width; x++) {
            maze[y][x] = {
                top: true, right: true, bottom: true, left: true,
                visited: false
            };
        }
    }
    
    const stack = [];
    let current = { x: 0, y: 0 };
    maze[0][0].visited = true;
    let visitedCount = 1;
    const totalCells = width * height;
    
    while (visitedCount < totalCells) {
        const neighbors = getUnvisitedNeighbors(current, maze, width, height);
        
        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            stack.push(current);
            removeWall(maze, current, next);
            current = next;
            maze[current.y][current.x].visited = true;
            visitedCount++;
        } else if (stack.length > 0) {
            current = stack.pop();
        }
    }
    
    return maze;
}

function getUnvisitedNeighbors(current, maze, width, height) {
    const neighbors = [];
    const { x, y } = current;
    
    if (y > 0 && !maze[y - 1][x].visited) neighbors.push({ x, y: y - 1 });
    if (x < width - 1 && !maze[y][x + 1].visited) neighbors.push({ x: x + 1, y });
    if (y < height - 1 && !maze[y + 1][x].visited) neighbors.push({ x, y: y + 1 });
    if (x > 0 && !maze[y][x - 1].visited) neighbors.push({ x: x - 1, y });
    
    return neighbors;
}

function removeWall(maze, current, next) {
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    
    if (dx === 1) { maze[current.y][current.x].right = false; maze[next.y][next.x].left = false; }
    if (dx === -1) { maze[current.y][current.x].left = false; maze[next.y][next.x].right = false; }
    if (dy === 1) { maze[current.y][current.x].bottom = false; maze[next.y][next.x].top = false; }
    if (dy === -1) { maze[current.y][current.x].top = false; maze[next.y][next.x].bottom = false; }
}

// --- Game Initialization ---
function startGame(difficulty) {
    GameState.difficulty = difficulty;
    GameState.score = 0;
    GameState.score2 = 0;
    GameState.level = 1;
    GameState.cheeseCollected = 0;

    // Set lives based on character ability
    GameState.lives = GameState.selectedCharacter === 'hem' ? 4 : 3; // Hem gets +1 life

    // Set time based on difficulty
    switch (difficulty) {
        case 'easy': GameState.timeLeft = 90; break;
        case 'medium': GameState.timeLeft = 60; break;
        case 'hard': GameState.timeLeft = 45; break;
    }

    // Set maze size based on level
    updateMazeSize();

    // Generate maze
    GameState.maze = generateMaze(GameState.mazeWidth, GameState.mazeHeight);

    // Place players at opposite corners of the start
    GameState.player = { x: 0, y: 0 };
    GameState.player2 = { x: GameState.mazeWidth - 1, y: GameState.mazeHeight - 1 };

    // Place cheese at farthest point
    placeCheese();

    // Setup canvas
    setupCanvas();

    // Start game
    GameState.isPlaying = true;
    GameState.isPaused = false;
    showScreen('game-screen');

    toggleMultiplayerUI();
    updateUI();
    updateQuote();
    drawGame();

    // Start timers
    startGameTimer();
    startCheeseMovement();

    // Hide hint after 3 seconds
    const hint = document.getElementById('player-hint');
    if (hint) {
        hint.textContent = GameState.multiplayer
            ? 'P1: Arrow Keys · P2: WASD'
            : 'Use Arrow Keys or WASD to move';
        hint.style.display = '';
    }
    setTimeout(() => {
        if (hint) hint.style.display = 'none';
    }, 3000);
}

function toggleMultiplayerUI() {
    const p2Stats = document.getElementById('p2-stats');
    if (p2Stats) p2Stats.style.display = GameState.multiplayer ? 'flex' : 'none';
    const scoreLabel = document.getElementById('score-label');
    if (scoreLabel) scoreLabel.textContent = GameState.multiplayer ? 'P1 Score' : 'Score';
}

function updateMazeSize() {
    const levelBonus = Math.min(GameState.level - 1, 6);
    
    switch (GameState.difficulty) {
        case 'easy':
            GameState.mazeWidth = 8 + levelBonus;
            GameState.mazeHeight = 6 + levelBonus;
            break;
        case 'medium':
            GameState.mazeWidth = 10 + levelBonus;
            GameState.mazeHeight = 8 + levelBonus;
            break;
        case 'hard':
            GameState.mazeWidth = 12 + levelBonus;
            GameState.mazeHeight = 10 + levelBonus;
            break;
    }
}

function placeCheese() {
    let cheeseX, cheeseY;
    let attempts = 0;
    
    do {
        cheeseX = Math.floor(Math.random() * GameState.mazeWidth);
        cheeseY = Math.floor(Math.random() * GameState.mazeHeight);
        attempts++;
    } while ((cheeseX === GameState.player.x && cheeseY === GameState.player.y) && attempts < 100);
    
    // Ensure cheese is always reachable via BFS
    if (!isReachable(GameState.player.x, GameState.player.y, cheeseX, cheeseY)) {
        const reachable = getReachableCells(GameState.player.x, GameState.player.y);
        let candidates = reachable.filter(c => !(c.x === GameState.player.x && c.y === GameState.player.y));
        if (candidates.length === 0) {
            candidates = [{ x: cheeseX, y: cheeseY }];
        }
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        cheeseX = pick.x;
        cheeseY = pick.y;
    }
    
    // Determine cheese type
    const rand = Math.random();
    let cheeseType = 'regular';
    if (GameState.level >= 3 && rand < 0.1) {
        cheeseType = 'golden';
    } else if (rand < 0.3) {
        cheeseType = 'double';
    }
    
    GameState.cheese = {
        x: cheeseX,
        y: cheeseY,
        type: cheeseType,
        moving: false,
        warningTimer: 0
    };
    
    updateCheeseStatus();
}

// BFS to check if target is reachable from start
function isReachable(startX, startY, targetX, targetY) {
    const visited = new Set();
    const queue = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);
    
    while (queue.length > 0) {
        const { x, y } = queue.shift();
        if (x === targetX && y === targetY) return true;
        
        const cell = GameState.maze[y][x];
        const neighbors = [];
        if (!cell.top && y > 0) neighbors.push({ x, y: y - 1 });
        if (!cell.right && x < GameState.mazeWidth - 1) neighbors.push({ x: x + 1, y });
        if (!cell.bottom && y < GameState.mazeHeight - 1) neighbors.push({ x, y: y + 1 });
        if (!cell.left && x > 0) neighbors.push({ x: x - 1, y });
        
        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                queue.push(n);
            }
        }
    }
    return false;
}

// Get all cells reachable from a starting position
function getReachableCells(startX, startY) {
    const result = [];
    const visited = new Set();
    const queue = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);
    
    while (queue.length > 0) {
        const { x, y } = queue.shift();
        result.push({ x, y });
        
        const cell = GameState.maze[y][x];
        const neighbors = [];
        if (!cell.top && y > 0) neighbors.push({ x, y: y - 1 });
        if (!cell.right && x < GameState.mazeWidth - 1) neighbors.push({ x: x + 1, y });
        if (!cell.bottom && y < GameState.mazeHeight - 1) neighbors.push({ x, y: y + 1 });
        if (!cell.left && x > 0) neighbors.push({ x: x - 1, y });
        
        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                queue.push(n);
            }
        }
    }
    return result;
}

function setupCanvas() {
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 200;
    
    const cellWidth = Math.floor(maxWidth / GameState.mazeWidth);
    const cellHeight = Math.floor(maxHeight / GameState.mazeHeight);
    GameState.cellSize = Math.min(cellWidth, cellHeight, 60);
    
    canvas.width = GameState.mazeWidth * GameState.cellSize;
    canvas.height = GameState.mazeHeight * GameState.cellSize;
}

// --- Game Timer ---
function startGameTimer() {
    clearInterval(GameState.gameTimer);
    GameState.gameTimer = setInterval(() => {
        if (!GameState.isPaused && GameState.isPlaying) {
            GameState.timeLeft--;
            updateUI();
            
            if (GameState.timeLeft <= 0) {
                endGame();
            }
            
            // Warning at 10 seconds
            if (GameState.timeLeft === 10) {
                document.getElementById('timer').style.color = 'var(--danger)';
            }
        }
    }, 1000);
}

// --- Cheese Movement ---
function startCheeseMovement() {
    clearInterval(GameState.cheeseMoveInterval);
    
    let moveInterval;
    switch (GameState.difficulty) {
        case 'easy': moveInterval = 8000 - (GameState.level * 500); break;
        case 'medium': moveInterval = 5000 - (GameState.level * 300); break;
        case 'hard': moveInterval = 3000 - (GameState.level * 200); break;
    }
    
    moveInterval = Math.max(moveInterval, 1500); // Minimum 1.5 seconds
    
    GameState.cheeseMoveInterval = setInterval(() => {
        if (!GameState.isPaused && GameState.isPlaying) {
            moveCheese();
        }
    }, moveInterval);
}

function moveCheese() {
    if (GameState.cheese.moving) return;
    
    // Show warning first
    GameState.cheese.moving = true;
    GameState.cheese.warningTimer = 1500; // 1.5 second warning
    
    updateCheeseStatus();
    drawGame();
    
    setTimeout(() => {
        if (!GameState.isPlaying) return;
        
        let newX = GameState.cheese.x;
        let newY = GameState.cheese.y;
        
        // Find valid moves (cells with no walls)
        const cell = GameState.maze[newY][newX];
        const possibleMoves = [];
        
        if (!cell.top && newY > 0) possibleMoves.push({ x: newX, y: newY - 1 });
        if (!cell.right && newX < GameState.mazeWidth - 1) possibleMoves.push({ x: newX + 1, y: newY });
        if (!cell.bottom && newY < GameState.mazeHeight - 1) possibleMoves.push({ x: newX, y: newY + 1 });
        if (!cell.left && newX > 0) possibleMoves.push({ x: newX - 1, y: newY });
        
        if (possibleMoves.length > 0) {
            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            newX = move.x;
            newY = move.y;
        }
        
        // Don't place cheese on a player
        const onPlayer = (x, y) =>
            (x === GameState.player.x && y === GameState.player.y) ||
            (GameState.multiplayer && x === GameState.player2.x && y === GameState.player2.y);

        if (onPlayer(newX, newY)) {
            // Try to find another spot
            for (const move of possibleMoves) {
                if (!onPlayer(move.x, move.y)) {
                    newX = move.x;
                    newY = move.y;
                    break;
                }
            }
        }
        
        GameState.cheese.x = newX;
        GameState.cheese.y = newY;
        GameState.cheese.moving = false;
        
        updateCheeseStatus();
        drawGame();
    }, 1500);
}

function updateCheeseStatus() {
    const statusEl = document.getElementById('cheese-status');
    if (GameState.cheese.moving) {
        statusEl.textContent = '🟡 Moving Soon!';
        statusEl.style.color = 'var(--warning)';
    } else {
        statusEl.textContent = '🟢 Stable';
        statusEl.style.color = 'var(--secondary)';
    }
}

// --- Drawing ---
function drawGame() {
    if (!ctx) return;
    
    const cs = GameState.cellSize;
    const maze = GameState.maze;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze walls
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    for (let y = 0; y < GameState.mazeHeight; y++) {
        for (let x = 0; x < GameState.mazeWidth; x++) {
            const cell = maze[y][x];
            const px = x * cs;
            const py = y * cs;
            
            if (cell.top) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + cs, py);
                ctx.stroke();
            }
            if (cell.right) {
                ctx.beginPath();
                ctx.moveTo(px + cs, py);
                ctx.lineTo(px + cs, py + cs);
                ctx.stroke();
            }
            if (cell.bottom) {
                ctx.beginPath();
                ctx.moveTo(px, py + cs);
                ctx.lineTo(px + cs, py + cs);
                ctx.stroke();
            }
            if (cell.left) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, py + cs);
                ctx.stroke();
            }
        }
    }
    
    // Draw cheese path hint for Haw
    if (GameState.selectedCharacter === 'haw') {
        drawCheesePath(GameState.player);
    }
    if (GameState.multiplayer && GameState.selectedCharacter2 === 'haw') {
        drawCheesePath(GameState.player2);
    }

    // Draw cheese
    drawCheese();

    // Draw players
    drawPlayer(GameState.player, GameState.selectedCharacter);
    if (GameState.multiplayer) {
        drawPlayer(GameState.player2, GameState.selectedCharacter2);
    }
}

function drawCheese() {
    const cs = GameState.cellSize;
    const cx = GameState.cheese.x * cs + cs / 2;
    const cy = GameState.cheese.y * cs + cs / 2;
    const size = cs * 0.35;
    
    // Glow effect
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 2);
    let glowColor;
    switch (GameState.cheese.type) {
        case 'golden':
            glow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
            break;
        case 'double':
            glow.addColorStop(0, 'rgba(255, 165, 0, 0.4)');
            glow.addColorStop(1, 'rgba(255, 165, 0, 0)');
            break;
        default:
            glow.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
            glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    }
    ctx.fillStyle = glow;
    ctx.fillRect(cx - size * 2, cy - size * 2, size * 4, size * 4);
    
    // Cheese emoji
    let cheeseEmoji;
    switch (GameState.cheese.type) {
        case 'golden': cheeseEmoji = '✨🧀'; break;
        case 'double': cheeseEmoji = '🧀🧀'; break;
        default: cheeseEmoji = '🧀';
    }
    
    ctx.font = `${size * 1.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cheeseEmoji, cx, cy);
}

function drawPlayer(player, characterKey) {
    const cs = GameState.cellSize;
    const char = GameState.characters[characterKey];
    const px = player.x * cs + cs / 2;
    const py = player.y * cs + cs / 2;
    const size = cs * 0.4;
    
    // Glow effect
    const glow = ctx.createRadialGradient(px, py, 0, px, py, size * 1.5);
    glow.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    glow.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(px - size * 2, py - size * 2, size * 4, size * 4);
    
    // Player emoji
    ctx.font = `${size * 1.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char.icon, px, py);
}

function drawCheesePath(player) {
    // Simple path visualization for Haw's ability
    const cs = GameState.cellSize;
    const startX = player.x * cs + cs / 2;
    const startY = player.y * cs + cs / 2;
    const endX = GameState.cheese.x * cs + cs / 2;
    const endY = GameState.cheese.y * cs + cs / 2;
    
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
}

// --- Player Movement ---
function movePlayer(player, dx, dy, characterKey) {
    const char = GameState.characters[characterKey];
    const stepCount = char.abilityClass === 'scurry' ? 2 : 1;

    // Try to move up to stepCount cells in the desired direction, stopping at walls
    let moved = false;
    for (let i = 0; i < stepCount; i++) {
        const nx = player.x + dx;
        const ny = player.y + dy;

        // Must stay within maze bounds
        if (nx < 0 || nx >= GameState.mazeWidth || ny < 0 || ny >= GameState.mazeHeight) break;

        // Check wall between current cell and next cell
        const currentCell = GameState.maze[player.y][player.x];
        let blocked = false;
        if (dy === -1 && currentCell.top) blocked = true;
        if (dy ===  1 && currentCell.bottom) blocked = true;
        if (dx ===  1 && currentCell.right) blocked = true;
        if (dx === -1 && currentCell.left) blocked = true;

        if (blocked) break; // Wall ahead, stop here

        player.x = nx;
        player.y = ny;
        moved = true;
    }

    return moved;
}

document.addEventListener('keydown', (e) => {
    if (!GameState.isPlaying || GameState.isPaused) return;

    if (e.key === ' ') {
        e.preventDefault();
        pauseGame();
        return;
    }

    let moved = false;

    if (GameState.multiplayer) {
        let dx = 0, dy = 0;
        switch (e.key) {
            case 'ArrowUp':    dy = -1; break;
            case 'ArrowRight': dx =  1; break;
            case 'ArrowDown':  dy =  1; break;
            case 'ArrowLeft':  dx = -1; break;
        }

        if (dx !== 0 || dy !== 0) {
            moved = movePlayer(GameState.player, dx, dy, GameState.selectedCharacter);
        } else {
            let dx2 = 0, dy2 = 0;
            switch (e.key) {
                case 'w': case 'W': dy2 = -1; break;
                case 'd': case 'D': dx2 =  1; break;
                case 's': case 'S': dy2 =  1; break;
                case 'a': case 'A': dx2 = -1; break;
                default: return; // Ignore other keys
            }
            moved = movePlayer(GameState.player2, dx2, dy2, GameState.selectedCharacter2);
        }
    } else {
        let dx = 0, dy = 0;
        switch (e.key) {
            case 'ArrowUp':    case 'w': case 'W': dy = -1; break;
            case 'ArrowRight': case 'd': case 'D': dx =  1; break;
            case 'ArrowDown':  case 's': case 'S': dy =  1; break;
            case 'ArrowLeft':  case 'a': case 'A': dx = -1; break;
            default: return; // Ignore other keys
        }
        moved = movePlayer(GameState.player, dx, dy, GameState.selectedCharacter);
    }

    if (moved) {
        drawGame();
        checkCheeseCollision();
    }
});

// --- Cheese Collision ---
function checkCheeseCollision() {
    if (GameState.player.x === GameState.cheese.x && GameState.player.y === GameState.cheese.y) {
        collectCheese(1);
        return;
    }
    if (GameState.multiplayer && GameState.player2.x === GameState.cheese.x && GameState.player2.y === GameState.cheese.y) {
        collectCheese(2);
    }
}

function collectCheese(playerNum = 1) {
    let points = 0;
    switch (GameState.cheese.type) {
        case 'golden': points = 50; break;
        case 'double': points = 25; break;
        default: points = 10;
    }

    // Speed bonus for easy/medium
    if (GameState.timeLeft > 30) {
        points = Math.floor(points * 1.2);
    }

    if (playerNum === 2) {
        GameState.score2 += points;
    } else {
        GameState.score += points;
    }
    GameState.cheeseCollected++;

    // Level up every 5 cheese
    if (GameState.cheeseCollected % 5 === 0) {
        GameState.level++;
        addTime();
        updateMazeSize();
        GameState.maze = generateMaze(GameState.mazeWidth, GameState.mazeHeight);
        GameState.player = { x: 0, y: 0 };
        GameState.player2 = { x: GameState.mazeWidth - 1, y: GameState.mazeHeight - 1 };
    }
    
    // Play collect animation
    showFloatingText(`+${points}`, GameState.cheese.x, GameState.cheese.y);
    
    updateUI();
    updateQuote();
    placeCheese();
    drawGame();
    
    // Restart cheese movement timer
    startCheeseMovement();
}

function addTime() {
    GameState.timeLeft += 10;
}

function showFloatingText(text, x, y) {
    const cs = GameState.cellSize;
    const px = x * cs + cs / 2;
    const py = y * cs + cs / 2;
    
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
        position: absolute;
        left: ${px}px;
        top: ${py}px;
        color: var(--primary);
        font-size: 1.5rem;
        font-weight: bold;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
        z-index: 100;
    `;
    
    document.querySelector('.maze-wrapper').appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// Add floating text animation
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-50px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// --- UI Updates ---
function updateUI() {
    document.getElementById('score').textContent = GameState.score;
    document.getElementById('timer').textContent = GameState.timeLeft;
    document.getElementById('level').textContent = GameState.level;
    document.getElementById('lives').textContent = GameState.lives;
    if (GameState.multiplayer) {
        document.getElementById('score2').textContent = GameState.score2;
    }
}

function updateQuote() {
    const quoteEl = document.getElementById('maze-quote');
    if (quoteEl) {
        quoteEl.textContent = `"${GameState.quotes[Math.floor(Math.random() * GameState.quotes.length)]}"`;
    }
}

// --- Game Control ---
function pauseGame() {
    if (!GameState.isPlaying) return;
    GameState.isPaused = true;
    showScreen('pause-screen');
}

function resumeGame() {
    GameState.isPaused = false;
    showScreen('game-screen');
}

function restartGame() {
    stopGame();
    showCharacterSelect();
}

function stopGame() {
    GameState.isPlaying = false;
    clearInterval(GameState.gameTimer);
    clearInterval(GameState.cheeseMoveInterval);
}

function endGame() {
    stopGame();

    if (GameState.multiplayer) {
        const p1 = GameState.score, p2 = GameState.score2;
        document.getElementById('result-icon').textContent = p1 === p2 ? '🤝' : '🏆';
        document.getElementById('result-title').textContent =
            p1 > p2 ? 'Player 1 Wins!' : p2 > p1 ? 'Player 2 Wins!' : "It's a Tie!";
        document.getElementById('result-quote').textContent = `"${GameState.resultQuotes[Math.floor(Math.random() * GameState.resultQuotes.length)]}"`;

        document.getElementById('final-score').textContent = `${p1} - ${p2}`;
        document.getElementById('final-level').textContent = GameState.level;
        document.getElementById('final-cheese').textContent = GameState.cheeseCollected;

        showScreen('game-over-screen');
        return;
    }

    // Determine result
    const won = GameState.score >= 50;
    
    document.getElementById('result-icon').textContent = won ? '🏆' : '🧀';
    document.getElementById('result-title').textContent = won ? 'Cheese Master!' : 'Time\'s Up!';
    document.getElementById('result-quote').textContent = `"${GameState.resultQuotes[Math.floor(Math.random() * GameState.resultQuotes.length)]}"`;
    
    document.getElementById('final-score').textContent = GameState.score;
    document.getElementById('final-level').textContent = GameState.level;
    document.getElementById('final-cheese').textContent = GameState.cheeseCollected;
    
    showScreen('game-over-screen');
    
    // Show name entry
    setTimeout(() => {
        document.getElementById('name-modal').classList.add('active');
    }, 1000);
}

// --- Leaderboard ---
function switchLeaderboardTab(difficulty) {
    GameState.difficulty = difficulty;
    
    // Update tab styles
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    const entries = GameState.leaderboard[difficulty] || [];
    
    if (entries.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No scores yet. Be the first!</p>';
        return;
    }
    
    entries.slice(0, 10).forEach((entry, index) => {
        const el = document.createElement('div');
        el.className = 'leaderboard-entry';
        const medals = ['🥇', '🥈', '🥉'];
        el.innerHTML = `
            <span class="entry-rank">${medals[index] || `#${index + 1}`}</span>
            <span class="entry-name">${entry.name}</span>
            <span class="entry-score">${entry.score}</span>
        `;
        list.appendChild(el);
    });
}

function saveScore() {
    const name = document.getElementById('player-name').value.trim() || 'Anonymous';
    
    if (!GameState.leaderboard[GameState.difficulty]) {
        GameState.leaderboard[GameState.difficulty] = [];
    }
    
    GameState.leaderboard[GameState.difficulty].push({
        name: name,
        score: GameState.score,
        level: GameState.level,
        date: new Date().toISOString()
    });
    
    // Sort and keep top 10
    GameState.leaderboard[GameState.difficulty].sort((a, b) => b.score - a.score);
    GameState.leaderboard[GameState.difficulty] = GameState.leaderboard[GameState.difficulty].slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem(`cheese_leaderboard_${GameState.difficulty}`, JSON.stringify(GameState.leaderboard[GameState.difficulty]));
    
    closeModal('name-modal');
    showLeaderboard();
}

// --- Loading Screen ---
window.addEventListener('load', () => {
    setTimeout(() => {
        showScreen('main-menu');
        populateMenuCharacters();
    }, 2000);
});

// --- Window Resize Handler ---
window.addEventListener('resize', () => {
    if (GameState.isPlaying && !GameState.isPaused) {
        setupCanvas();
        drawGame();
    }
});
