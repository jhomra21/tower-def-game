import { TowerType } from '../types/GameTypes';
import { GameState, RoundState } from '../types/GameState';
import { TOWER_STATS } from '../types/GameTypes';

export class UI {
    private container: HTMLDivElement;
    private statsPanel: HTMLDivElement;
    private pointsDisplay: HTMLDivElement;
    private controlsPanel: HTMLDivElement;
    private pauseButton: HTMLButtonElement;
    private selectedTowerType: TowerType | null = null;
    private pointsAnimations: HTMLDivElement[] = [];
    private removeButton: HTMLButtonElement | null = null;
    private moveButton: HTMLButtonElement | null = null;

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

        // Create points display
        this.pointsDisplay = this.createPointsDisplay();
        this.container.appendChild(this.pointsDisplay);

        // Create pause button
        this.pauseButton = this.createPauseButton(onPauseToggle);
        this.container.appendChild(this.pauseButton);

        // Create speed controls
        const speedControls = this.createSpeedControls(onSpeedChange);
        this.container.appendChild(speedControls);

        // Create controls panel
        this.controlsPanel = this.createControlsPanel(onTowerSelect);
        this.container.appendChild(this.controlsPanel);
    }

    private createStatsPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.top = '20px';
        panel.style.left = '20px';
        panel.style.padding = '15px';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        panel.style.color = '#fff';
        panel.style.fontFamily = 'monospace';
        panel.style.borderRadius = '10px';
        panel.style.pointerEvents = 'auto';
        panel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        panel.style.minWidth = '180px';
        return panel;
    }

    private createPointsDisplay(): HTMLDivElement {
        const display = document.createElement('div');
        display.style.position = 'absolute';
        display.style.top = '20px';
        display.style.left = '50%';
        display.style.transform = 'translateX(-50%)';
        display.style.padding = '10px 20px';
        display.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        display.style.color = '#fff';
        display.style.fontFamily = 'monospace';
        display.style.fontSize = '24px';
        display.style.borderRadius = '10px';
        display.style.pointerEvents = 'none';
        display.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        return display;
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
        container.style.position = 'absolute';
        container.style.top = '20px';
        container.style.right = '100px';
        container.style.display = 'flex';
        container.style.gap = '5px';
        container.style.pointerEvents = 'auto';

        const speeds = [
            { label: '1x', value: 1, icon: '🐌' },
            { label: '1.5x', value: 1.5, icon: '🏃' },
            { label: '2x', value: 2, icon: '🏎️' }
        ];

        speeds.forEach(({ label, value, icon }) => {
            const button = document.createElement('button');
            button.innerHTML = `${icon}<br>${label}`;
            button.style.padding = '5px 10px';
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.borderRadius = '10px';
            button.style.cursor = 'pointer';
            button.style.fontFamily = 'monospace';
            button.style.fontSize = '14px';
            button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
            button.style.lineHeight = '1.2';
            button.style.minWidth = '50px';
            button.style.textAlign = 'center';

            button.addEventListener('click', () => {
                onSpeedChange(value);
                // Update all speed buttons
                container.querySelectorAll('button').forEach(btn => {
                    btn.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
                    btn.style.border = 'none';
                });
                button.style.backgroundColor = 'rgba(50, 50, 50, 0.85)';
                button.style.border = '1px solid #00ff00';
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
        panel.style.position = 'absolute';
        panel.style.bottom = '20px';
        panel.style.left = '50%';
        panel.style.transform = 'translateX(-50%)';
        panel.style.padding = '15px 20px';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        panel.style.color = '#fff';
        panel.style.fontFamily = 'monospace';
        panel.style.borderRadius = '15px';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.alignItems = 'center';
        panel.style.gap = '15px';
        panel.style.pointerEvents = 'auto';
        panel.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';

        // Add help text with better styling
        const helpText = document.createElement('div');
        helpText.style.marginBottom = '10px';
        helpText.style.textAlign = 'center';
        helpText.style.fontSize = '14px';
        helpText.style.lineHeight = '1.5';
        helpText.style.color = '#aaa';
        helpText.innerHTML = `
            <div style="color: #fff; margin-bottom: 8px">Tower Controls</div>
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 10px">
                <div>🎯 Select below</div>
                <div>📍 Click to place</div>
                <div>💰 50% refund</div>
            </div>
        `;
        panel.appendChild(helpText);

        // Create tower buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '10px';
        buttonsContainer.style.justifyContent = 'center';

        // Create tower buttons with improved styling
        Object.values(TowerType).forEach(type => {
            const button = document.createElement('button');
            button.style.padding = '12px';
            button.style.backgroundColor = '#222';
            button.style.color = '#fff';
            button.style.border = '2px solid #444';
            button.style.borderRadius = '8px';
            button.style.cursor = 'pointer';
            button.style.fontFamily = 'monospace';
            button.style.minWidth = '120px';
            button.style.position = 'relative';
            button.style.transition = 'all 0.2s';

            // Add tower icon and name
            const towerIcon = this.getTowerIcon(type);
            button.innerHTML = `
                <div style="font-size: 20px; margin-bottom: 5px">${towerIcon}</div>
                <div>${type} Tower</div>
            `;

            // Add cost indicator with improved styling
            const cost = TOWER_STATS[type].cost;
            const costIndicator = document.createElement('div');
            costIndicator.innerHTML = `<span style="font-size: 12px">⭐</span> ${cost}`;
            costIndicator.style.position = 'absolute';
            costIndicator.style.top = '-10px';
            costIndicator.style.right = '-10px';
            costIndicator.style.backgroundColor = '#ffaa00';
            costIndicator.style.color = '#000';
            costIndicator.style.padding = '3px 8px';
            costIndicator.style.borderRadius = '10px';
            costIndicator.style.fontSize = '12px';
            costIndicator.style.fontWeight = 'bold';
            button.appendChild(costIndicator);

            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#333';
                button.style.transform = 'translateY(-2px)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#222';
                button.style.transform = 'translateY(0)';
            });

            button.addEventListener('click', () => {
                if (this.selectedTowerType === type) {
                    this.selectedTowerType = null;
                } else {
                    this.selectedTowerType = type;
                }
                this.updateButtonStates(buttonsContainer);
                onTowerSelect(type);
            });

            buttonsContainer.appendChild(button);
        });

        panel.appendChild(buttonsContainer);
        return panel;
    }

    private getTowerIcon(type: TowerType): string {
        switch (type) {
            case TowerType.LIGHT:
                return '🟢';  // Fast, light damage
            case TowerType.NORMAL:
                return '🔵';  // Balanced
            case TowerType.HEAVY:
                return '🔴';  // Slow, heavy damage
            default:
                return '⚪';
        }
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
        // Points display update
        if (previousPoints !== undefined && previousPoints !== gameState.points) {
            const pointsDiff = gameState.points - previousPoints;
            const display = this.pointsDisplay.getBoundingClientRect();
            this.animatePointsChange(
                pointsDiff,
                display.left + display.width / 2,
                display.top + display.height
            );
            
            this.pointsDisplay.style.color = pointsDiff > 0 ? '#00ff00' : '#ff0000';
            setTimeout(() => {
                this.pointsDisplay.style.color = '#ffffff';
            }, 300);
        }

        this.pointsDisplay.innerHTML = `<span style="color: #ffaa00">⭐</span> ${gameState.points}`;

        // Stats panel update with improved styling
        const baseHealthPercent = (gameState.baseHealth / 100) * 100;
        const healthColor = baseHealthPercent > 66 ? '#00ff00' : baseHealthPercent > 33 ? '#ffaa00' : '#ff0000';

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

        // Add health bar
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

        // Add game speed indicator if not at normal speed
        if (gameState.gameSpeed !== 1) {
            const speedDiv = document.createElement('div');
            speedDiv.style.margin = '8px 0';
            speedDiv.style.textAlign = 'center';
            speedDiv.style.fontSize = '12px';
            speedDiv.style.color = '#ffaa00';
            speedDiv.textContent = `Game Speed: ${gameState.gameSpeed}x`;
            content.appendChild(speedDiv);
        }

        // Clear and update the stats panel
        while (this.statsPanel.firstChild) {
            this.statsPanel.removeChild(this.statsPanel.firstChild);
        }
        this.statsPanel.style.pointerEvents = 'auto';  // Enable pointer events for stats panel
        this.statsPanel.appendChild(content);
    }

    public showMessage(message: string, duration: number = 2000): void {
        const messageElement = document.createElement('div');
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.padding = '20px';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageElement.style.color = '#fff';
        messageElement.style.fontFamily = 'monospace';
        messageElement.style.fontSize = '24px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.pointerEvents = 'none';
        messageElement.style.textAlign = 'center';
        messageElement.textContent = message;

        this.container.appendChild(messageElement);

        setTimeout(() => {
            messageElement.remove();
        }, duration);
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

    public showTowerButtons(screenX: number, screenY: number, onRemove: () => void, onMove: () => void): void {
        // Remove existing buttons if any
        this.hideTowerButtons();

        // Create remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = '✕';
        removeButton.style.position = 'absolute';
        removeButton.style.left = `${screenX + 15}px`;  // Offset to the right
        removeButton.style.top = `${screenY}px`;
        removeButton.style.transform = 'translate(-50%, -50%)';
        removeButton.style.width = '24px';
        removeButton.style.height = '24px';
        removeButton.style.padding = '0';
        removeButton.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        removeButton.style.color = '#fff';
        removeButton.style.border = 'none';
        removeButton.style.borderRadius = '50%';
        removeButton.style.cursor = 'pointer';
        removeButton.style.fontFamily = 'monospace';
        removeButton.style.fontSize = '14px';
        removeButton.style.pointerEvents = 'auto';
        removeButton.style.zIndex = '1000';
        removeButton.style.display = 'flex';
        removeButton.style.alignItems = 'center';
        removeButton.style.justifyContent = 'center';

        // Create move button
        const moveButton = document.createElement('button');
        moveButton.textContent = '↖';
        moveButton.style.position = 'absolute';
        moveButton.style.left = `${screenX - 15}px`;  // Offset to the left
        moveButton.style.top = `${screenY}px`;
        moveButton.style.transform = 'translate(-50%, -50%)';
        moveButton.style.width = '24px';
        moveButton.style.height = '24px';
        moveButton.style.padding = '0';
        moveButton.style.backgroundColor = 'rgba(0, 255, 255, 0.8)';
        moveButton.style.color = '#fff';
        moveButton.style.border = 'none';
        moveButton.style.borderRadius = '50%';
        moveButton.style.cursor = 'pointer';
        moveButton.style.fontFamily = 'monospace';
        moveButton.style.fontSize = '14px';
        moveButton.style.pointerEvents = 'auto';
        moveButton.style.zIndex = '1000';
        moveButton.style.display = 'flex';
        moveButton.style.alignItems = 'center';
        moveButton.style.justifyContent = 'center';

        // Add hover effects
        const addHoverEffects = (button: HTMLButtonElement, baseColor: string) => {
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = baseColor.replace('0.8', '1');
                button.style.transform = 'translate(-50%, -50%) scale(1.1)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = baseColor;
                button.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        };

        addHoverEffects(removeButton, 'rgba(255, 0, 0, 0.8)');
        addHoverEffects(moveButton, 'rgba(0, 255, 255, 0.8)');

        // Add click handlers
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            onRemove();
            this.hideTowerButtons();
        });

        moveButton.addEventListener('click', (e) => {
            e.stopPropagation();
            onMove();
            // Don't hide buttons, they'll be hidden when move is complete
        });

        this.container.appendChild(removeButton);
        this.container.appendChild(moveButton);
        this.removeButton = removeButton;
        this.moveButton = moveButton;
    }

    public hideTowerButtons(): void {
        if (this.removeButton) {
            this.removeButton.remove();
            this.removeButton = null;
        }
        if (this.moveButton) {
            this.moveButton.remove();
            this.moveButton = null;
        }
    }

    public updateTowerButtonsPosition(screenX: number, screenY: number): void {
        if (this.removeButton && this.moveButton) {
            this.removeButton.style.left = `${screenX + 15}px`;
            this.removeButton.style.top = `${screenY}px`;
            this.moveButton.style.left = `${screenX - 15}px`;
            this.moveButton.style.top = `${screenY}px`;
        }
    }

    // Remove old methods that are no longer needed
    public showRemoveButton = undefined;
    public hideRemoveButton = undefined;
    public updateRemoveButtonPosition = undefined;
} 