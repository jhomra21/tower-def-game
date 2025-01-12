import * as THREE from 'three';
import { Level } from './core/Level';
import { LEVEL_CONFIGS } from './core/LevelConfigs';
import { Tower } from './entities/Tower';
import { Enemy } from './entities/Enemy';
import { TowerType, EnemyType, TOWER_STATS } from './types/GameTypes';
import { GameState, RoundState, INITIAL_GAME_STATE, calculateRoundEnemies, calculateBaseHealth } from './types/GameState';
import { GameStats, LevelStats, createEmptyGameStats, createEmptyLevelStats } from './types/GameStats';
import { UI } from './core/UI';
import { HealthBar } from './core/HealthBar';

class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private currentLevel: Level | null = null;
    private gameState: GameState = { ...INITIAL_GAME_STATE };
    private roundState: RoundState = {
        enemiesSpawned: 0,
        enemiesDefeated: 0,
        enemiesReachedBase: 0,
        totalEnemies: calculateRoundEnemies(1),
        isComplete: false
    };
    private lastTime: number = 0;
    private spawnInterval: number = 1000; // 1 second between spawns
    private lastSpawnTime: number = 0;
    private ui: UI;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private baseHealthBar!: HealthBar;
    private previousPoints: number;
    private isPaused: boolean = false;
    private lastPauseTime: number = 0;
    private draggedTower: Tower | null = null;
    private dragPlane: THREE.Plane;
    private isDragging: boolean = false;
    private previewTower: Tower | null = null;
    private gameStats: GameStats = createEmptyGameStats();
    private currentLevelStats: LevelStats = createEmptyLevelStats();
    private levelStartTime: number = 0;
    private isPrepPhase: boolean = false;
    private prepTimeRemaining: number = 0;
    private readonly PREP_TIME: number = 10; // 10 seconds prep time
    private readonly MIN_ZOOM: number = 1;  // Maximum zoom out (smaller number = further out)
    private readonly MAX_ZOOM: number = 8.0;  // Maximum zoom in (doubled from 2.0)
    private currentZoom: number = 1.0;
    private touchStartDistance: number = 0;
    private isZooming: boolean = false;

    constructor() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a1a);
        document.body.appendChild(this.renderer.domElement);
        
        // Set initial camera position based on screen size
        this.updateCameraPosition();

        // Initialize raycaster for mouse interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Initialize UI with handlers
        this.ui = new UI(
            (type: TowerType) => this.handleTowerSelect(type),
            () => this.togglePause(),
            (speed: number) => this.setGameSpeed(speed)
        );

        // Setup event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        window.addEventListener('keydown', this.handleKeyPress.bind(this), false);
        
        // Mouse and touch events
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
        this.renderer.domElement.addEventListener('wheel', this.handleMouseWheel.bind(this), { passive: false });
        this.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.renderer.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.renderer.domElement.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });

        // Initialize game state
        this.previousPoints = INITIAL_GAME_STATE.points;

        // Start first level
        this.startLevel(1);

        // Start game loop
        this.animate(0);

        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    }

    private handleTowerSelect(type: TowerType): void {
        // Check if player has enough points
        const cost = TOWER_STATS[type].cost;
        if (this.gameState.points < cost) {
            this.ui.showMessage(`Not enough points! Need ${cost} points.`);
            return;
        }

        // Check tower limit
        if (this.gameState.towerCount >= 10) {
            this.ui.showMessage('Maximum tower limit (10) reached! Remove a tower first.');
            return;
        }

        // Remove existing preview if any
        this.removePreviewTower();

        // Create new preview tower
        const previewTower = new Tower(type, new THREE.Vector3(0, 0, 0));
        const material = previewTower.getMesh().material as THREE.MeshPhongMaterial;
        material.transparent = true;
        material.opacity = 0.5;
        this.previewTower = previewTower;
        this.scene.add(previewTower.getMesh());

        this.ui.setSelectedTowerType(type);
    }

    private removePreviewTower(): void {
        if (this.previewTower) {
            this.scene.remove(this.previewTower.getMesh());
            this.previewTower = null;
        }
    }

    private onMouseDown(event: MouseEvent): void {
        if (!this.currentLevel) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Try to select a tower for dragging
        const intersectionPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);
        const tower = this.currentLevel.getTowerAtPosition(intersectionPoint);
        if (tower) {
            event.preventDefault(); // Prevent event propagation
            event.stopPropagation();
            this.draggedTower = tower;
            this.isDragging = true;
            tower.getMesh().position.y += 1; // Lift tower while dragging
            this.removePreviewTower(); // Remove preview when starting drag
            return; // Exit early when starting drag
        }

        // Handle new tower placement
        const selectedTower = this.ui.getSelectedTowerType();
        if (selectedTower) {
            const cost = TOWER_STATS[selectedTower].cost;
            if (this.gameState.points >= cost && this.gameState.towerCount < 10) {
                const intersectionPoint = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);
                
                if (this.addTower(selectedTower, intersectionPoint)) {
                    this.gameState.points -= cost;
                    this.gameState.towerCount++;
                    
                    if (this.gameState.towerCount === 10) {
                        this.ui.showMessage('Tower placed! Maximum limit reached.');
                    } else if (this.gameState.towerCount === 9) {
                        this.ui.showMessage('Tower placed! Only one slot remaining.');
                    } else {
                        this.ui.showMessage(`Tower placed! (${this.gameState.towerCount}/10)`);
                    }
                    
                    this.ui.clearTowerSelection();
                    this.removePreviewTower();
                }
            }
        }
    }

    private onMouseMove(event: MouseEvent): void {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (this.isDragging && this.draggedTower) {
            // Update raycaster and get new position
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersectionPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);

            // Check if mouse is over trash can
            if (this.ui.isOverTrashCan(event.clientX, event.clientY)) {
                this.ui.highlightTrashCan(true);
            } else {
                this.ui.highlightTrashCan(false);
                // Only update position if not over trash can
                if (this.currentLevel?.getValidTowerPosition(intersectionPoint)) {
                    this.draggedTower.moveTo(intersectionPoint);
                    this.draggedTower.getMesh().position.y += 1; // Maintain lifted position
                }
            }
        } else if (this.previewTower) {
            // Update preview tower position
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersectionPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);

            const isValidPosition = this.currentLevel?.getValidTowerPosition(intersectionPoint);
            const material = this.previewTower.getMesh().material as THREE.MeshPhongMaterial;
            
            if (isValidPosition) {
                material.opacity = 0.7;
                material.color.setHex(0x00ff00);  // Green for valid
                this.previewTower.moveTo(intersectionPoint);
        } else {
                material.opacity = 0.3;
                material.color.setHex(0xff0000);  // Red for invalid
                this.previewTower.moveTo(intersectionPoint);
            }
        }
    }

    private onMouseUp(event: MouseEvent): void {
        if (!this.isDragging || !this.draggedTower) return;

        // Check if tower should be removed (dropped on trash can)
        if (this.ui.isOverTrashCan(event.clientX, event.clientY)) {
            // Refund half the tower's cost
            const refund = Math.floor(TOWER_STATS[this.draggedTower.getType()].cost / 2);
            this.gameState.points += refund;
            this.currentLevel?.removeTower(this.draggedTower);
            this.gameState.towerCount--;
            this.ui.showMessage(`Tower removed! Refunded ${refund} points (${this.gameState.towerCount}/10)`);
        } else {
            // Place tower back down
            this.draggedTower.getMesh().position.y -= 1;
        }

        this.ui.highlightTrashCan(false);
        this.draggedTower = null;
        this.isDragging = false;
        
        event.preventDefault();
        event.stopPropagation();
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.togglePause();
            this.removePreviewTower();
            this.ui.clearTowerSelection();
        }
    }

    private togglePause(): void {
        const currentTime = performance.now();
        if (!this.isPaused) {
            // Pausing
            this.lastPauseTime = currentTime;
        } else {
            // Resuming
            this.lastTime += currentTime - this.lastPauseTime;
        }
        this.isPaused = !this.isPaused;
        this.ui.setPauseState(this.isPaused);
    }

    private startLevel(levelId: number): void {
        // Clear any existing timeouts
        this.clearAllTimeouts();
        
        // Cleanup previous level if exists
        if (this.currentLevel) {
            this.currentLevel.cleanup();
            if (this.baseHealthBar) {
                this.scene.remove(this.baseHealthBar.getMesh());
            }
        }

        const config = LEVEL_CONFIGS[levelId - 1];
        if (!config) {
            console.error(`Level ${levelId} not found`);
            return;
        }

        // Reset game state for new level
        this.gameState.currentLevel = levelId;
        this.gameState.currentRound = 1;
        this.gameState.maxBaseHealth = calculateBaseHealth(1);
        this.gameState.baseHealth = this.gameState.maxBaseHealth;
        this.gameState.towerCount = 0;
        
        // Reset prep phase state
        this.isPrepPhase = true;
        this.prepTimeRemaining = this.PREP_TIME;
        this.lastSpawnTime = 0;  // Reset spawn timer

        // Create health bar for base
        this.baseHealthBar = new HealthBar(
            this.gameState.baseHealth,
            config.basePosition
        );
        this.scene.add(this.baseHealthBar.getMesh());

        this.currentLevel = new Level(this.scene, config, {
            onEnemyReachBase: () => {
                this.gameState.baseHealth = Math.max(0, this.gameState.baseHealth - 5);
                this.baseHealthBar.updateHealth(this.gameState.baseHealth);
                this.roundState.enemiesReachedBase++;
                this.checkRoundCompletion();
                
                if (this.gameState.baseHealth <= 0) {
                    this.gameOver(false);
                }
            },
            onEnemyDefeated: (pointsValue: number, enemyType: EnemyType, isElite: boolean) => {
                this.gameState.points += pointsValue;
                this.roundState.enemiesDefeated++;
                this.currentLevelStats.enemiesDefeated[enemyType]++;
                this.gameStats.totalEnemiesDefeated[enemyType]++;
                if (isElite) {
                    this.currentLevelStats.eliteEnemiesDefeated++;
                    this.gameStats.totalEliteEnemiesDefeated++;
                }
                this.checkRoundCompletion();
            }
        });

        // Reset level stats
        this.currentLevelStats = createEmptyLevelStats();
        this.levelStartTime = performance.now();

        this.resetRoundState();
        this.ui.showMessage(`Level ${levelId} Started!\nPrep Phase: ${this.PREP_TIME} seconds`, 3000);
        this.ui.showPrepPhase(this.prepTimeRemaining, () => this.startRound());
    }

    private startRound(): void {
        // Clear prep phase state
        this.isPrepPhase = false;
        this.prepTimeRemaining = 0;
        this.lastSpawnTime = performance.now();  // Reset spawn timer
        
        // Reset round state and start spawning
        this.resetRoundState();
        
        // Remove prep phase UI and show round start message
        if (this.ui) {
            this.ui.updatePrepTimer(0); // This will trigger UI cleanup
            this.ui.showMessage(`Round ${this.gameState.currentRound} Started!`);
        }
    }

    private resetRoundState(): void {
        this.roundState = {
            enemiesSpawned: 0,
            enemiesDefeated: 0,
            enemiesReachedBase: 0,
            totalEnemies: calculateRoundEnemies(this.gameState.currentRound),
            isComplete: false
        };
    }

    private spawnEnemy(): void {
        if (!this.currentLevel || this.roundState.isComplete) return;

        const config = LEVEL_CONFIGS[this.gameState.currentLevel - 1];
        const spawnPoint = config.spawnPoints[Math.floor(Math.random() * config.spawnPoints.length)];
        const pathIndex = Math.floor(Math.random() * config.pathNodes.length);
        const path = config.pathNodes[pathIndex];

        // Calculate if this should be an elite enemy (20% chance)
        const isElite = Math.random() < 0.2;

        // Determine enemy type based on round number
        let enemyType: EnemyType;
        const rand = Math.random();
        if (this.gameState.currentRound <= 3) {
            enemyType = EnemyType.LIGHT;
        } else if (this.gameState.currentRound <= 7) {
            enemyType = rand < 0.7 ? EnemyType.LIGHT : EnemyType.NORMAL;
        } else {
            if (rand < 0.5) enemyType = EnemyType.LIGHT;
            else if (rand < 0.8) enemyType = EnemyType.NORMAL;
            else enemyType = EnemyType.HEAVY;
        }

        const enemy = new Enemy(enemyType, spawnPoint, path, isElite);
        this.currentLevel.addEnemy(enemy);
        this.roundState.enemiesSpawned++;

        // Show message for elite enemy spawn
        if (isElite) {
            this.ui.showMessage('Elite Enemy Spawned!', 1000);
        }
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.currentZoom = 1.0;  // Reset zoom on resize
        this.updateCameraPosition();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(time: number): void {
        requestAnimationFrame(this.animate.bind(this));

        if (this.isPaused) return;

        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1) * this.gameState.gameSpeed;
        this.lastTime = time;

        // Update prep phase countdown
        if (this.isPrepPhase) {
            this.prepTimeRemaining = Math.max(0, this.prepTimeRemaining - deltaTime);
            this.ui.updatePrepTimer(this.prepTimeRemaining);
            if (this.prepTimeRemaining <= 0) {
                this.startRound();
            }
        }

        // Only spawn enemies if not in prep phase
        if (!this.isPrepPhase && !this.roundState.isComplete && 
            time - this.lastSpawnTime >= (this.spawnInterval / this.gameState.gameSpeed) && 
            this.roundState.enemiesSpawned < this.roundState.totalEnemies) {
            this.spawnEnemy();
            this.lastSpawnTime = time;
        }

        // Update current level
        if (this.currentLevel) {
            this.currentLevel.update(deltaTime);
        }

        // Update health bar
        if (this.baseHealthBar) {
            this.baseHealthBar.update(this.camera);
        }

        // Update UI
        this.ui.updateStats(this.gameState, this.roundState, this.previousPoints);
        this.previousPoints = this.gameState.points;

        this.renderer.render(this.scene, this.camera);
    }

    public addTower(type: TowerType, position: THREE.Vector3): boolean {
        if (!this.currentLevel) return false;

        if (this.currentLevel.getValidTowerPosition(position)) {
            const tower = new Tower(type, position);
            this.currentLevel.addTower(tower);
            // Track tower placement
            this.currentLevelStats.towersPlaced[type]++;
            this.gameStats.totalTowersPlaced[type]++;
            return true;
        }
        return false;
    }

    private checkRoundCompletion(): void {
        const totalProcessedEnemies = this.roundState.enemiesDefeated + this.roundState.enemiesReachedBase;
        
        if (totalProcessedEnemies >= this.roundState.totalEnemies) {
            this.roundState.isComplete = true;
            
            // Update base health for next round
            const nextHealth = Math.min(this.gameState.baseHealth + 10, this.gameState.maxBaseHealth);
            this.gameState.baseHealth = nextHealth;
            this.baseHealthBar.updateHealth(nextHealth);
            
            // Check if all rounds are complete
            if (this.gameState.currentRound >= 5) {
                if (this.gameState.currentLevel >= 3) {
                    this.gameOver(true);
                } else {
                    // Complete level stats
                    this.completeLevelStats();
                    // Show level completion UI
                    this.ui.showLevelComplete(
                        this.currentLevelStats,
                        this.gameState.currentLevel < 3,
                        () => {
                            // Clear any existing timeouts before starting new level
                            this.clearAllTimeouts();
                            this.startLevel(this.gameState.currentLevel + 1);
                        }
                    );
                }
            } else {
                setTimeout(() => {
                    this.gameState.currentRound++;
                    // Update max health for new round
                    this.gameState.maxBaseHealth = calculateBaseHealth(this.gameState.currentRound);
                    this.resetRoundState();
                }, 2000);
            }
        }
    }

    private completeLevelStats(): void {
        // Update final stats for the level
        this.currentLevelStats.baseHealthRemaining = this.gameState.baseHealth;
        this.currentLevelStats.timeTaken = (performance.now() - this.levelStartTime) / 1000;
        this.currentLevelStats.pointsEarned = this.gameState.points;

        // Add to game stats
        this.gameStats.levelStats.push({ ...this.currentLevelStats });
        this.gameStats.totalPointsEarned += this.currentLevelStats.pointsEarned;
    }

    private gameOver(victory: boolean): void {
        this.gameState.isGameOver = true;
        
        if (victory) {
            // Complete final level stats
            this.completeLevelStats();
            // Show game completion stats
            this.ui.showGameComplete(this.gameStats);
        } else {
            const message = 'Game Over! Your base was destroyed!';
        this.ui.showMessage(message, 5000);
        }
        
        // Restart game after delay
        setTimeout(() => {
            this.gameState = { ...INITIAL_GAME_STATE };
            this.gameStats = createEmptyGameStats();
            this.startLevel(1);
        }, 5000);
    }

    private setGameSpeed(speed: number): void {
        this.gameState.gameSpeed = speed;
        this.ui.showMessage(`Game Speed: ${speed}x`, 1000);
    }

    private updateCameraPosition(): void {
        // Calculate camera position based on screen aspect ratio
        const aspectRatio = window.innerWidth / window.innerHeight;
        const isMobile = window.innerWidth < 768;
        const isPortrait = aspectRatio < 1;
        
        // Base distance adjusted by zoom level
        const baseDistance = (isMobile ? 80 : 60) / this.currentZoom;
        
        if (isPortrait) {
            // Portrait mode: Position camera higher and further back
            const distance = baseDistance * Math.max(1.5, (1 / aspectRatio));
            this.camera.position.set(0, distance * 1.2, distance * 0.7);
            // Wider FOV for portrait mode to see more of the map
            this.camera.fov = Math.min(100, 85 + (1 / aspectRatio) * 20);
        } else {
            // Landscape mode: Standard positioning with aspect ratio adjustment
            const distance = baseDistance * Math.max(1, aspectRatio * 0.75);
            this.camera.position.set(0, distance * 0.9, distance * 0.8);
            // Adjusted FOV for landscape to maintain good visibility
            this.camera.fov = Math.min(85, 70 + aspectRatio * 10);
        }
        
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(0, 0, 0);
    }

    public clearTowerSelection(): void {
        this.removePreviewTower();
        this.ui.clearTowerSelection();
    }

    private clearAllTimeouts(): void {
        // Get the highest timeout ID and clear all timeouts
        const highestTimeoutId = window.setTimeout(() => {}, 0);
        for (let i = highestTimeoutId; i >= 0; i--) {
            window.clearTimeout(i);
        }
    }

    private handleMouseWheel(event: WheelEvent): void {
        event.preventDefault();
        
        // Calculate zoom factor based on wheel delta (made more sensitive)
        const zoomFactor = 1 - Math.sign(event.deltaY) * 0.15;  // Increased from 0.1 to 0.15
        this.adjustZoom(zoomFactor);
    }

    private onTouchStart(event: TouchEvent): void {
        event.preventDefault();
        
        // Handle zooming with two fingers
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.touchStartDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            this.isZooming = true;
            return;
        }

        // Handle tower placement/dragging with single touch
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Try to select a tower for dragging
            const intersectionPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);
            const tower = this.currentLevel?.getTowerAtPosition(intersectionPoint);
            
            if (tower) {
                this.draggedTower = tower;
                this.isDragging = true;
                tower.getMesh().position.y += 1; // Lift tower while dragging
                this.removePreviewTower(); // Remove preview when starting drag
                return;
            }

            // Handle new tower placement
            const selectedTower = this.ui.getSelectedTowerType();
            if (selectedTower) {
                const cost = TOWER_STATS[selectedTower].cost;
                if (this.gameState.points >= cost && this.gameState.towerCount < 10) {
                    const intersectionPoint = new THREE.Vector3();
                    this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);
                    
                    if (this.addTower(selectedTower, intersectionPoint)) {
                        this.gameState.points -= cost;
                        this.gameState.towerCount++;
                        
                        if (this.gameState.towerCount === 10) {
                            this.ui.showMessage('Tower placed! Maximum limit reached.');
                        } else if (this.gameState.towerCount === 9) {
                            this.ui.showMessage('Tower placed! Only one slot remaining.');
                        } else {
                            this.ui.showMessage(`Tower placed! (${this.gameState.towerCount}/10)`);
                        }
                        
                        this.ui.clearTowerSelection();
                        this.removePreviewTower();
                    }
                }
            }
        }
    }

    private onTouchMove(event: TouchEvent): void {
        event.preventDefault();
        
        // Handle zooming
        if (this.isZooming && event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const newDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            const zoomFactor = Math.pow(newDistance / this.touchStartDistance, 1.2);
            this.adjustZoom(zoomFactor);
            
            this.touchStartDistance = newDistance;
            return;
        }

        // Handle tower dragging or preview
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            if (this.isDragging && this.draggedTower) {
                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersectionPoint = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);

                if (this.ui.isOverTrashCan(touch.clientX, touch.clientY)) {
                    this.ui.highlightTrashCan(true);
                } else {
                    this.ui.highlightTrashCan(false);
                    if (this.currentLevel?.getValidTowerPosition(intersectionPoint)) {
                        this.draggedTower.moveTo(intersectionPoint);
                        this.draggedTower.getMesh().position.y += 1;
                    }
                }
            } else if (this.previewTower) {
                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersectionPoint = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);

                const isValidPosition = this.currentLevel?.getValidTowerPosition(intersectionPoint);
                const material = this.previewTower.getMesh().material as THREE.MeshPhongMaterial;
                
                if (isValidPosition) {
                    material.opacity = 0.7;
                    material.color.setHex(0x00ff00);
                    this.previewTower.moveTo(intersectionPoint);
                } else {
                    material.opacity = 0.3;
                    material.color.setHex(0xff0000);
                    this.previewTower.moveTo(intersectionPoint);
                }
            }
        }
    }

    private onTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        
        if (this.isZooming) {
            this.isZooming = false;
            return;
        }

        if (this.isDragging && this.draggedTower) {
            const touch = event.changedTouches[0];
            
            if (this.ui.isOverTrashCan(touch.clientX, touch.clientY)) {
                const refund = Math.floor(TOWER_STATS[this.draggedTower.getType()].cost / 2);
                this.gameState.points += refund;
                this.currentLevel?.removeTower(this.draggedTower);
                this.gameState.towerCount--;
                this.ui.showMessage(`Tower removed! Refunded ${refund} points (${this.gameState.towerCount}/10)`);
        } else {
                this.draggedTower.getMesh().position.y -= 1;
            }

            this.ui.highlightTrashCan(false);
            this.draggedTower = null;
            this.isDragging = false;
        }
    }

    private adjustZoom(factor: number): void {
        // Calculate new zoom level
        const newZoom = Math.min(Math.max(this.currentZoom * factor, this.MIN_ZOOM), this.MAX_ZOOM);
        
        // Only update if zoom level changed
        if (newZoom !== this.currentZoom) {
            this.currentZoom = newZoom;
            this.updateCameraPosition();
        }
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
}); 