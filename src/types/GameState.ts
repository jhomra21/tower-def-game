import * as THREE from 'three';

export interface GameState {
    currentLevel: number;
    currentRound: number;
    baseHealth: number;
    maxBaseHealth: number;
    points: number;
    isGameOver: boolean;
    isPaused: boolean;
    towerCount: number;
    gameSpeed: number;  // 1 = normal, 1.5 = fast, 2 = very fast
}

export interface LevelConfig {
    id: number;
    name: string;
    spawnPoints: THREE.Vector3[];
    basePosition: THREE.Vector3;
    pathNodes: THREE.Vector3[][];  // Array of path points for each possible path
}

export interface RoundState {
    enemiesSpawned: number;
    enemiesDefeated: number;
    enemiesReachedBase: number;
    totalEnemies: number;
    isComplete: boolean;
}

export const INITIAL_GAME_STATE: GameState = {
    currentLevel: 1,
    currentRound: 1,
    baseHealth: 100,
    maxBaseHealth: 100,
    points: 300,
    isGameOver: false,
    isPaused: false,
    towerCount: 0,
    gameSpeed: 1
};

// Calculate total enemies for a given round (5 rounds, 20-100 enemies)
export const calculateRoundEnemies = (round: number): number => {
    return round * 10;  // Round 1: 10, Round 2: 20, Round 3: 30, Round 4: 40, Round 5: 50
};

// Calculate base health for a given round
export const calculateBaseHealth = (round: number): number => {
    return 100 + (round - 1) * 10;  // Starting health: 100, +10 per round
}; 