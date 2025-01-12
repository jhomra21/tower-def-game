import { TowerType, EnemyType } from '../types/GameTypes';
import { GameState, RoundState } from '../types/GameState';
import { TOWER_STATS } from '../types/GameTypes';
import { GameStats, LevelStats } from '../types/GameStats';

export class UI {
    private container: HTMLDivElement;
    private statsPanel: HTMLDivElement;
    private controlsPanel: HTMLDivElement;
    private pauseButton: HTMLButtonElement;
    private selectedTowerType: TowerType | null = null;
    private pointsAnimations: HTMLDivElement[] = [];
    private trashCan: HTMLDivElement;
    private isTrashCanHighlighted: boolean = false;
    private prepPhaseOverlay: HTMLDivElement | null = null;
    private prepTimerDisplay: HTMLDivElement | null = null;

    constructor(
        onTowerSelect: (type: TowerType) => void, 
        onPauseToggle: () => void,
        onSpeedChange: (speed: number) => void
    ) {
        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        document.body.appendChild(this.container);

        // Create stats panel with pointer events enabled
        this.statsPanel = this.createStatsPanel();
        this.statsPanel.style.pointerEvents = 'auto';
        this.container.appendChild(this.statsPanel);

        // Create pause button
        this.pauseButton = this.createPauseButton(onPauseToggle);
        this.container.appendChild(this.pauseButton);

        // Create speed controls
        const speedControls = this.createSpeedControls(onSpeedChange);
        this.container.appendChild(speedControls);

        // Create controls panel
        this.controlsPanel = this.createControlsPanel(onTowerSelect);
        this.container.appendChild(this.controlsPanel);

        // Create trash can
        this.trashCan = this.createTrashCan();
        this.container.appendChild(this.trashCan);

        // Initial UI scale update
        this.updateUIScale();
        window.addEventListener('resize', () => this.updateUIScale());
    }

    private createStatsPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.top = '20px';
        panel.style.left = '20px';
        panel.style.padding = '15px';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        panel.style.color = '#fff';
        panel.style.fontFamily = 'monospace';
        panel.style.borderRadius = '10px';
        panel.style.pointerEvents = 'auto';
        panel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        panel.style.minWidth = '180px';
        return panel;
    }

    private createPauseButton(onPauseToggle: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = '⏸️';
        button.style.position = 'absolute';
        button.style.top = '20px';
        button.style.right = '20px';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '10px';
        button.style.cursor = 'pointer';
        button.style.fontFamily = 'monospace';
        button.style.fontSize = '20px';
        button.style.pointerEvents = 'auto';
        button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        
        button.addEventListener('click', onPauseToggle);
        
        return button;
    }

    private createSpeedControls(onSpeedChange: (speed: number) => void): HTMLDivElement {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '120px';  // Position above tower selection panel
        container.style.left = '50%';  // Center horizontally like tower panel
        container.style.transform = 'translateX(-50%)';  // Center horizontally
        container.style.display = 'flex';
        container.style.flexDirection = 'row';  // Horizontal on mobile
        container.style.gap = '5px';
        container.style.pointerEvents = 'auto';
        container.style.zIndex = '100';  // Ensure it's above other elements
        container.classList.add('speed-controls');

        const speeds = [
            { label: '1x', value: 1, icon: '🐌' },
            { label: '1.5x', value: 1.5, icon: '🏃' },
            { label: '2x', value: 2, icon: '🏎️' }
        ];

        speeds.forEach(({ label, value, icon }) => {
            const button = document.createElement('button');
            button.classList.add('speed-button');
            button.innerHTML = `${icon} ${label}`;  // Simplified layout
            button.style.padding = '8px 12px';
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.borderRadius = '10px';
            button.style.cursor = 'pointer';
            button.style.fontFamily = 'monospace';
            button.style.fontSize = '14px';
            button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
            button.style.minWidth = '80px';
            button.style.textAlign = 'center';
            button.style.touchAction = 'manipulation';

            button.addEventListener('click', () => {
                onSpeedChange(value);
                container.querySelectorAll('button').forEach(btn => {
                    btn.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                    btn.style.border = 'none';
                });
                button.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
                button.style.border = '2px solid #00ff00';
            });

            container.appendChild(button);
        });

        return container;
    }

    private animatePointsChange(amount: number, x: number, y: number): void {
        const animation = document.createElement('div');
        animation.style.position = 'absolute';
        animation.style.left = `${x}px`;
        animation.style.top = `${y}px`;
        animation.style.color = amount > 0 ? '#00ff00' : '#ff0000';
        animation.style.fontFamily = 'monospace';
        animation.style.fontSize = '20px';
        animation.style.pointerEvents = 'none';
        animation.style.transition = 'all 0.5s ease-out';
        animation.textContent = `${amount > 0 ? '+' : ''}${amount}`;

        this.container.appendChild(animation);
        this.pointsAnimations.push(animation);

        // Start animation
        requestAnimationFrame(() => {
            animation.style.transform = 'translateY(-50px)';
            animation.style.opacity = '0';
        });

        // Remove after animation
        setTimeout(() => {
            animation.remove();
            this.pointsAnimations = this.pointsAnimations.filter(a => a !== animation);
        }, 500);
    }

    private createControlsPanel(onTowerSelect: (type: TowerType) => void): HTMLDivElement {
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.bottom = '20px';
        panel.style.left = '50%';
        panel.style.transform = 'translateX(-50%)';
        panel.style.display = 'flex';
        panel.style.gap = '10px';
        panel.style.padding = '15px';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        panel.style.borderRadius = '15px';
        panel.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        panel.style.pointerEvents = 'auto';
        panel.style.maxWidth = '90%';  // Prevent overflow on mobile
        panel.style.overflowX = 'auto';  // Allow scrolling if needed
        panel.style.overflowY = 'hidden';
        // Use standard overflow properties instead of vendor prefixes
        panel.style.scrollBehavior = 'smooth';  // Smooth scrolling
        panel.style.scrollbarWidth = 'none';  // Hide scrollbar on Firefox

        // Add CSS to hide scrollbar on WebKit browsers
        const style = document.createElement('style');
        style.textContent = `
            #tower-controls::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);
        panel.id = 'tower-controls';

        // Create tower buttons with improved mobile layout
        Object.entries(TOWER_STATS).forEach(([type, stats]) => {
            const button = document.createElement('button');
            button.style.display = 'flex';
            button.style.flexDirection = 'column';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.padding = '12px';
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            button.style.border = 'none';
            button.style.borderRadius = '10px';
            button.style.cursor = 'pointer';
            button.style.minWidth = '100px';
            button.style.color = '#fff';
            button.style.fontFamily = 'monospace';
            button.style.transition = 'all 0.2s ease';
            button.style.touchAction = 'manipulation';  // Optimize for touch
            button.style.userSelect = 'none';  // Prevent text selection

            // Tower icon/color indicator with tower-specific colors
            const colorIndicator = document.createElement('div');
            colorIndicator.style.width = '30px';
            colorIndicator.style.height = '30px';
            colorIndicator.style.backgroundColor = type === TowerType.LIGHT ? '#00ff00' : 
                                                 type === TowerType.NORMAL ? '#0088ff' : 
                                                 '#ff0000';  // HEAVY type
            colorIndicator.style.borderRadius = '50%';
            colorIndicator.style.marginBottom = '8px';
            button.appendChild(colorIndicator);

            // Tower name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            nameSpan.style.marginBottom = '4px';
            button.appendChild(nameSpan);

            // Tower cost
            const costSpan = document.createElement('span');
            costSpan.textContent = `${stats.cost} ⭐`;
            costSpan.style.color = '#ffaa00';
            costSpan.style.fontSize = '0.9em';
            button.appendChild(costSpan);

            button.addEventListener('click', () => {
                onTowerSelect(type as TowerType);
                // Update button states
                panel.querySelectorAll('button').forEach(btn => {
                    btn.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                    btn.style.border = 'none';
                });
                button.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
                button.style.border = '2px solid #00ff00';
            });

            // Add hover effect
            button.addEventListener('mouseenter', () => {
                if (button.style.border !== '2px solid #00ff00') {
                    button.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
                }
            });
            button.addEventListener('mouseleave', () => {
                if (button.style.border !== '2px solid #00ff00') {
                    button.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                }
            });

            panel.appendChild(button);
        });

        return panel;
    }

    private updateButtonStates(container: HTMLElement): void {
        const buttons = Array.from(container.getElementsByTagName('button'));
        const towerCount = parseInt(this.statsPanel.textContent?.match(/Towers: (\d+)\/10/)?.[1] || '0');
        
        buttons.forEach((button: HTMLButtonElement) => {
            if (towerCount >= 10) {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.style.border = '2px solid #ff6666';
                const costIndicator = button.querySelector('div:last-child') as HTMLDivElement;
                if (costIndicator) {
                    costIndicator.textContent = 'MAX';
                    costIndicator.style.backgroundColor = '#ff6666';
                }
            } else {
                const type = button.textContent?.split(' ')[0] as TowerType;
                const isSelected = type === this.selectedTowerType;
                
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.style.backgroundColor = isSelected ? '#444' : '#222';
                button.style.border = `2px solid ${isSelected ? '#00ff00' : '#444'}`;
                button.style.boxShadow = isSelected ? '0 0 10px rgba(0, 255, 0, 0.3)' : 'none';
            }
        });
    }

    public updateStats(gameState: GameState, roundState: RoundState, previousPoints?: number): void {
        // Points animation handling
        if (previousPoints !== undefined && previousPoints !== gameState.points) {
            const pointsDiff = gameState.points - previousPoints;
            const display = this.statsPanel.getBoundingClientRect();
            this.animatePointsChange(
                pointsDiff,
                display.left + display.width / 2,
                display.top + display.height
            );
        }

        // Create the stats panel content
        const content = document.createElement('div');
        content.style.pointerEvents = 'auto';

        // Add level and round info
        const header = document.createElement('div');
        header.style.fontSize = '16px';
        header.style.marginBottom = '10px';
        header.style.textAlign = 'center';
        header.style.borderBottom = '1px solid #333';
        header.style.paddingBottom = '5px';
        header.textContent = `Level ${gameState.currentLevel} - Round ${gameState.currentRound}/5`;
        content.appendChild(header);

        // Add points display
        const pointsDiv = document.createElement('div');
        pointsDiv.style.fontSize = '20px';
        pointsDiv.style.textAlign = 'center';
        pointsDiv.style.margin = '10px 0';
        pointsDiv.style.padding = '5px';
        pointsDiv.style.borderRadius = '5px';
        pointsDiv.innerHTML = `<span style="color: #ffaa00">⭐</span> ${gameState.points}`;
        content.appendChild(pointsDiv);

        // Add health bar
        const baseHealthPercent = (gameState.baseHealth / gameState.maxBaseHealth) * 100;
        const healthColor = baseHealthPercent > 66 ? '#00ff00' : baseHealthPercent > 33 ? '#ffaa00' : '#ff0000';
        const healthDiv = document.createElement('div');
        healthDiv.style.margin = '8px 0';
        healthDiv.innerHTML = `
            Base Health: 
            <div style="background: #333; height: 8px; border-radius: 4px; margin-top: 5px">
                <div style="background: ${healthColor}; width: ${baseHealthPercent}%; height: 100%; border-radius: 4px; transition: all 0.3s"></div>
            </div>
        `;
        content.appendChild(healthDiv);

        // Add enemy count
            const enemyDiv = document.createElement('div');
            enemyDiv.style.margin = '8px 0';
            enemyDiv.innerHTML = `
                Enemies: <span style="float: right; color: #ffaa00">${roundState.enemiesDefeated}/${roundState.totalEnemies}</span>
            `;
            content.appendChild(enemyDiv);

        // Add tower count
        const towerDiv = document.createElement('div');
        towerDiv.style.margin = '8px 0';
        towerDiv.innerHTML = `
            Towers: <span style="float: right; color: ${gameState.towerCount >= 10 ? '#ff6666' : gameState.towerCount >= 8 ? '#ffaa00' : '#00ff00'}">${gameState.towerCount}/10</span>
        `;
        content.appendChild(towerDiv);

        // Clear and update the stats panel
        while (this.statsPanel.firstChild) {
            this.statsPanel.removeChild(this.statsPanel.firstChild);
        }
        this.statsPanel.appendChild(content);
    }

    public showMessage(message: string, duration: number = 2000): void {
        const messageElement = document.createElement('div');
        messageElement.style.position = 'absolute';
        messageElement.style.top = '25%';  // Position at 25% from top
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.padding = '15px 25px';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';  // Increased opacity
        messageElement.style.color = '#fff';
        messageElement.style.fontFamily = 'monospace';
        messageElement.style.fontSize = window.innerWidth < 768 ? '16px' : '20px';  // Smaller font on mobile
        messageElement.style.borderRadius = '10px';
        messageElement.style.pointerEvents = 'none';
        messageElement.style.textAlign = 'center';
        messageElement.style.zIndex = '1000';
        messageElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        messageElement.style.whiteSpace = 'pre-line';
        messageElement.style.maxWidth = window.innerWidth < 768 ? '90%' : '600px';  // Limit width on mobile
        messageElement.style.wordWrap = 'break-word';  // Prevent text overflow
        messageElement.textContent = message;

        // Add a subtle animation
        messageElement.style.animation = 'fadeInOut 0.3s ease-in-out';
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -40%); }
                100% { opacity: 1; transform: translate(-50%, -50%); }
            }
        `;
        document.head.appendChild(style);

        this.container.appendChild(messageElement);

        if (duration > 0) {
            setTimeout(() => {
                messageElement.style.transition = 'all 0.3s ease-out';
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translate(-50%, -60%)';
        setTimeout(() => {
            messageElement.remove();
                    style.remove();
                }, 300);
        }, duration);
        }

        // Update message position on window resize
        const updatePosition = () => {
            messageElement.style.fontSize = window.innerWidth < 768 ? '16px' : '20px';
            messageElement.style.maxWidth = window.innerWidth < 768 ? '90%' : '600px';
        };
        window.addEventListener('resize', updatePosition);

        // Clean up resize listener when message is removed
        if (duration > 0) {
            setTimeout(() => {
                window.removeEventListener('resize', updatePosition);
            }, duration + 300);
        }
    }

    public setPauseState(isPaused: boolean): void {
        this.pauseButton.textContent = isPaused ? '▶️' : '⏸️';
        
        if (isPaused) {
            this.showMessage('PAUSED\nPress ESC or click pause button to resume', 0);
        }
    }

    public getSelectedTowerType(): TowerType | null {
        return this.selectedTowerType;
    }

    public setSelectedTowerType(type: TowerType | null): void {
        this.selectedTowerType = type;
        this.updateButtonStates(this.controlsPanel);
    }

    public clearTowerSelection(): void {
        this.setSelectedTowerType(null);
    }

    private createTrashCan(): HTMLDivElement {
        const trashCan = document.createElement('div');
        trashCan.style.position = 'fixed';
        trashCan.style.bottom = '20px';
        trashCan.style.right = '20px';
        trashCan.style.width = '60px';
        trashCan.style.height = '60px';
        trashCan.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        trashCan.style.borderRadius = '10px';
        trashCan.style.display = 'flex';
        trashCan.style.alignItems = 'center';
        trashCan.style.justifyContent = 'center';
        trashCan.style.fontSize = '30px';
        trashCan.style.cursor = 'pointer';
        trashCan.style.transition = 'all 0.2s ease';
        trashCan.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        trashCan.innerHTML = '🗑️';
        return trashCan;
    }

    public isOverTrashCan(x: number, y: number): boolean {
        const rect = this.trashCan.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    public highlightTrashCan(highlight: boolean): void {
        if (this.isTrashCanHighlighted === highlight) return;
        
        this.isTrashCanHighlighted = highlight;
        if (highlight) {
            this.trashCan.style.transform = 'scale(1.1)';
            this.trashCan.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
            this.trashCan.style.backgroundColor = 'rgba(255, 0, 0, 0.85)';
        } else {
            this.trashCan.style.transform = 'scale(1)';
            this.trashCan.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
            this.trashCan.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        }
    }

    private updateUIScale(): void {
        const isMobile = window.innerWidth < 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        
        // Base scale calculation with minimum scale for mobile
        const minScale = isMobile ? 0.8 : 0.6;
        const scale = Math.max(minScale, Math.min(1, Math.min(window.innerWidth / 1024, window.innerHeight / 768)));
        
        // Minimum sizes for mobile
        const MIN_TOUCH_TARGET = isMobile ? 44 : 32;
        const MIN_FONT_SIZE = isMobile ? 16 : 12;
        const BASE_PADDING = isMobile ? 12 : 8;
        
        // Calculate scaled values with minimums
        const fontSize = Math.max(MIN_FONT_SIZE, Math.floor(16 * scale));
        const padding = Math.max(BASE_PADDING, Math.floor(15 * scale));
        
        // Update stats panel
        this.statsPanel.style.fontSize = `${fontSize}px`;
        this.statsPanel.style.padding = `${padding}px`;
        this.statsPanel.style.minWidth = `${Math.max(180, 180 * scale)}px`;
        
        // Adjust stats panel position for portrait mode
        if (isPortrait) {
            this.statsPanel.style.left = '50%';
            this.statsPanel.style.transform = 'translateX(-50%)';
            this.statsPanel.style.width = '90%';
            this.statsPanel.style.maxWidth = '400px';
            this.statsPanel.style.top = '10px';
        } else {
            this.statsPanel.style.left = '20px';
            this.statsPanel.style.transform = 'none';
            this.statsPanel.style.width = 'auto';
            this.statsPanel.style.top = '20px';
        }

        // Update controls panel
        this.controlsPanel.style.padding = `${padding}px`;
        this.controlsPanel.style.gap = `${padding}px`;
        this.controlsPanel.style.bottom = isMobile ? '10px' : '20px';
        
        // Update tower buttons
        const buttons = this.controlsPanel.getElementsByTagName('button');
        const buttonSize = Math.max(MIN_TOUCH_TARGET * 1.5, 120 * scale);
        for (const button of buttons) {
            button.style.padding = `${padding}px`;
            button.style.minWidth = `${buttonSize}px`;
            button.style.minHeight = `${MIN_TOUCH_TARGET * 1.2}px`;
            button.style.fontSize = `${fontSize}px`;
        }
        
        // Update speed controls
        const speedControls = this.container.querySelector('.speed-controls') as HTMLElement;
        if (speedControls) {
            speedControls.style.bottom = '120px';  // Position above tower selection
            speedControls.style.left = '50%';
            speedControls.style.transform = 'translateX(-50%)';
            speedControls.style.flexDirection = isMobile ? 'row' : 'column';
            speedControls.style.maxWidth = isMobile ? '90%' : 'auto';
        }

        // Update speed buttons
        const speedButtons = this.container.querySelectorAll('.speed-button');
        speedButtons.forEach(button => {
            if (button instanceof HTMLElement) {
                button.style.padding = `${padding/2}px ${padding}px`;
                button.style.minWidth = `${MIN_TOUCH_TARGET * 2}px`;
                button.style.minHeight = `${MIN_TOUCH_TARGET}px`;
                button.style.fontSize = `${fontSize}px`;
            }
        });

        // Update pause button
        this.pauseButton.style.minWidth = `${MIN_TOUCH_TARGET}px`;
        this.pauseButton.style.minHeight = `${MIN_TOUCH_TARGET}px`;
        this.pauseButton.style.fontSize = `${Math.max(MIN_FONT_SIZE * 1.2, 20 * scale)}px`;
        this.pauseButton.style.top = '20px';
        this.pauseButton.style.right = '20px';

        // Update trash can
        const trashCanSize = Math.max(MIN_TOUCH_TARGET * 2, 60 * scale);
        this.trashCan.style.width = `${trashCanSize}px`;
        this.trashCan.style.height = `${trashCanSize}px`;
        this.trashCan.style.fontSize = `${trashCanSize * 0.5}px`;
        this.trashCan.style.bottom = isMobile ? '10px' : '20px';
    }

    public showLevelComplete(stats: LevelStats, hasNextLevel: boolean, onNextLevel: () => void): void {
        // Remove any existing overlays first
        const existingOverlay = this.container.querySelector('.level-complete-overlay');
        if (existingOverlay) {
            this.container.removeChild(existingOverlay);
        }

        const overlay = document.createElement('div');
        overlay.className = 'level-complete-overlay';  // Add class for easier cleanup
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '2000';
        overlay.style.padding = '20px';
        overlay.style.pointerEvents = 'auto';

        const panel = document.createElement('div');
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        panel.style.padding = '30px';
        panel.style.borderRadius = '15px';
        panel.style.color = '#fff';
        panel.style.fontFamily = 'monospace';
        panel.style.textAlign = 'center';
        panel.style.width = '90%';
        panel.style.maxWidth = '500px';
        panel.style.maxHeight = '90vh';
        panel.style.overflowY = 'auto';
        panel.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        panel.style.fontSize = window.innerWidth < 768 ? '14px' : '16px';
        panel.style.pointerEvents = 'auto';  // Enable pointer events on panel

        // Add stats content
        panel.innerHTML = `
            <h2 style="color: #00ff00; margin-bottom: 20px; font-size: 1.5em;">Level Complete!</h2>
            <div style="margin: 20px 0; text-align: left">
                <div style="margin: 10px 0">Time: ${Math.floor(stats.timeTaken)} seconds</div>
                <div style="margin: 10px 0">Base Health: ${stats.baseHealthRemaining}%</div>
                <div style="margin: 10px 0">Points Earned: ${stats.pointsEarned}</div>
                <div style="margin: 10px 0">Elite Enemies Defeated: ${stats.eliteEnemiesDefeated}</div>
                <div style="margin: 15px 0">
                    <div style="margin: 5px 0">Towers Placed:</div>
                    <div style="padding-left: 20px">
                        🟢 Light: ${stats.towersPlaced[TowerType.LIGHT]}<br>
                        🔵 Normal: ${stats.towersPlaced[TowerType.NORMAL]}<br>
                        🔴 Heavy: ${stats.towersPlaced[TowerType.HEAVY]}
                    </div>
                </div>
                <div style="margin: 15px 0">
                    <div style="margin: 5px 0">Enemies Defeated:</div>
                    <div style="padding-left: 20px">
                        Light: ${stats.enemiesDefeated[EnemyType.LIGHT]}<br>
                        Normal: ${stats.enemiesDefeated[EnemyType.NORMAL]}<br>
                        Heavy: ${stats.enemiesDefeated[EnemyType.HEAVY]}
                    </div>
                </div>
            </div>
        `;

        // Create and style the button with proper event handling
        const button = document.createElement('button');
        button.textContent = hasNextLevel ? 'Next Level' : 'View Final Stats';
        button.style.padding = '15px 30px';
        button.style.fontSize = window.innerWidth < 768 ? '18px' : '16px';
        button.style.backgroundColor = '#00ff00';
        button.style.color = '#000';
        button.style.border = 'none';
        button.style.borderRadius = '8px';
        button.style.cursor = 'pointer';
        button.style.marginTop = '20px';
        button.style.minWidth = '200px';
        button.style.minHeight = '44px';
        button.style.transition = 'all 0.2s ease';
        button.style.userSelect = 'none';
        button.style.touchAction = 'manipulation';
        button.style.pointerEvents = 'auto';  // Enable pointer events
        button.style.position = 'relative';  // Ensure proper stacking
        button.style.zIndex = '2001';  // Ensure button is above overlay

        // Add hover and active states
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#33ff33';
            button.style.transform = 'scale(1.05)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#00ff00';
            button.style.transform = 'scale(1)';
        });
        button.addEventListener('mousedown', () => {
            button.style.backgroundColor = '#00cc00';
            button.style.transform = 'scale(0.95)';
        });
        button.addEventListener('mouseup', () => {
            button.style.backgroundColor = '#33ff33';
            button.style.transform = 'scale(1.05)';
        });

        // Handle both click and touch events
        const handleAction = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove overlay immediately
            if (overlay && overlay.parentNode === this.container) {
                this.container.removeChild(overlay);
            }
            
            // Clear any existing prep phase state
            if (this.prepPhaseOverlay) {
                this.prepPhaseOverlay.remove();
                this.prepPhaseOverlay = null;
                this.prepTimerDisplay = null;
            }
            
            // Call the next level callback directly
            onNextLevel();
        };

        button.addEventListener('click', handleAction);
        button.addEventListener('touchend', handleAction, { passive: false });

        panel.appendChild(button);
        overlay.appendChild(panel);
        this.container.appendChild(overlay);
    }

    public showGameComplete(stats: GameStats): void {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '2000';

        const panel = document.createElement('div');
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        panel.style.padding = '30px';
        panel.style.borderRadius = '15px';
        panel.style.color = '#fff';
        panel.style.fontFamily = 'monospace';
        panel.style.textAlign = 'center';
        panel.style.maxWidth = '600px';
        panel.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';

        // Add game stats content
        panel.innerHTML = `
            <h2 style="color: #00ff00; margin-bottom: 20px">Game Complete!</h2>
            <div style="margin: 20px 0; text-align: left">
                <h3 style="color: #ffaa00; margin: 20px 0">Overall Statistics</h3>
                <div style="margin: 10px 0">Total Points: ${stats.totalPointsEarned}</div>
                <div style="margin: 10px 0">Total Elite Enemies: ${stats.totalEliteEnemiesDefeated}</div>
                <div style="margin: 15px 0">
                    <div style="margin: 5px 0">Total Towers Built:</div>
                    <div style="padding-left: 20px">
                        🟢 Light: ${stats.totalTowersPlaced[TowerType.LIGHT]}<br>
                        🔵 Normal: ${stats.totalTowersPlaced[TowerType.NORMAL]}<br>
                        🔴 Heavy: ${stats.totalTowersPlaced[TowerType.HEAVY]}
                    </div>
                </div>
                <div style="margin: 15px 0">
                    <div style="margin: 5px 0">Total Enemies Defeated:</div>
                    <div style="padding-left: 20px">
                        Light: ${stats.totalEnemiesDefeated[EnemyType.LIGHT]}<br>
                        Normal: ${stats.totalEnemiesDefeated[EnemyType.NORMAL]}<br>
                        Heavy: ${stats.totalEnemiesDefeated[EnemyType.HEAVY]}
                    </div>
                </div>
                
                <h3 style="color: #ffaa00; margin: 20px 0">Level Breakdown</h3>
                ${stats.levelStats.map((levelStats, index) => `
                    <div style="margin: 15px 0; padding: 10px; border: 1px solid #333; border-radius: 5px">
                        <div style="color: #ffaa00">Level ${index + 1}</div>
                        <div>Time: ${Math.floor(levelStats.timeTaken)} seconds</div>
                        <div>Points: ${levelStats.pointsEarned}</div>
                        <div>Elite Enemies: ${levelStats.eliteEnemiesDefeated}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add restart button
        const button = document.createElement('button');
        button.textContent = 'Play Again';
        button.style.padding = '10px 20px';
        button.style.fontSize = '16px';
        button.style.backgroundColor = '#00ff00';
        button.style.color = '#000';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.marginTop = '20px';

        button.addEventListener('click', () => {
            overlay.remove();
        });

        panel.appendChild(button);
        overlay.appendChild(panel);
        this.container.appendChild(overlay);
    }

    public showPrepPhase(timeRemaining: number, onSkip: () => void): void {
        // Remove existing overlay if any
        if (this.prepPhaseOverlay) {
            this.prepPhaseOverlay.remove();
            this.prepPhaseOverlay = null;
            this.prepTimerDisplay = null;
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.padding = '20px';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        overlay.style.color = '#fff';
        overlay.style.fontFamily = 'monospace';
        overlay.style.textAlign = 'center';
        overlay.style.borderRadius = '10px';
        overlay.style.zIndex = '1000';
        overlay.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        overlay.style.pointerEvents = 'auto';  // Ensure clicks are registered

        // Add timer display
        const timer = document.createElement('div');
        timer.style.fontSize = '24px';
        timer.style.marginBottom = '15px';
        timer.textContent = `Prep Time: ${Math.ceil(timeRemaining)}s`;
        this.prepTimerDisplay = timer;
        overlay.appendChild(timer);

        // Add skip button
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip Prep Phase';
        skipButton.style.padding = '10px 20px';
        skipButton.style.backgroundColor = '#00ff00';
        skipButton.style.color = '#000';
        skipButton.style.border = 'none';
        skipButton.style.borderRadius = '5px';
        skipButton.style.cursor = 'pointer';
        skipButton.style.fontSize = '16px';
        skipButton.style.pointerEvents = 'auto';  // Ensure clicks are registered
        skipButton.addEventListener('click', () => {
            if (this.prepPhaseOverlay) {
                this.prepPhaseOverlay.remove();
                this.prepPhaseOverlay = null;
                this.prepTimerDisplay = null;
            }
            onSkip();
        });
        overlay.appendChild(skipButton);

        this.prepPhaseOverlay = overlay;
        this.container.appendChild(overlay);
    }

    public updatePrepTimer(timeRemaining: number): void {
        if (this.prepTimerDisplay) {
            if (timeRemaining <= 0) {
                // Ensure overlay is removed
                if (this.prepPhaseOverlay) {
                    this.prepPhaseOverlay.remove();
                    this.prepPhaseOverlay = null;
                }
                this.prepTimerDisplay = null;
            } else {
                this.prepTimerDisplay.textContent = `Prep Time: ${Math.ceil(timeRemaining)}s`;
            }
        }
    }
} 