import * as THREE from 'three';
import { LevelConfig } from '../types/GameState';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { EnemyType } from '../types/GameTypes';

interface LevelCallbacks {
    onEnemyReachBase: () => void;
    onEnemyDefeated: (pointsValue: number, enemyType: EnemyType, isElite: boolean) => void;
}

export class Level {
    private scene: THREE.Scene;
    private config: LevelConfig;
    private towers: Tower[] = [];
    private enemies: Enemy[] = [];
    private ground!: THREE.Mesh;
    private paths: THREE.Line[] = [];
    private callbacks: LevelCallbacks;
    private base!: THREE.Mesh;

    constructor(scene: THREE.Scene, config: LevelConfig, callbacks: LevelCallbacks) {
        this.scene = scene;
        this.config = config;
        this.callbacks = callbacks;
        
        this.setupEnvironment();
        this.createPaths();
    }

    private setupEnvironment(): void {
        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            flatShading: true,
            side: THREE.DoubleSide
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.scene.add(this.ground);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);

        // Create base
        const baseGeometry = new THREE.BoxGeometry(2, 2, 2);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            flatShading: true
        });
        this.base = new THREE.Mesh(baseGeometry, baseMaterial);
        this.base.position.copy(this.config.basePosition);
        this.scene.add(this.base);
    }

    private createPaths(): void {
        this.paths = this.config.pathNodes.map(pathNodes => {
            const points = pathNodes.map(node => new THREE.Vector3(node.x, 0.1, node.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                opacity: 0.5,
                transparent: true
            });
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            return line;
        });
    }

    public addTower(tower: Tower): void {
        this.towers.push(tower);
        this.scene.add(tower.getMesh());
    }

    public addEnemy(enemy: Enemy): void {
        this.enemies.push(enemy);
        this.scene.add(enemy.getMesh());
    }

    public update(deltaTime: number): void {
        // Update towers and handle damage
        this.towers.forEach(tower => {
            const hitEnemy = tower.update(deltaTime, this.enemies);
            if (hitEnemy) {
                const wasDefeated = hitEnemy.takeDamage(tower.getStats().damage);
                if (wasDefeated) {
                    this.callbacks.onEnemyDefeated(
                        hitEnemy.getStats().pointsValue,
                        hitEnemy.getType(),
                        hitEnemy.isElite()
                    );
                }
            }
        });

        // Update enemies and handle base collisions
        this.enemies = this.enemies.filter(enemy => {
            const reachedEnd = enemy.update(deltaTime);
            
            if (reachedEnd) {
                this.callbacks.onEnemyReachBase();
                this.scene.remove(enemy.getMesh());
                return false;
            }
            
            if (enemy.isDefeated()) {
                this.scene.remove(enemy.getMesh());
                return false;
            }
            
            return true;
        });
    }

    public cleanup(): void {
        // Remove all objects from the scene
        this.paths.forEach(path => this.scene.remove(path));
        this.towers.forEach(tower => this.scene.remove(tower.getMesh()));
        this.enemies.forEach(enemy => this.scene.remove(enemy.getMesh()));
        this.scene.remove(this.ground);
        this.scene.remove(this.base);
    }

    public getValidTowerPosition(position: THREE.Vector3): boolean {
        // Check if position is on a path
        return !this.paths.some(path => {
            const points = (path.geometry as THREE.BufferGeometry).getAttribute('position').array;
            for (let i = 0; i < points.length - 3; i += 3) {
                const pathPoint = new THREE.Vector3(points[i], 0, points[i + 2]);
                if (position.distanceTo(pathPoint) < 1) {
                    return true;
                }
            }
            return false;
        });
    }

    public getTowerAtPosition(position: THREE.Vector3): Tower | null {
        for (const tower of this.towers) {
            if (tower.getPosition().distanceTo(position) < 1) {
                return tower;
            }
        }
        return null;
    }

    public removeTower(tower: Tower): void {
        const index = this.towers.indexOf(tower);
        if (index !== -1) {
            this.towers.splice(index, 1);
            this.scene.remove(tower.getMesh());
        }
    }

    public getTowerCount(): number {
        return this.towers.length;
    }
} 