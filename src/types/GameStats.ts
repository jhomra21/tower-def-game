import { TowerType, EnemyType } from './GameTypes';

export interface TowerStats {
    [TowerType.LIGHT]: number;
    [TowerType.NORMAL]: number;
    [TowerType.HEAVY]: number;
}

export interface EnemyStats {
    [EnemyType.LIGHT]: number;
    [EnemyType.NORMAL]: number;
    [EnemyType.HEAVY]: number;
}

export interface LevelStats {
    towersPlaced: TowerStats;
    enemiesDefeated: EnemyStats;
    baseHealthRemaining: number;
    pointsEarned: number;
    timeTaken: number;
    eliteEnemiesDefeated: number;
}

export interface GameStats {
    levelStats: LevelStats[];
    totalTowersPlaced: TowerStats;
    totalEnemiesDefeated: EnemyStats;
    totalPointsEarned: number;
    totalEliteEnemiesDefeated: number;
}

export const createEmptyTowerStats = (): TowerStats => ({
    [TowerType.LIGHT]: 0,
    [TowerType.NORMAL]: 0,
    [TowerType.HEAVY]: 0
});

export const createEmptyEnemyStats = (): EnemyStats => ({
    [EnemyType.LIGHT]: 0,
    [EnemyType.NORMAL]: 0,
    [EnemyType.HEAVY]: 0
});

export const createEmptyLevelStats = (): LevelStats => ({
    towersPlaced: createEmptyTowerStats(),
    enemiesDefeated: createEmptyEnemyStats(),
    baseHealthRemaining: 0,
    pointsEarned: 0,
    timeTaken: 0,
    eliteEnemiesDefeated: 0
});

export const createEmptyGameStats = (): GameStats => ({
    levelStats: [],
    totalTowersPlaced: createEmptyTowerStats(),
    totalEnemiesDefeated: createEmptyEnemyStats(),
    totalPointsEarned: 0,
    totalEliteEnemiesDefeated: 0
}); 