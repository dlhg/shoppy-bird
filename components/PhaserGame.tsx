import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import * as Tone from 'tone';
import { BackgroundManager } from './game/BackgroundManager';
import { SoundManager } from './game/SoundManager';
import { UIManager } from './game/UIManager';
import { GAME_CONSTANTS, BIRD_CONSTANTS, PIPE_CONSTANTS, ITEM_CONSTANTS, ItemType, BONUS_CONSTANTS } from './game/GameConstants';

class GameScene extends Phaser.Scene {
    public make!: Phaser.GameObjects.GameObjectCreator;
    public physics!: Phaser.Physics.Arcade.ArcadePhysics;
    public input!: Phaser.Input.InputPlugin;
    public time!: Phaser.Time.Clock;
    public data!: Phaser.Data.DataManager;
    public scene!: Phaser.Scenes.ScenePlugin;
    public tweens!: Phaser.Tweens.TweenManager;


    private currentGapMinHeight!: number;
    private currentGapMaxHeight!: number;

    private bird!: Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body };
    private pipes!: Phaser.Physics.Arcade.Group;
    private scoreZones!: Phaser.Physics.Arcade.Group;
    private collectibleItems!: Phaser.Physics.Arcade.Group;
    
    private score: number = 0;
    private highScore: number = 0;
    private isGameOver: boolean = false;
    private pipeSpawnTimer: Phaser.Time.TimerEvent | undefined;
    private hasStarted: boolean = false;
    private isPaused: boolean = false;

    private backgroundManager!: BackgroundManager;
    private soundManager!: SoundManager;
    private uiManager!: UIManager;

    private itemTweens: Map<Phaser.GameObjects.Sprite, Phaser.Tweens.Tween> = new Map();
    private totalItemRarityWeight: number = 0;

    // Bonus Phase Variables
    private pipesPassedSinceLastBonus: number = 0;
    private pipesNeededForNextBonus: number = BONUS_CONSTANTS.INITIAL_PIPES_FOR_BONUS; // Dynamic target for bonus
    private isBonusPhaseActive: boolean = false;
    private bonusPhaseTimer: Phaser.Time.TimerEvent | undefined;
    private bonusItemSpawnTimer: Phaser.Time.TimerEvent | undefined;
    private bonusItemsGroup!: Phaser.Physics.Arcade.Group;


    constructor() {
        super({ key: 'GameScene' });
    }

    preload(): void {
        this.load.image('shoppyBirdAsset', 'assets/shoppy_sprite.png');

        const pipeWidth = PIPE_CONSTANTS.PIPE_WIDTH;
        const pipeTextureHeight = GAME_CONSTANTS.GAME_HEIGHT; 
        const pipeDetailedGraphics = this.make.graphics();
        const mainPipeColor = 0x228b22; 
        const pipeHighlightColor = 0x32cd32; 
        const pipeShadowColor = 0x006400; 
        const pipeCapHeight = 20; 
        pipeDetailedGraphics.fillStyle(mainPipeColor);
        pipeDetailedGraphics.fillRect(0, 0, pipeWidth, pipeTextureHeight);
        pipeDetailedGraphics.fillStyle(pipeHighlightColor, 0.6);
        pipeDetailedGraphics.fillRect(pipeWidth * 0.2, 0, pipeWidth * 0.2, pipeTextureHeight);
        pipeDetailedGraphics.fillStyle(pipeShadowColor, 0.3);
        pipeDetailedGraphics.fillRect(pipeWidth * 0.6, 0, pipeWidth * 0.2, pipeTextureHeight);
        pipeDetailedGraphics.fillStyle(pipeShadowColor);
        pipeDetailedGraphics.fillRect(0, pipeTextureHeight - pipeCapHeight, pipeWidth, pipeCapHeight); 
        pipeDetailedGraphics.fillStyle(mainPipeColor);
        pipeDetailedGraphics.fillRect(pipeWidth * 0.05, pipeTextureHeight - pipeCapHeight + 5, pipeWidth * 0.9, pipeCapHeight - 10); 
        pipeDetailedGraphics.fillStyle(pipeHighlightColor, 0.4);
        pipeDetailedGraphics.fillRect(pipeWidth * 0.05, pipeTextureHeight - pipeCapHeight + 5, pipeWidth * 0.9, (pipeCapHeight -10) * 0.3); 
        pipeDetailedGraphics.fillStyle(pipeShadowColor);
        pipeDetailedGraphics.fillRect(0, 0, pipeWidth, pipeCapHeight); 
        pipeDetailedGraphics.fillStyle(mainPipeColor);
        pipeDetailedGraphics.fillRect(pipeWidth * 0.05, 5, pipeWidth * 0.9, pipeCapHeight - 10); 
        pipeDetailedGraphics.fillStyle(pipeHighlightColor, 0.4);
        pipeDetailedGraphics.fillRect(pipeWidth * 0.05, 5, pipeWidth * 0.9, (pipeCapHeight -10) * 0.3); 
        pipeDetailedGraphics.generateTexture('pipeDetailedTexture', pipeWidth, pipeTextureHeight);
        pipeDetailedGraphics.destroy();
        
        this.backgroundManager = new BackgroundManager(this);
        this.backgroundManager.preloadAssets();
        this.preloadItemAssets();
    }

    preloadItemAssets(): void {
        ITEM_CONSTANTS.TYPES.forEach(itemType => {
            const width = itemType.width || ITEM_CONSTANTS.ITEM_SIZE.width;
            const height = itemType.height || ITEM_CONSTANTS.ITEM_SIZE.height;
            const graphics = this.make.graphics();
            graphics.fillStyle(itemType.color);
            graphics.setAlpha(0.9); 

            if (itemType.key === 'DIAMOND') {
                graphics.beginPath();
                graphics.moveTo(width / 2, 0); 
                graphics.lineTo(width, height / 3); 
                graphics.lineTo(width * 0.8, height); 
                graphics.lineTo(width * 0.2, height); 
                graphics.lineTo(0, height / 3); 
                graphics.closePath();
                graphics.fillPath();
                graphics.fillStyle(0xffffff, 0.5);
                graphics.fillTriangle(width/2, 0, width*0.4, height*0.3, width*0.6, height*0.3);

            } else { 
                graphics.fillCircle(width / 2, height / 2, Math.min(width, height) / 2);
                graphics.fillStyle(0xffffff, 0.3);
                graphics.fillCircle(width * 0.4, height * 0.4, Math.min(width, height) / 5);
            }
            graphics.generateTexture(itemType.textureKey, width, height);
            graphics.destroy();
        });
    }

    create(): void {
        this.isGameOver = false;
        this.hasStarted = false;
        this.isPaused = false;
        this.score = 0;
        this.itemTweens.clear();
        this.totalItemRarityWeight = ITEM_CONSTANTS.TYPES.reduce((sum, type) => sum + type.rarityWeight, 0);
        
        // Initialize pipe gap sizes
        this.currentGapMinHeight = PIPE_CONSTANTS.INITIAL_PIPE_GAP_MIN_HEIGHT;
        this.currentGapMaxHeight = PIPE_CONSTANTS.INITIAL_PIPE_GAP_MAX_HEIGHT;

        this.pipesPassedSinceLastBonus = 0;
        this.pipesNeededForNextBonus = BONUS_CONSTANTS.INITIAL_PIPES_FOR_BONUS; // Reset to initial value
        this.isBonusPhaseActive = false;
        if (this.bonusPhaseTimer) this.bonusPhaseTimer.remove(false);
        this.bonusPhaseTimer = undefined;
        if (this.bonusItemSpawnTimer) this.bonusItemSpawnTimer.remove(false);
        this.bonusItemSpawnTimer = undefined;


        const storedHighScore = localStorage.getItem(GAME_CONSTANTS.HIGH_SCORE_KEY);
        this.highScore = storedHighScore ? parseInt(storedHighScore, 10) : 0;

        this.soundManager = new SoundManager();
        this.soundManager.initSounds();
        
        this.backgroundManager.create(this.highScore);

        this.uiManager = new UIManager(this, GAME_CONSTANTS.GAME_WIDTH, GAME_CONSTANTS.GAME_HEIGHT);
        this.uiManager.create(this.highScore); 

        this.bird = this.physics.add.sprite(BIRD_CONSTANTS.BIRD_START_X, BIRD_CONSTANTS.BIRD_START_Y, 'shoppyBirdAsset') as GameScene['bird'];
        this.bird.body.setCollideWorldBounds(true);
        (this.bird.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
        this.bird.body.setGravityY(BIRD_CONSTANTS.BIRD_GRAVITY);
        this.bird.body.allowGravity = false;
        this.bird.setDepth(1);

        this.pipes = this.physics.add.group({ allowGravity: false, immovable: true });
        this.scoreZones = this.physics.add.group({ allowGravity: false, immovable: true });
        this.collectibleItems = this.physics.add.group({ allowGravity: false, immovable: true });
        this.bonusItemsGroup = this.physics.add.group({ allowGravity: false, immovable: true });
        
        this.uiManager.showStartUI(this.highScore, this.pipesPassedSinceLastBonus, this.pipesNeededForNextBonus);
        
        this.input.on('pointerdown', this.handleInput, this);
        this.input.keyboard?.on('keydown-SPACE', this.handleInput, this);
        this.input.keyboard?.on('keydown-P', this.togglePause, this);
        
        this.physics.add.collider(this.bird, this.pipes, this.handleCollision, undefined, this);
        this.physics.add.overlap(this.bird, this.scoreZones, this.passPipeGap, undefined, this);
        this.physics.add.overlap(this.bird, this.collectibleItems, this.handleItemCollect, undefined, this);
        this.physics.add.overlap(this.bird, this.bonusItemsGroup, this.handleItemCollect, undefined, this);


        this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body, up: boolean, down: boolean) => {
            if (body.gameObject === this.bird && (up || down)) {
                this.handleCollision();
            }
        });
    }

    selectRandomItemType(): ItemType {
        let randomWeight = Phaser.Math.FloatBetween(0, this.totalItemRarityWeight);
        for (const type of ITEM_CONSTANTS.TYPES) {
            if (randomWeight < type.rarityWeight) {
                return type;
            }
            randomWeight -= type.rarityWeight;
        }
        return ITEM_CONSTANTS.TYPES[0]; 
    }

    spawnItem(x: number, gapCenterY: number, gapHeight: number): void {
        const itemTypeDefinition = this.selectRandomItemType();
        const itemWidth = itemTypeDefinition.width || ITEM_CONSTANTS.ITEM_SIZE.width;
        const itemHeight = itemTypeDefinition.height || ITEM_CONSTANTS.ITEM_SIZE.height;

        const item = this.collectibleItems.create(x, gapCenterY, itemTypeDefinition.textureKey) as Phaser.Physics.Arcade.Sprite;
        item.setData('value', itemTypeDefinition.value);
        item.setData('typeKey', itemTypeDefinition.key); 
        item.setOrigin(0.5, 0.5);
        item.setPushable(false);
        item.setVelocityX(PIPE_CONSTANTS.PIPE_SPEED);
        item.setDepth(0); 
        if (item.body) { 
             item.body.setSize(itemWidth, itemHeight);
        }

        const hoverRange = (gapHeight / 2) - (itemHeight / 2) - ITEM_CONSTANTS.HOVER_PADDING;
        if (hoverRange > 5) { 
            const tween = this.tweens.add({
                targets: item,
                y: { from: gapCenterY - hoverRange, to: gapCenterY + hoverRange },
                duration: itemTypeDefinition.hoverDuration,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
            });
            this.itemTweens.set(item, tween);
        }
    }
    
    handleItemCollect(_bird: Phaser.Types.Physics.Arcade.GameObjectWithBody, itemGameObject: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
        if (this.isPaused || this.isGameOver || !itemGameObject.active) return;

        const item = itemGameObject as Phaser.Physics.Arcade.Sprite;
        const itemValue = item.getData('value') as number;
        const itemTypeKey = item.getData('typeKey') as ItemType['key'];

        if (itemValue === undefined || itemTypeKey === undefined) return; 

        this.score += itemValue;
        this.uiManager.updateScore(this.score);
        this.soundManager.playCollectSound(itemTypeKey);

        const regularTween = this.itemTweens.get(item);
        if (regularTween) {
            regularTween.stop();
            this.itemTweens.delete(item);
        }
        item.destroy(); 
    }


    togglePause(): void {
        if (!this.hasStarted || this.isGameOver) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.time.paused = true; 
            this.uiManager.showPauseUI();
            this.itemTweens.forEach(tween => { if (tween.isPlaying()) tween.pause(); });
            if (this.bonusPhaseTimer) this.bonusPhaseTimer.paused = true;
            if (this.bonusItemSpawnTimer) this.bonusItemSpawnTimer.paused = true;
        } else {
            this.physics.resume();
            this.time.paused = false;
            this.uiManager.hidePauseUI();
            this.soundManager.ensureAudioContextStarted();
            this.itemTweens.forEach(tween => { if (tween.isPaused()) tween.resume(); });
            if (this.bonusPhaseTimer) this.bonusPhaseTimer.paused = false;
            if (this.bonusItemSpawnTimer) this.bonusItemSpawnTimer.paused = false;
        }
    }
    
    handleInput(): void {
        if (this.isPaused && this.hasStarted) return;

        if (!this.hasStarted) {
            this.startGame();
        }
        if (!this.isGameOver) {
            this.flap();
        } else {
            const lastGameOverTime = this.data.get('gameOverTime') || 0;
            if (this.time.now - lastGameOverTime > 500) { 
                 // Reset pipe gap sizes when restarting the game
                 this.currentGapMinHeight = PIPE_CONSTANTS.INITIAL_PIPE_GAP_MIN_HEIGHT;
                 this.currentGapMaxHeight = PIPE_CONSTANTS.INITIAL_PIPE_GAP_MAX_HEIGHT;
                 this.scene.restart();
            }
        }
    }

    async startGame(): Promise<void> {
        await this.soundManager.ensureAudioContextStarted();
        this.hasStarted = true;
        this.bird.body.allowGravity = true;
        this.uiManager.hideStartUI();
        this.uiManager.showGameUI();
        this.addPipePair(); 
        this.uiManager.updatePipesUntilBonus(this.pipesPassedSinceLastBonus, this.pipesNeededForNextBonus);
    }

    flap(): void {
        if(this.isGameOver || this.isPaused || !this.hasStarted) return;
        this.bird.body.setVelocityY(BIRD_CONSTANTS.BIRD_FLAP_VELOCITY);
        this.bird.setAngle(BIRD_CONSTANTS.BIRD_ANGULAR_VELOCITY_UP);
        this.soundManager.playFlapSound();
    }

    addPipePair(): void {
        if (this.isGameOver || !this.hasStarted || this.isPaused || this.isBonusPhaseActive) return;

        const gapHeight = Phaser.Math.Between(this.currentGapMinHeight, this.currentGapMaxHeight);
        const minGapCenterY = (gapHeight / 2) + 50; 
        const maxGapCenterY = GAME_CONSTANTS.GAME_HEIGHT - (gapHeight / 2) - 50; 
        const gapPositionY = Phaser.Math.Between(minGapCenterY, maxGapCenterY);
    
        const topPipeHeight = gapPositionY - (gapHeight / 2);
        const topPipe = this.pipes.create(GAME_CONSTANTS.GAME_WIDTH + PIPE_CONSTANTS.PIPE_WIDTH / 2, 0, 'pipeDetailedTexture') as Phaser.Physics.Arcade.Sprite;
        topPipe.setOrigin(0.5, 0); 
        topPipe.displayHeight = topPipeHeight;
        topPipe.displayWidth = PIPE_CONSTANTS.PIPE_WIDTH;
        topPipe.body.setSize(PIPE_CONSTANTS.PIPE_WIDTH, GAME_CONSTANTS.GAME_HEIGHT, false); 
        topPipe.body.setOffset(0,0); 
        topPipe.body.updateFromGameObject();
        topPipe.setVelocityX(PIPE_CONSTANTS.PIPE_SPEED);
        topPipe.setPushable(false);
    
        const bottomPipeYPosition = gapPositionY + (gapHeight / 2);
        const bottomPipeHeight = GAME_CONSTANTS.GAME_HEIGHT - bottomPipeYPosition;
        const bottomPipe = this.pipes.create(GAME_CONSTANTS.GAME_WIDTH + PIPE_CONSTANTS.PIPE_WIDTH / 2, bottomPipeYPosition, 'pipeDetailedTexture') as Phaser.Physics.Arcade.Sprite;
        bottomPipe.setOrigin(0.5, 0); 
        bottomPipe.displayHeight = bottomPipeHeight;
        bottomPipe.displayWidth = PIPE_CONSTANTS.PIPE_WIDTH;
        bottomPipe.body.setSize(PIPE_CONSTANTS.PIPE_WIDTH, GAME_CONSTANTS.GAME_HEIGHT, false); 
        bottomPipe.body.setOffset(0,0); 
        bottomPipe.body.updateFromGameObject();
        bottomPipe.setVelocityX(PIPE_CONSTANTS.PIPE_SPEED);
        bottomPipe.setPushable(false);
    
        const scoreZone = this.scoreZones.create(topPipe.x, gapPositionY, undefined, undefined) as Phaser.Physics.Arcade.Sprite;
        scoreZone.setOrigin(0.5, 0.5);
        scoreZone.setVisible(false);
        scoreZone.body.setSize(PIPE_CONSTANTS.PIPE_WIDTH / 2, gapHeight);
        scoreZone.setVelocityX(PIPE_CONSTANTS.PIPE_SPEED);
        scoreZone.setData('scored', false);
        scoreZone.setPushable(false);

        if (Phaser.Math.FloatBetween(0, 1) < ITEM_CONSTANTS.ITEM_SPAWN_CHANCE) {
            this.spawnItem(topPipe.x, gapPositionY, gapHeight);
        }

        if (!this.isGameOver && this.hasStarted && !this.isPaused && !this.isBonusPhaseActive) {
            const nextDelay = Phaser.Math.Between(
                PIPE_CONSTANTS.PIPE_SPAWN_INTERVAL_MIN,
                PIPE_CONSTANTS.PIPE_SPAWN_INTERVAL_MAX
            );
            this.pipeSpawnTimer = this.time.addEvent({
                delay: nextDelay,
                callback: this.addPipePair,
                callbackScope: this,
                loop: false 
            });
        }

        // Decrease gap size for next pipes, ensuring it doesn't go below target minimums
        const decreaseAmountMin = this.currentGapMinHeight * PIPE_CONSTANTS.PIPE_GAP_DECREASE_FACTOR;
        this.currentGapMinHeight = Math.max(
            PIPE_CONSTANTS.TARGET_PIPE_GAP_MIN_HEIGHT, 
            this.currentGapMinHeight - decreaseAmountMin
        );

        const decreaseAmountMax = this.currentGapMaxHeight * PIPE_CONSTANTS.PIPE_GAP_DECREASE_FACTOR;
        this.currentGapMaxHeight = Math.max(
            PIPE_CONSTANTS.TARGET_PIPE_GAP_MAX_HEIGHT, 
            this.currentGapMaxHeight - decreaseAmountMax
        );
    }

    passPipeGap(_bird: Phaser.Types.Physics.Arcade.GameObjectWithBody, zone: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
        if (this.isPaused || this.isBonusPhaseActive) return; 
        const zoneSprite = zone as Phaser.Physics.Arcade.Sprite;
        if (!zoneSprite.getData('scored')) { 
            this.score++; 
            this.uiManager.updateScore(this.score);
            zoneSprite.setData('scored', true);
            this.soundManager.playScoreSound();

            this.pipesPassedSinceLastBonus++;
            this.uiManager.updatePipesUntilBonus(this.pipesPassedSinceLastBonus, this.pipesNeededForNextBonus);

            if (this.pipesPassedSinceLastBonus >= this.pipesNeededForNextBonus) {
                this.startBonusPhase();
            }
        }
    }
    
    handleCollision(): void {
        if (this.isGameOver || this.isPaused) return; 
        this.isGameOver = true;

        if (this.isBonusPhaseActive) { 
            this.forceEndBonusPhaseCleanup();
        }

        if (this.isPaused) {
            this.isPaused = false;
            this.time.paused = false;
            this.itemTweens.forEach(tween => { if (tween.isPaused()) tween.resume(); }); 
            this.uiManager.hidePauseUI();
        }
        this.data.set('gameOverTime', this.time.now); 

        this.soundManager.playImpactSound();
        this.physics.pause(); 
        this.itemTweens.forEach(tween => tween.pause()); 
        
        if (this.pipeSpawnTimer) {
            this.pipeSpawnTimer.remove(false); 
            this.pipeSpawnTimer = undefined; 
        }
        this.bird.setTint(0xff0000);
        this.bird.setAngle(BIRD_CONSTANTS.BIRD_MAX_ANGLE_DOWN);

        let isNewHighScore = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(GAME_CONSTANTS.HIGH_SCORE_KEY, this.highScore.toString());
            isNewHighScore = true;
        }
        
        this.uiManager.showGameOverUI(this.score, this.highScore, isNewHighScore, this.time.now);
    }

    // --- Bonus Phase Logic ---
    async startBonusPhase(): Promise<void> {
        this.isBonusPhaseActive = true;
        this.uiManager.showBonusActiveStatus();

        if (this.pipeSpawnTimer) {
            this.pipeSpawnTimer.paused = true;
        }
        
        this.bonusItemsGroup.clear(true, true); // Clear any previous bonus items
        this.bonusItemSpawnTimer = this.time.addEvent({
            delay: BONUS_CONSTANTS.BONUS_ITEM_SPAWN_INTERVAL,
            callback: this.spawnSingleBonusItem,
            callbackScope: this,
            loop: true
        });
        
        await Promise.all([
            this.uiManager.showLuckyBreakMessage(),
            this.backgroundManager.createAndShowRainbow()
        ]);

        this.bonusPhaseTimer = this.time.addEvent({
            delay: BONUS_CONSTANTS.BONUS_PHASE_DURATION,
            callback: this.endBonusPhase,
            callbackScope: this
        });
    }

    spawnSingleBonusItem(): void {
        if (!this.isBonusPhaseActive || this.isPaused || this.isGameOver) return;

        const itemTypes = ITEM_CONSTANTS.TYPES;
        // Spawn items starting from the right edge of the screen, or slightly off-screen right
        const x = GAME_CONSTANTS.GAME_WIDTH + Phaser.Math.Between(30, 100); // Spawn slightly off-screen right
        const y = Phaser.Math.Between(GAME_CONSTANTS.GAME_HEIGHT * 0.1, GAME_CONSTANTS.GAME_HEIGHT * 0.9); // Wide Y range
        
        const itemTypeDefinition = Phaser.Utils.Array.GetRandom(itemTypes); 
        const itemWidth = itemTypeDefinition.width || ITEM_CONSTANTS.ITEM_SIZE.width;
        const itemHeight = itemTypeDefinition.height || ITEM_CONSTANTS.ITEM_SIZE.height;

        const item = this.bonusItemsGroup.create(x, y, itemTypeDefinition.textureKey) as Phaser.Physics.Arcade.Sprite;
        item.setData('value', itemTypeDefinition.value);
        item.setData('typeKey', itemTypeDefinition.key);
        item.setOrigin(0.5, 0.5);
        item.setPushable(false);
        item.setDepth(0); 
        item.setVelocityX(PIPE_CONSTANTS.PIPE_SPEED); // Make bonus items scroll left

        if (item.body) {
            item.body.setSize(itemWidth, itemHeight);
            item.body.allowGravity = false;
        }
    }

    async endBonusPhase(): Promise<void> {
        if (!this.isBonusPhaseActive) return; 

        this.isBonusPhaseActive = false;
        
        if (this.bonusPhaseTimer) this.bonusPhaseTimer.remove(false); 
        this.bonusPhaseTimer = undefined;
        
        if (this.bonusItemSpawnTimer) this.bonusItemSpawnTimer.remove(false);
        this.bonusItemSpawnTimer = undefined;
        
        this.uiManager.hideBonusCountdown();

        await Promise.all([
            this.uiManager.hideLuckyBreakMessage(),
            this.backgroundManager.fadeOutAndDestroyRainbow()
        ]);

        this.bonusItemsGroup.clear(true, true);

        if (this.pipeSpawnTimer) {
            this.pipeSpawnTimer.paused = false;
        } else if (this.hasStarted && !this.isGameOver && !this.isPaused) {
            this.addPipePair();
        }
        
        this.pipesPassedSinceLastBonus = 0; 
        this.pipesNeededForNextBonus += BONUS_CONSTANTS.PIPES_FOR_BONUS_INCREMENT; 
        this.uiManager.updatePipesUntilBonus(this.pipesPassedSinceLastBonus, this.pipesNeededForNextBonus);
    }
    
    forceEndBonusPhaseCleanup(): void { 
        this.isBonusPhaseActive = false;
        if(this.bonusPhaseTimer) this.bonusPhaseTimer.remove(false);
        this.bonusPhaseTimer = undefined;
        
        if(this.bonusItemSpawnTimer) this.bonusItemSpawnTimer.remove(false);
        this.bonusItemSpawnTimer = undefined;
        
        this.uiManager.hideBonusCountdown();
        this.uiManager.hideLuckyBreakMessage(); 
        this.backgroundManager.cleanupBonusVisuals(); 
        this.bonusItemsGroup.clear(true, true);

        this.pipesPassedSinceLastBonus = 0; 
    }


    update(_time: number, delta: number): void {
        if (this.isPaused) {
            if (this.bird && this.bird.body) {
                 this.bird.body.setVelocity(0,0);
            }
            return; 
        }

        this.backgroundManager.update(delta, PIPE_CONSTANTS.PIPE_SPEED, this.time.now);

        if (!this.hasStarted) {
            this.bird.y = BIRD_CONSTANTS.BIRD_START_Y + Math.sin(_time / 200) * 10;
            this.bird.setAngle(0);
            return;
        }
        
        if (this.isGameOver) {
            if(this.bird.angle < BIRD_CONSTANTS.BIRD_MAX_ANGLE_DOWN) {
                 this.bird.angle += BIRD_CONSTANTS.BIRD_ANGULAR_VELOCITY_DOWN * (delta / 1000) * 10; 
            }
            return;
        }

        if (this.isBonusPhaseActive) {
            if (this.bonusPhaseTimer) {
                const remainingSeconds = Math.max(0, this.bonusPhaseTimer.getRemainingSeconds());
                this.uiManager.updateBonusCountdown(remainingSeconds);
            }
             if (this.bird.body.velocity.y > 0 && this.bird.angle < BIRD_CONSTANTS.BIRD_MAX_ANGLE_DOWN) { 
                this.bird.angle += BIRD_CONSTANTS.BIRD_ANGULAR_VELOCITY_DOWN * (delta / 1000) * 30; 
                if (this.bird.angle > BIRD_CONSTANTS.BIRD_MAX_ANGLE_DOWN) {
                    this.bird.setAngle(BIRD_CONSTANTS.BIRD_MAX_ANGLE_DOWN);
                }
            }
            this.backgroundManager.updateScrollingBackgrounds(delta, PIPE_CONSTANTS.PIPE_SPEED * 0.5);
            // Cleanup for bonus items that go off-screen
            this.bonusItemsGroup.getChildren().forEach(itemGameObject => {
                const item = itemGameObject as Phaser.Physics.Arcade.Sprite;
                if (item.x < -item.displayWidth) {
                    this.bonusItemsGroup.remove(item, true, true);
                }
            });
            return; 
        }
        
        if (this.bird.body.velocity.y > 0 && this.bird.angle < BIRD_CONSTANTS.BIRD_MAX_ANGLE_DOWN) { 
            this.bird.angle += BIRD_CONSTANTS.BIRD_ANGULAR_VELOCITY_DOWN * (delta / 1000) * 30; 
            if (this.bird.angle > BIRD_CONSTANTS.BIRD_MAX_ANGLE_DOWN) {
                this.bird.setAngle(BIRD_CONSTANTS.BIRD_MAX_ANGLE_DOWN);
            }
        }

        this.pipes.getChildren().forEach(pipe => {
            const pipeSprite = pipe as Phaser.Physics.Arcade.Sprite;
            if (pipeSprite.x < -pipeSprite.displayWidth) {
                this.pipes.remove(pipeSprite, true, true);
            }
        });
        this.scoreZones.getChildren().forEach(zone => {
            const zoneSprite = zone as Phaser.Physics.Arcade.Sprite;
            if (zoneSprite.x < -zoneSprite.displayWidth / 2 ) { 
                 this.scoreZones.remove(zoneSprite, true, true);
            }
        });
        this.collectibleItems.getChildren().forEach(itemGameObject => {
            const item = itemGameObject as Phaser.Physics.Arcade.Sprite;
            if (item.x < -item.displayWidth) {
                const tween = this.itemTweens.get(item);
                if (tween) {
                    tween.stop();
                    this.itemTweens.delete(item);
                }
                this.collectibleItems.remove(item, true, true);
            }
        });

        if (!this.isGameOver && this.hasStarted && !this.isBonusPhaseActive) {
            this.backgroundManager.updateScrollingBackgrounds(delta, PIPE_CONSTANTS.PIPE_SPEED);
        }
    }

    public disposeSounds(): void {
        this.soundManager?.dispose();
    }
}


const PhaserGame: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameContainerRef.current && !gameInstanceRef.current) {
            const gameConfig: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_CONSTANTS.GAME_WIDTH,
                height: GAME_CONSTANTS.GAME_HEIGHT,
                parent: gameContainerRef.current,
                physics: {
                    default: 'arcade',
                    arcade: {
                        // debug: process.env.NODE_ENV === 'development', 
                    }
                },
                scene: [GameScene],
                render: {
                    pixelArt: true, 
                }
            };
            gameInstanceRef.current = new Phaser.Game(gameConfig);
        }

        return () => {
            if (gameInstanceRef.current) {
                const scene = gameInstanceRef.current.scene.getScene('GameScene') as GameScene;
                if (scene && typeof scene.disposeSounds === 'function') {
                    scene.disposeSounds();
                }
                if (scene && scene['itemTweens'] instanceof Map) {
                     scene['itemTweens'].forEach(tween => tween.stop());
                     scene['itemTweens'].clear();
                }

                gameInstanceRef.current.destroy(true, false); 
                gameInstanceRef.current = null;
            }
        };
    }, []);

    return <div ref={gameContainerRef} style={{ width: `${GAME_CONSTANTS.GAME_WIDTH}px`, height: `${GAME_CONSTANTS.GAME_HEIGHT}px` }} role="application" aria-label="Shoppy Bird Game Canvas with Collectible Items and Bonus Phase" />;
};

export default PhaserGame;
