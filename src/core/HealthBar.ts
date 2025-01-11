import * as THREE from 'three';

export class HealthBar {
    private container: THREE.Group;
    private barMesh: THREE.Mesh;
    private backgroundMesh: THREE.Mesh;
    private textSprite: THREE.Sprite;
    private maxHealth: number;
    private currentHealth: number;
    private width: number = 3;
    private height: number = 0.3;

    constructor(maxHealth: number, position: THREE.Vector3) {
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.container = new THREE.Group();
        
        // Create background (gray bar)
        const backgroundGeometry = new THREE.PlaneGeometry(this.width, this.height);
        const backgroundMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            side: THREE.DoubleSide
        });
        this.backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        
        // Create health bar
        const barGeometry = new THREE.PlaneGeometry(this.width, this.height);
        const barMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        this.barMesh = new THREE.Mesh(barGeometry, barMaterial);
        this.barMesh.position.z = 0.01; // Slightly in front of background
        
        // Create text sprite for health value
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        this.textSprite = new THREE.Sprite(spriteMaterial);
        this.textSprite.scale.set(2, 0.5, 1);
        this.textSprite.position.y = 0.4;
        
        // Add everything to container
        this.container.add(this.backgroundMesh);
        this.container.add(this.barMesh);
        this.container.add(this.textSprite);
        
        // Position container
        this.container.position.copy(position);
        this.container.position.y += 3; // Place above base
        
        this.updateDisplay();
    }

    public update(camera: THREE.Camera): void {
        // Make health bar face camera
        this.container.quaternion.copy(camera.quaternion);
    }

    public updateHealth(health: number): void {
        this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));
        this.updateDisplay();
    }

    private updateDisplay(): void {
        // Update bar scale
        const healthPercent = this.currentHealth / this.maxHealth;
        this.barMesh.scale.x = healthPercent;
        this.barMesh.position.x = -(this.width * (1 - healthPercent)) / 2;
        
        // Update bar color
        const barMaterial = this.barMesh.material as THREE.MeshBasicMaterial;
        if (healthPercent > 0.6) {
            barMaterial.color.setHex(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
            barMaterial.color.setHex(0xffff00); // Yellow
        } else {
            barMaterial.color.setHex(0xff0000); // Red
        }
        
        // Update text
        const canvas = (this.textSprite.material as THREE.SpriteMaterial).map!.image;
        const context = canvas.getContext('2d')!;
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#ffffff';
        context.font = '32px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(
            `${Math.ceil(this.currentHealth)}/${this.maxHealth}`,
            canvas.width / 2,
            canvas.height / 2
        );
        
        (this.textSprite.material as THREE.SpriteMaterial).map!.needsUpdate = true;
    }

    public getMesh(): THREE.Group {
        return this.container;
    }
} 