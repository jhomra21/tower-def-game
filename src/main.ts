import * as THREE from 'three';
import { Level } from './core/Level';
import { LEVEL_CONFIGS } from './core/LevelConfigs';
import { Tower } from './entities/Tower';
import { Enemy } from './entities/Enemy';
import { TowerType, EnemyType, TOWER_STATS } from './types/GameTypes';
import { GameState, RoundState, INITIAL_GAME_STATE, calculateRoundEnemies } from './types/GameState';
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

    constructor() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a1a);
        document.body.appendChild(this.renderer.domElement);
        
        // Set camera position
        this.camera.position.set(0, 30, 30);
        this.camera.lookAt(0, 0, 0);

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
        this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this), false);
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);

        // Initialize game state
        this.previousPoints = INITIAL_GAME_STATE.points;

        // Start first level
        this.startLevel(1);

        // Start game loop
        this.animate(0);
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

        // Clear any existing tower selection
        if (this.currentLevel) {
            this.currentLevel.clearTowerSelection();
            this.ui.hideTowerButtons();
        }

        this.ui.setSelectedTowerType(type);
    }

    private onMouseMove(event: MouseEvent): void {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    private onMouseClick(event: MouseEvent): void {
        if (!this.currentLevel) return;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Cast ray to ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

        // Handle different click modes
        const selectedTower = this.ui.getSelectedTowerType();
        const currentlySelectedTower = this.currentLevel.getSelectedTower();

        if (selectedTower) {
            // Placing new tower
            const cost = TOWER_STATS[selectedTower].cost;
            if (this.gameState.points >= cost && this.gameState.towerCount < 10) {
                if (this.addTower(selectedTower, intersectionPoint)) {
                    this.gameState.points -= cost;
                    this.gameState.towerCount++;
                    
                    // Show appropriate message based on tower count
                    if (this.gameState.towerCount === 10) {
                        this.ui.showMessage('Tower placed! Maximum limit reached.');
                    } else if (this.gameState.towerCount === 9) {
                        this.ui.showMessage('Tower placed! Only one slot remaining.');
                    } else {
                        this.ui.showMessage(`Tower placed! (${this.gameState.towerCount}/10)`);
                    }
                    
                    this.ui.clearTowerSelection();
                }
            } else if (this.gameState.towerCount >= 10) {
                this.ui.showMessage('Maximum tower limit reached! Remove a tower first.');
                this.ui.clearTowerSelection();
            }
        } else if (currentlySelectedTower) {
            // Moving existing tower
            if (this.currentLevel.getValidTowerPosition(intersectionPoint)) {
                this.currentLevel.moveTower(currentlySelectedTower, intersectionPoint);
                this.ui.showMessage('Tower moved!');
                this.currentLevel.clearTowerSelection();
                this.ui.hideTowerButtons();
            }
        } else {
            // Try to select a tower
            const tower = this.currentLevel.selectTowerAtPosition(intersectionPoint);
            if (tower) {
                // Show tower buttons near tower
                const towerPos = tower.getPosition().clone();
                towerPos.y += 1.5; // Position above tower
                const screenPos = towerPos.project(this.camera);
                const screenX = (screenPos.x + 1) * window.innerWidth / 2;
                const screenY = (-screenPos.y + 1) * window.innerHeight / 2;
                
                this.ui.showTowerButtons(screenX, screenY, 
                    // Remove callback
                    () => {
                        // Refund half the tower's cost
                        const refund = Math.floor(TOWER_STATS[tower.getType()].cost / 2);
                        this.gameState.points += refund;
                        this.currentLevel?.removeTower(tower);
                        this.gameState.towerCount--;
                        this.ui.showMessage(`Tower removed! Refunded ${refund} points (${this.gameState.towerCount}/10)`);
                    },
                    // Move callback
                    () => {
                        this.ui.showMessage('Click a new location to move the tower');
                    }
                );
            }
        }
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.togglePause();
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
        // Cleanup previous level if exists
        if (this.currentLevel) {
            this.currentLevel.cleanup();
        }

        const config = LEVEL_CONFIGS[levelId - 1];
        if (!config) {
            console.error(`Level ${levelId} not found`);
            return;
        }

        // Create health bar for base
        this.baseHealthBar = new HealthBar(
            this.gameState.baseHealth,
            config.basePosition
        );
        this.scene.add(this.baseHealthBar.getMesh());

        this.currentLevel = new Level(this.scene, config, {
            onEnemyReachBase: () => {
                this.gameState.baseHealth -= 5;
                this.baseHealthBar.updateHealth(this.gameState.baseHealth);
                this.roundState.enemiesReachedBase++;
                this.checkRoundCompletion();
                
                if (this.gameState.baseHealth <= 0) {
                    this.gameOver(false);
                }
            },
            onEnemyDefeated: (pointsValue: number) => {
                this.gameState.points += pointsValue;
                this.roundState.enemiesDefeated++;
                this.checkRoundCompletion();
            }
        });

        this.gameState.currentLevel = levelId;
        this.gameState.currentRound = 1;
        this.gameState.towerCount = 0;  // Reset tower count
        this.resetRoundState();
        this.ui.showMessage(`Level ${levelId} Started!`, 3000);
    }

    private resetRoundState(): void {
        this.roundState = {
            enemiesSpawned: 0,
            enemiesDefeated: 0,
            enemiesReachedBase: 0,
            totalEnemies: calculateRoundEnemies(this.gameState.currentRound),
            isComplete: false
        };
        
        // Start spawning immediately
        this.lastSpawnTime = performance.now();
        this.ui.showMessage(`Round ${this.gameState.currentRound} Started!`);
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
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Update tower buttons position if there's a selected tower
        if (this.currentLevel) {
            const selectedTower = this.currentLevel.getSelectedTower();
            if (selectedTower) {
                const towerPos = selectedTower.getPosition().clone();
                towerPos.y += 1.5; // Position above tower
                const screenPos = towerPos.project(this.camera);
                const screenX = (screenPos.x + 1) * window.innerWidth / 2;
                const screenY = (-screenPos.y + 1) * window.innerHeight / 2;
                this.ui.updateTowerButtonsPosition(screenX, screenY);
            }
        }
    }

    private animate(time: number): void {
        requestAnimationFrame(this.animate.bind(this));

        if (this.isPaused) return;

        // Apply game speed to deltaTime
        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1) * this.gameState.gameSpeed;
        this.lastTime = time;

        // Spawn enemies if not complete
        if (!this.roundState.isComplete && 
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

        // Update UI with points tracking
        this.ui.updateStats(this.gameState, this.roundState, this.previousPoints);
        this.previousPoints = this.gameState.points;

        this.renderer.render(this.scene, this.camera);
    }

    public addTower(type: TowerType, position: THREE.Vector3): boolean {
        if (!this.currentLevel) return false;

        if (this.currentLevel.getValidTowerPosition(position)) {
            const tower = new Tower(type, position);
            this.currentLevel.addTower(tower);
            return true;
        }
        return false;
    }

    private checkRoundCompletion(): void {
        const totalProcessedEnemies = this.roundState.enemiesDefeated + this.roundState.enemiesReachedBase;
        
        if (totalProcessedEnemies >= this.roundState.totalEnemies) {
            this.roundState.isComplete = true;
            
            // Update base health for next round
            this.gameState.baseHealth += 10;
            
            // Check if all rounds are complete
            if (this.gameState.currentRound >= 5) {
                if (this.gameState.currentLevel >= 3) {
                    this.gameOver(true);
                } else {
                    setTimeout(() => {
                        this.startLevel(this.gameState.currentLevel + 1);
                    }, 2000);
                }
            } else {
                setTimeout(() => {
                    this.gameState.currentRound++;
                    this.resetRoundState();
                }, 2000);
            }
        }
    }

    private gameOver(victory: boolean): void {
        this.gameState.isGameOver = true;
        const message = victory ? 
            'Congratulations! You have completed all levels!' :
            'Game Over! Your base was destroyed!';
        
        this.ui.showMessage(message, 5000);
        
        // Restart game after delay
        setTimeout(() => {
            this.gameState = { ...INITIAL_GAME_STATE };
            this.startLevel(1);
        }, 5000);
    }

    private setGameSpeed(speed: number): void {
        this.gameState.gameSpeed = speed;
        this.ui.showMessage(`Game Speed: ${speed}x`, 1000);
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
}); 