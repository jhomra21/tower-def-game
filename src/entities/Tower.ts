import * as THREE from 'three';
import { TowerType, TowerStats, TOWER_STATS } from '../types/GameTypes';
import { Enemy } from './Enemy';

export class Tower {
    private mesh: THREE.Mesh;
    private stats: TowerStats;
    private lastFireTime: number = 0;
    private position: THREE.Vector3;
    private currentTarget: Enemy | null = null;
    private type: TowerType;

    constructor(type: TowerType, position: THREE.Vector3) {
        this.type = type;
        this.stats = TOWER_STATS[type];
        this.position = position.clone();
        
        // Create tower mesh based on type
        const geometry = this.createTowerGeometry(type);
        const material = this.createTowerMaterial(type);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
    }

    private createTowerGeometry(type: TowerType): THREE.BufferGeometry {
        switch (type) {
            case TowerType.LIGHT:
                return new THREE.CylinderGeometry(0.3, 0.4, 1, 8);
            case TowerType.NORMAL:
                return new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
            case TowerType.HEAVY:
                return new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8);
        }
    }

    private createTowerMaterial(type: TowerType): THREE.Material {
        const color = this.getTowerColor(type);
        return new THREE.MeshPhongMaterial({ 
            color,
            flatShading: true,
            shininess: 30
        });
    }

    private getTowerColor(type: TowerType): number {
        switch (type) {
            case TowerType.LIGHT:
                return 0x00ff00;  // Green
            case TowerType.NORMAL:
                return 0x0000ff;  // Blue
            case TowerType.HEAVY:
                return 0xff0000;  // Red
            default:
                return 0x00ff00;  // Default to green
        }
    }

    public update(deltaTime: number, enemies: Enemy[]): Enemy | null {
        // Use performance.now() for accurate time tracking
        const currentTime = performance.now();
        
        // Check if enough time has passed to fire again
        if (currentTime - this.lastFireTime >= (1000 / this.stats.fireRate)) {
            // Find new target if we don't have one or current target is dead/out of range
            if (!this.currentTarget || 
                this.currentTarget.isDefeated() || 
                !this.isInRange(this.currentTarget)) {
                this.currentTarget = this.findTarget(enemies);
            }

            if (this.currentTarget && this.isInRange(this.currentTarget)) {
                this.fire(this.currentTarget);
                this.lastFireTime = currentTime;
                return this.currentTarget;
            }
        }
        
        return null;
    }

    private isInRange(enemy: Enemy): boolean {
        // Get 2D positions (ignoring height) for range calculation
        const towerPos = new THREE.Vector2(this.position.x, this.position.z);
        const enemyPos = enemy.getPosition();
        const enemyPos2D = new THREE.Vector2(enemyPos.x, enemyPos.z);
        
        // Calculate distance in 2D space
        return towerPos.distanceTo(enemyPos2D) <= (this.stats.range || 10);
    }

    private findTarget(enemies: Enemy[]): Enemy | null {
        // Find closest enemy in range that isn't defeated
        let closestEnemy: Enemy | null = null;
        let closestDistance = Infinity;
        
        const towerPos = new THREE.Vector2(this.position.x, this.position.z);
        
        enemies.forEach(enemy => {
            if (!enemy.isDefeated()) {
                const enemyPos = enemy.getPosition();
                const enemyPos2D = new THREE.Vector2(enemyPos.x, enemyPos.z);
                const distance = towerPos.distanceTo(enemyPos2D);
                
                if (distance <= (this.stats.range || 10) && distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
        });
        
        return closestEnemy;
    }

    private fire(target: Enemy): void {
        // Visual feedback
        const material = this.mesh.material as THREE.MeshPhongMaterial;
        const originalColor = material.color.clone();
        material.color.setHex(0xffffff);  // Flash white when firing

        // Create laser beam effect
        const targetPos = target.getPosition();
        const laserGeometry = new THREE.BufferGeometry().setFromPoints([
            this.position.clone().setY(1),  // Raise laser start point to tower top
            targetPos.clone().setY(0.5)     // Target enemy center
        ]);
        const laserMaterial = new THREE.LineBasicMaterial({ 
            color: this.getTowerColor(this.stats.type),
            opacity: 0.7,
            transparent: true,
            linewidth: 2
        });
        const laser = new THREE.Line(laserGeometry, laserMaterial);
        this.mesh.parent?.add(laser);

        // Remove laser and reset tower color after a short delay
        setTimeout(() => {
            material.color.copy(originalColor);
            this.mesh.parent?.remove(laser);
        }, 50);
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    public getPosition(): THREE.Vector3 {
        return this.position.clone();
    }

    public moveTo(newPosition: THREE.Vector3): void {
        this.position.copy(newPosition);
        this.mesh.position.copy(newPosition);
    }

    public getStats(): TowerStats {
        return { ...this.stats };
    }

    public getType(): TowerType {
        return this.type;
    }
} 