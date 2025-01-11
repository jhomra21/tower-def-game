import * as THREE from 'three';
import { LevelConfig } from '../types/GameState';

export const LEVEL_CONFIGS: LevelConfig[] = [
    // Level 1: Simple L-shaped path
    {
        id: 1,
        name: "Training Grounds",
        spawnPoints: [new THREE.Vector3(-20, 0, -20)],
        basePosition: new THREE.Vector3(20, 0, 20),
        pathNodes: [
            [
                new THREE.Vector3(-20, 0, -20),
                new THREE.Vector3(-20, 0, 20),
                new THREE.Vector3(20, 0, 20)
            ]
        ]
    },
    // Level 2: Two parallel paths
    {
        id: 2,
        name: "Dual Routes",
        spawnPoints: [
            new THREE.Vector3(-20, 0, -10),
            new THREE.Vector3(-20, 0, 10)
        ],
        basePosition: new THREE.Vector3(20, 0, 0),
        pathNodes: [
            [
                new THREE.Vector3(-20, 0, -10),
                new THREE.Vector3(0, 0, -10),
                new THREE.Vector3(20, 0, 0)
            ],
            [
                new THREE.Vector3(-20, 0, 10),
                new THREE.Vector3(0, 0, 10),
                new THREE.Vector3(20, 0, 0)
            ]
        ]
    },
    // Level 3: Complex maze-like paths
    {
        id: 3,
        name: "The Maze",
        spawnPoints: [
            new THREE.Vector3(-20, 0, 0),
            new THREE.Vector3(0, 0, -20)
        ],
        basePosition: new THREE.Vector3(20, 0, 20),
        pathNodes: [
            [
                new THREE.Vector3(-20, 0, 0),
                new THREE.Vector3(-10, 0, 0),
                new THREE.Vector3(-10, 0, 10),
                new THREE.Vector3(0, 0, 10),
                new THREE.Vector3(0, 0, 20),
                new THREE.Vector3(20, 0, 20)
            ],
            [
                new THREE.Vector3(0, 0, -20),
                new THREE.Vector3(0, 0, -10),
                new THREE.Vector3(10, 0, -10),
                new THREE.Vector3(10, 0, 0),
                new THREE.Vector3(20, 0, 0),
                new THREE.Vector3(20, 0, 20)
            ]
        ]
    }
]; 