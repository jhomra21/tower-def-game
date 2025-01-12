# Tower Defense Game (Work in Progress)

A brutalist/industrial-styled tower defense game built with TypeScript, Vite, and Three.js.

## Features

- 3 unique levels with different path layouts
- 10 rounds per level with increasing difficulty
- 3 types of towers and enemies
- Industrial/brutalist visual style
- Point-based economy system
- Dynamic difficulty scaling

## Game Rules

### Base Mechanics
- Base starts with 100 health
- Gains 10 health each round
- Loses 5 health when an enemy reaches it

### Enemies
- Light Enemy: 10 health, fast speed
- Normal Enemy: 20 health, medium speed
- Heavy Enemy: 30 health, slow speed
- Each round spawns (round number × 10) enemies
- Defeating enemies grants points: 10/20/30 respectively

### Towers
- Light Tower: 50 points, 4 shots/sec, 5 damage
- Normal Tower: 100 points, 2 shots/sec, 10 damage
- Heavy Tower: 150 points, 1 shot/sec, 30 damage
- Towers can be moved after placement
- Cannot be placed on enemy paths

## Development

### Prerequisites
- Bun
- Node.js

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Navigate to project directory
cd tower-def-game

# Install dependencies
bun install

# Start development server
bun run dev
```

### Building
```bash
# Build for production
bun run build
```

## Project Structure

```
src/
├── core/           # Core game systems
├── entities/       # Game entities (towers, enemies)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── assets/         # Game assets
```

## Controls

- Click tower buttons to select tower type
- Click on the game field to place selected tower
- Towers automatically target nearest enemy in range
- ESC to deselect tower

## Technical Details

- Built with Three.js for 3D rendering
- TypeScript for type safety
- Vite for fast development and building
- Object pooling for performance optimization
- Modular architecture for easy expansion

## Performance Optimization

- Object pooling for projectiles and enemies
- Efficient pathfinding
- Optimized collision detection
- Memory management and cleanup

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
