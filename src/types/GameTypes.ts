export enum TowerType {
    LIGHT = 'light',
    NORMAL = 'normal',
    HEAVY = 'heavy'
}

export enum EnemyType {
    LIGHT = 'light',
    NORMAL = 'normal',
    HEAVY = 'heavy'
}

export interface TowerStats {
    type: TowerType;
    fireRate: number;  // shots per second
    damage: number;
    cost: number;
    range?: number;    // Will be used for targeting
}

export interface EnemyStats {
    type: EnemyType;
    health: number;
    speed: number;
    pointsValue: number;
    isElite?: boolean;
}

// Base enemy stats
const BASE_ENEMY_STATS: Record<EnemyType, Omit<EnemyStats, 'isElite'>> = {
    [EnemyType.LIGHT]: {
        type: EnemyType.LIGHT,
        health: 30,
        speed: 2,
        pointsValue: 10
    },
    [EnemyType.NORMAL]: {
        type: EnemyType.NORMAL,
        health: 60,
        speed: 1.5,
        pointsValue: 20
    },
    [EnemyType.HEAVY]: {
        type: EnemyType.HEAVY,
        health: 80,
        speed: 1,
        pointsValue: 30
    }
};

// Function to create enemy stats with elite option
export function createEnemyStats(type: EnemyType, isElite: boolean = false): EnemyStats {
    const baseStats = BASE_ENEMY_STATS[type];
    return {
        ...baseStats,
        health: isElite ? baseStats.health * 2 : baseStats.health,
        pointsValue: isElite ? baseStats.pointsValue * 2 : baseStats.pointsValue,
        isElite
    };
}

// Export ENEMY_STATS for backward compatibility
export const ENEMY_STATS = BASE_ENEMY_STATS;

// Tower stats remain unchanged
export const TOWER_STATS: Record<TowerType, TowerStats> = {
    [TowerType.LIGHT]: {
        type: TowerType.LIGHT,
        fireRate: 4,
        damage: 2.5,
        cost: 50,
        range: 10
    },
    [TowerType.NORMAL]: {
        type: TowerType.NORMAL,
        fireRate: 2,
        damage: 5,
        cost: 100,
        range: 15
    },
    [TowerType.HEAVY]: {
        type: TowerType.HEAVY,
        fireRate: 0.5,
        damage: 10,
        cost: 150,
        range: 20
    }
}; 