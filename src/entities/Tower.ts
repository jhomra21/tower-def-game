import * as THREE from 'three';
import { TowerType, TowerStats, TOWER_STATS } from '../types/GameTypes';
import { Enemy } from './Enemy';

export class Tower {
    private mesh: THREE.Mesh;
    private stats: TowerStats;
    private lastFireTime: number = 0;
    private position: THREE.Vector3;
    private type: TowerType;
    private currentTarget: Enemy | null = null;

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

    public update(_deltaTime: number, enemies: Enemy[]): Enemy | null {
        const currentTime = performance.now();
        
        // Check if enough time has passed since last fire
        if (currentTime - this.lastFireTime < (1000 / this.stats.fireRate)) {
            return null;
        }

        // Check if current target is still valid
        if (this.currentTarget) {
            if (this.currentTarget.isDefeated()) {
                this.currentTarget = null;
            } else {
                const distance = this.position.distanceTo(this.currentTarget.getPosition());
                if (distance > (this.stats.range || 10)) {
                    this.currentTarget = null;
                }
            }
        }

        // If no current target, find closest enemy in range
        if (!this.currentTarget) {
            let closestDistance = Infinity;
            enemies.forEach(enemy => {
                if (!enemy.isDefeated()) {
                    const distance = this.position.distanceTo(enemy.getPosition());
                    if (distance <= (this.stats.range || 10) && distance < closestDistance) {
                        closestDistance = distance;
                        this.currentTarget = enemy;
                    }
                }
            });
        }

        // Fire at current target if we have one
        if (this.currentTarget) {
            this.fire(this.currentTarget);
            this.lastFireTime = currentTime;
            return this.currentTarget;
        }

        return null;
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