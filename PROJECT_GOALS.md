# Tower Defense Game - Project Goals

## Tech Stack
- Runtime: Bun
- Framework: TypeScript + Vite
- Style: Industrial/Monospace/Brutalism

## Core Game Mechanics

### Level Structure
- 3 distinct levels
- 10 rounds per level
- Enemy scaling: Round n spawns (n × 10) enemies
  - Round 1: 10 enemies
  - Round 10: 100 enemies

### Base Mechanics
- Starting health: 100
- Health gain: +10 per round
- Damage taken: -5 per enemy reaching base
- Location: Opposite to enemy spawn point(s)

### Economy System
- Starting points: 300
- Points gained per kill:
  - Light enemy: +10
  - Normal enemy: +20
  - Heavy enemy: +30

### Units

#### Towers
1. Light Tower
   - Cost: 50 points
   - Fire rate: 4/second
   - Damage: 5
   
2. Normal Tower
   - Cost: 100 points
   - Fire rate: 2/second
   - Damage: 10
   
3. Heavy Tower
   - Cost: 150 points
   - Fire rate: 1/second
   - Damage: 30

Features:
- Movable after placement
- Can only be placed on non-path tiles

#### Enemies
1. Light Enemy
   - Health: 10
   
2. Normal Enemy
   - Health: 20
   
3. Heavy Enemy
   - Health: 30

Features:
- Follow predetermined paths
- Despawn on reaching base
- Fixed spawn location(s) per level

## Technical Requirements

### Performance Optimization
- Object pooling for enemies and projectiles
- Efficient path finding
- Memory management
- State cleanup

### Architecture
- Clear separation of:
  - Game logic
  - Rendering
  - State management
  - Event handling
- Modular component design
- Type safety

### Visual Design
- Brutalist/Industrial aesthetic
- Monospace typography
- Color palette:
  - Primary: Grayscale
  - Accents: Industrial yellow/black
- Grid-based layout

## Development Phases

### Phase 1: Core Setup
- Project initialization
- Basic game loop
- Grid system
- Path system

### Phase 2: Game Elements
- Tower implementation
- Enemy system
- Collision detection
- Projectile system

### Phase 3: Game Logic
- Round management
- Score system
- Economy system
- Win/lose conditions

### Phase 4: Polish
- UI/UX implementation
- Visual effects
- Sound system
- Performance optimization

## Testing Requirements
- Unit tests for game logic
- Performance testing
- Browser compatibility
- State management validation 