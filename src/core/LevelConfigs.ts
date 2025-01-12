import * as THREE from 'three';
import { LevelConfig } from '../types/GameState';

export const LEVEL_CONFIGS: LevelConfig[] = [
    // Level 1
    {
        id: 1,
        name: "The Beginning",
        spawnPoints: [
            new THREE.Vector3(-20, 0, -20)
        ],
        basePosition: new THREE.Vector3(20, 1, 20),
        pathNodes: [
            [
                new THREE.Vector3(-20, 0, -20),
                new THREE.Vector3(-10, 0, -10),
                new THREE.Vector3(20, 0, 20)
            ]
        ]
    },
    // Level 2
    {
        id: 2,
        name: "Split Paths",
        spawnPoints: [
            new THREE.Vector3(-20, 0, -20),
            new THREE.Vector3(-20, 0, 20)
        ],
        basePosition: new THREE.Vector3(20, 1, 0),
        pathNodes: [
            // Path from top spawn
            [
                new THREE.Vector3(-20, 0, -20),
                new THREE.Vector3(-10, 0, -10),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(20, 0, 0)
            ],
            // Path from bottom spawn
            [
                new THREE.Vector3(-20, 0, 20),
                new THREE.Vector3(-10, 0, 10),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(20, 0, 0)
            ]
        ]
    },
    // Level 3
    {
        id: 3,
        name: "The Maze",
        spawnPoints: [
            new THREE.Vector3(-20, 0, 0),
            new THREE.Vector3(0, 0, -20)
        ],
        basePosition: new THREE.Vector3(20, 1, 20),
        pathNodes: [
            // Path from left spawn
            [
                new THREE.Vector3(-20, 0, 0),
                new THREE.Vector3(-10, 0, 0),
                new THREE.Vector3(-10, 0, 10),
                new THREE.Vector3(0, 0, 10),
                new THREE.Vector3(0, 0, 20),
                new THREE.Vector3(20, 0, 20)
            ],
            // Path from top spawn
            [
                new THREE.Vector3(0, 0, -20),
                new THREE.Vector3(0, 0, -10),
                new THREE.Vector3(10, 0, -10),
                new THREE.Vector3(10, 0, 0),
                new THREE.Vector3(20, 0, 10),
                new THREE.Vector3(20, 0, 20)
            ]
        ]
    }
]; 