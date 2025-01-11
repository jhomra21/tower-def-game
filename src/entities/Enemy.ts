import * as THREE from 'three';
import { EnemyType, EnemyStats, createEnemyStats } from '../types/GameTypes';

export class Enemy {
    private mesh: THREE.Mesh;
    private stats: EnemyStats;
    private position: THREE.Vector3;
    private currentHealth: number;
    private path: THREE.Vector3[];
    private currentPathIndex: number = 0;
    private isDead: boolean = false;

    constructor(type: EnemyType, startPosition: THREE.Vector3, path: THREE.Vector3[], isElite: boolean = false) {
        this.stats = createEnemyStats(type, isElite);
        this.position = startPosition.clone();
        this.currentHealth = this.stats.health;
        this.path = path;
        
        // Create enemy mesh based on type
        const geometry = this.createEnemyGeometry(type, isElite);
        const material = this.createEnemyMaterial(type, isElite);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPosition);
    }

    private createEnemyGeometry(type: EnemyType, isElite: boolean): THREE.BufferGeometry {
        const size = isElite ? 1.2 : 1.0; // Elite enemies are 20% larger
        switch (type) {
            case EnemyType.LIGHT:
                return new THREE.BoxGeometry(0.5 * size, 0.5 * size, 0.5 * size);
            case EnemyType.NORMAL:
                return new THREE.BoxGeometry(0.7 * size, 0.7 * size, 0.7 * size);
            case EnemyType.HEAVY:
                return new THREE.BoxGeometry(0.9 * size, 0.9 * size, 0.9 * size);
            default:
                return new THREE.BoxGeometry(0.5 * size, 0.5 * size, 0.5 * size);
        }
    }

    private createEnemyMaterial(type: EnemyType, isElite: boolean): THREE.Material {
        const color = this.getEnemyColor(type);
        const material = new THREE.MeshPhongMaterial({ 
            color,
            flatShading: true,
            shininess: isElite ? 80 : 30,
            emissive: isElite ? color : 0x000000,
            emissiveIntensity: isElite ? 0.3 : 0
        });
        return material;
    }

    private getEnemyColor(type: EnemyType): number {
        switch (type) {
            case EnemyType.LIGHT:
                return 0xffff00;  // Yellow
            case EnemyType.NORMAL:
                return 0xff8800;  // Orange
            case EnemyType.HEAVY:
                return 0xff0000;  // Red
            default:
                return 0xffff00;  // Default to yellow
        }
    }

    public update(deltaTime: number): boolean {
        if (this.isDead || this.currentPathIndex >= this.path.length) {
            return false;
        }

        const targetPosition = this.path[this.currentPathIndex];
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.position)
            .normalize();

        // Move towards next path point
        const moveDistance = this.stats.speed * deltaTime;
        const movement = direction.multiplyScalar(moveDistance);
        this.position.add(movement);
        this.mesh.position.copy(this.position);

        // Check if we've reached the current path point
        if (this.position.distanceTo(targetPosition) < 0.1) {
            this.currentPathIndex++;
            
            // Return true if we've reached the end of the path
            if (this.currentPathIndex >= this.path.length) {
                return true;
            }
        }

        return false;
    }

    public takeDamage(amount: number): boolean {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        // Update material color based on health percentage
        const healthPercent = this.currentHealth / this.stats.health;
        const material = this.mesh.material as THREE.MeshPhongMaterial;
        
        // Flash red when hit
        const originalColor = material.color.clone();
        material.color.setHex(0xff0000);
        
        setTimeout(() => {
            // Return to health-based color
            const baseColor = this.getEnemyColor(this.stats.type);
            material.color.setHex(baseColor);
            material.color.multiplyScalar(healthPercent);
        }, 50);

        if (this.currentHealth <= 0 && !this.isDead) {
            this.isDead = true;
            return true;  // Enemy was just defeated
        }
        return false;
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    public getPosition(): THREE.Vector3 {
        return this.position.clone();
    }

    public getStats(): EnemyStats {
        return { ...this.stats };
    }

    public getCurrentHealth(): number {
        return this.currentHealth;
    }

    public isDefeated(): boolean {
        return this.isDead;
    }
} 