import Phaser from 'phaser';
import { UI_CONSTANTS as UIC, GAME_CONSTANTS as GC, BONUS_CONSTANTS } from './GameConstants';

export class UIManager {
    private scene: Phaser.Scene;
    private gameWidth: number;
    private gameHeight: number;

    private scoreText!: Phaser.GameObjects.Text;
    private highScoreText!: Phaser.GameObjects.Text;
    private newHighScoreFlashText!: Phaser.GameObjects.Text;
    private gameInstructionsText!: Phaser.GameObjects.Text;
    private gameOverContainer!: Phaser.GameObjects.Container; 

    private pauseContainer!: Phaser.GameObjects.Container;
    private pauseTitleText!: Phaser.GameObjects.Text;
    private pauseSubtitleText!: Phaser.GameObjects.Text;

    // Bonus Phase UI
    private pipesUntilBonusText!: Phaser.GameObjects.Text;
    private luckyBreakMessageText!: Phaser.GameObjects.Text;
    private bonusCountdownText!: Phaser.GameObjects.Text;


    constructor(scene: Phaser.Scene, gameWidth: number, gameHeight: number) {
        this.scene = scene;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
    }

    create(initialHighScore: number): void {
        const centerX = this.gameWidth / 2;

        this.scoreText = this.scene.add.text(centerX, 50, 'Score: 0', {
            fontSize: '32px',
            color: UIC.TEXT_COLOR_LIGHT,
            fontFamily: UIC.PRIMARY_FONT,
            stroke: UIC.TEXT_COLOR_DARK,
            strokeThickness: 5,
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        this.gameInstructionsText = this.scene.add.text(
            centerX, 
            this.gameHeight / 2 - 60, 
            'Tap to Start!', 
            { fontSize: '28px', color: UIC.TEXT_COLOR_LIGHT, fontFamily: UIC.PRIMARY_FONT, align: 'center', stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(100);

        this.highScoreText = this.scene.add.text(
            centerX,
            this.gameHeight / 2 - 10,
            `High Score: ${initialHighScore}`,
            { fontSize: '20px', color: UIC.TEXT_COLOR_SCORE, fontFamily: UIC.PRIMARY_FONT, align: 'center', stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 3 }
        ).setOrigin(0.5).setDepth(100);
        
        this.newHighScoreFlashText = this.scene.add.text(
            centerX, this.gameHeight / 2 - 120, 'New High Score!',
            { fontSize: '28px', color: UIC.TEXT_COLOR_HIGH_SCORE_FLASH, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(201).setVisible(false);

        this.gameOverContainer = this.scene.add.container(0,0).setDepth(200).setVisible(false);

        this.pauseContainer = this.scene.add.container(0,0).setDepth(150).setVisible(false);
        this.pauseTitleText = this.scene.add.text(centerX, this.gameHeight / 2 - 40, 'Paused', {
            fontSize: '36px', color: UIC.TEXT_COLOR_LIGHT, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 6
        }).setOrigin(0.5);
        this.pauseSubtitleText = this.scene.add.text(centerX, this.gameHeight / 2 + 10, 'Press P to Unpause', {
            fontSize: '20px', color: UIC.TEXT_COLOR_LIGHT, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 4
        }).setOrigin(0.5);
        this.pauseContainer.add([this.pauseTitleText, this.pauseSubtitleText]);

        // Bonus UI elements
        this.pipesUntilBonusText = this.scene.add.text(
            centerX,
            this.gameHeight - 25, // Position at the bottom
            '', // Initialize empty, GameScene will set initial text
            { fontSize: '16px', color: UIC.TEXT_COLOR_LIGHT, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 3 }
        ).setOrigin(0.5).setDepth(100);
        // Removed: this.updatePipesUntilBonus(0, BONUS_CONSTANTS.PIPES_FOR_BONUS);


        this.bonusCountdownText = this.scene.add.text(
            centerX,
            this.scoreText.y + this.scoreText.height / 2 + 25, // Below score text
            '',
            { fontSize: '22px', color: UIC.TEXT_COLOR_LIGHT, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(100).setVisible(false);
    }

    showStartUI(highScore: number, initialPipesPassed: number, initialPipesNeeded: number): void {
        this.gameInstructionsText.setVisible(true);
        this.highScoreText.setText(`High Score: ${highScore}`).setVisible(true);
        this.scoreText.setVisible(false);
        this.newHighScoreFlashText.setVisible(false);
        this.gameOverContainer.setVisible(false);
        this.pauseContainer.setVisible(false);
        this.pipesUntilBonusText.setVisible(true);
        this.updatePipesUntilBonus(initialPipesPassed, initialPipesNeeded); // Use provided values
        this.bonusCountdownText.setVisible(false);
    }

    hideStartUI(): void {
        this.gameInstructionsText.setVisible(false);
        this.highScoreText.setVisible(false);
    }

    showGameUI(): void {
        this.scoreText.setText('Score: 0').setVisible(true);
        this.pipesUntilBonusText.setVisible(true);
    }

    updateScore(score: number): void {
        this.scoreText.setText(`Score: ${score}`);
    }

    showGameOverUI(score: number, highScore: number, isNewHighScore: boolean, _gameTime: number): void {
        this.gameOverContainer.removeAll(true); 

        const centerX = this.gameWidth / 2;
        const baseY = this.gameHeight / 2;

        const gameOverTitle = this.scene.add.text(centerX, baseY - 70, 'Game Over!', 
            { fontSize: '36px', color: UIC.TEXT_COLOR_GAME_OVER, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 6 }
        ).setOrigin(0.5);
        
        const finalScoreText = this.scene.add.text(centerX, baseY - 20, `Your Score: ${score}`, 
            { fontSize: '22px', color: UIC.TEXT_COLOR_LIGHT, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 4 }
        ).setOrigin(0.5);

        const highScoreDisplay = this.scene.add.text(centerX, baseY + 20, `High Score: ${highScore}`, 
            { fontSize: '22px', color: UIC.TEXT_COLOR_SCORE, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 4 }
        ).setOrigin(0.5);
        
        const restartText = this.scene.add.text(centerX, baseY + 70, 'Tap to Restart', 
            { fontSize: '20px', color: UIC.TEXT_COLOR_LIGHT, fontFamily: UIC.PRIMARY_FONT, stroke: UIC.TEXT_COLOR_DARK, strokeThickness: 4 }
        ).setOrigin(0.5);

        this.gameOverContainer.add([gameOverTitle, finalScoreText, highScoreDisplay, restartText]);
        
        this.scene.time.delayedCall(100, () => { 
            this.gameOverContainer.setVisible(true);
            if (isNewHighScore) {
                this.newHighScoreFlashText.setVisible(true);
                this.scene.time.delayedCall(2000, () => {
                    this.newHighScoreFlashText.setVisible(false);
                });
            }
        });
        this.pauseContainer.setVisible(false); 
        this.pipesUntilBonusText.setVisible(false); // Hide on game over
        this.bonusCountdownText.setVisible(false);
    }

    showPauseUI(): void {
        this.pauseContainer.setVisible(true);
    }

    hidePauseUI(): void {
        this.pauseContainer.setVisible(false);
    }

    // --- Bonus Phase UI Methods ---
    updatePipesUntilBonus(count: number, total: number): void {
        if (this.pipesUntilBonusText.active) {
            this.pipesUntilBonusText.setText(`Pipes until bonus: ${Math.max(0, total - count)}`);
        }
    }

    showBonusActiveStatus(): void {
         if (this.pipesUntilBonusText.active) {
            this.pipesUntilBonusText.setText('BONUS ROUND!');
        }
    }

    updateBonusCountdown(seconds: number): void {
        if (this.bonusCountdownText.active) {
            this.bonusCountdownText.setText(`Bonus Time: ${seconds.toFixed(0)}s`).setVisible(true);
        }
    }

    hideBonusCountdown(): void {
        if (this.bonusCountdownText.active) {
            this.bonusCountdownText.setVisible(false);
        }
    }
    
    destroy(): void {
        this.scoreText?.destroy();
        this.highScoreText?.destroy();
        this.newHighScoreFlashText?.destroy();
        this.gameInstructionsText?.destroy();
        this.gameOverContainer?.destroy(); 
        this.pauseContainer?.destroy();
        this.pipesUntilBonusText?.destroy();
        this.bonusCountdownText?.destroy();
    }
}
