import Phaser from 'phaser';
import { GAME_CONSTANTS, BACKGROUND_CONSTANTS as BG_CONST, BONUS_CONSTANTS } from './GameConstants';

export class BackgroundManager {
    private scene: Phaser.Scene;
    private skyRectangle!: Phaser.GameObjects.Rectangle;
    private sun!: Phaser.GameObjects.Sprite;
    private moon!: Phaser.GameObjects.Sprite;
    private starsGroup!: Phaser.GameObjects.Group;
    private cloudsFarGroup!: Phaser.GameObjects.Group;
    private cloudsNearGroup!: Phaser.GameObjects.Group;
    private mountainsBgGroup!: Phaser.GameObjects.Group;
    private mountainsFgGroup!: Phaser.GameObjects.Group;
    private treesGroup!: Phaser.GameObjects.Group;
    private groundGroup!: Phaser.GameObjects.Group; 

    private cycleTime: number = 0;
    private groundVisualHeight: number = 70;

    // Bonus Phase Elements
    private rainbowGraphics: Phaser.GameObjects.Graphics | undefined;

    // Shooting Star Timer
    private nextShootingStarTime: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    preloadAssets(): void {
        const { make } = this.scene;

        const sunGraphics = make.graphics({ fillStyle: { color: 0xfff4a3 } });
        sunGraphics.fillCircle(25, 25, 25);
        sunGraphics.generateTexture('sunTexture', 50, 50);
        sunGraphics.destroy();

        this.generateFullMoonTexture();
        
        const starGraphics = make.graphics();
        starGraphics.fillStyle(0xffffff, 0.8);
        starGraphics.fillRect(0,0,2,2);
        starGraphics.generateTexture('starTexture', 2,2);
        starGraphics.destroy();

        // Shooting Star Texture (simple streak)
        const shootingStarGraphics = make.graphics();
        shootingStarGraphics.fillStyle(0xffffff, 0.9);
        shootingStarGraphics.fillRect(0, 0, 15, 2); // Small, short streak
        shootingStarGraphics.generateTexture('shootingStarTexture', 15, 2);
        shootingStarGraphics.destroy();

        const cloudGraphics1 = make.graphics();
        cloudGraphics1.fillStyle(0xffffff, 0.9);
        cloudGraphics1.fillEllipse(30, 20, 60, 30);
        cloudGraphics1.fillEllipse(60, 25, 70, 35);
        cloudGraphics1.fillEllipse(90, 20, 60, 30);
        cloudGraphics1.generateTexture('cloudTexture1', 120, 40);
        cloudGraphics1.destroy();

        const cloudGraphics2 = make.graphics();
        cloudGraphics2.fillStyle(0xf0f0f0, 0.85);
        cloudGraphics2.fillEllipse(25, 15, 50, 25);
        cloudGraphics2.fillEllipse(50, 20, 60, 30);
        cloudGraphics2.generateTexture('cloudTexture2', 80, 35);
        cloudGraphics2.destroy();
        
        const mountainGraphics1 = make.graphics();
        mountainGraphics1.fillStyle(0x303040);
        mountainGraphics1.beginPath();
        mountainGraphics1.moveTo(0, 150);
        mountainGraphics1.lineTo(50, 80);
        mountainGraphics1.lineTo(100, 120);
        mountainGraphics1.lineTo(150, 60);
        mountainGraphics1.lineTo(200, 150);
        mountainGraphics1.closePath();
        mountainGraphics1.fillPath();
        mountainGraphics1.generateTexture('mountainTexture1', 200, 150);
        mountainGraphics1.destroy();

        const mountainGraphics2 = make.graphics();
        mountainGraphics2.fillStyle(0x404050);
        mountainGraphics2.beginPath();
        mountainGraphics2.moveTo(0, 150);
        mountainGraphics2.lineTo(60, 50);
        mountainGraphics2.lineTo(120, 100);
        mountainGraphics2.lineTo(180, 40);
        mountainGraphics2.lineTo(250, 150);
        mountainGraphics2.closePath();
        mountainGraphics2.fillPath();
        mountainGraphics2.generateTexture('mountainTexture2', 250, 150);
        mountainGraphics2.destroy();

        const treeGraphics = make.graphics();
        treeGraphics.fillStyle(0x182818);
        treeGraphics.fillRect(15, 60, 10, 30); 
        treeGraphics.fillEllipse(20, 40, 40, 50); 
        treeGraphics.generateTexture('treeTexture', 40, 90);
        treeGraphics.destroy();

        const groundGenGraphics = make.graphics();
        groundGenGraphics.fillStyle(0x556B2F); 
        groundGenGraphics.fillRect(0, 0, GAME_CONSTANTS.GAME_WIDTH, this.groundVisualHeight);
        groundGenGraphics.fillStyle(0x4A5D23, 0.5); 
        groundGenGraphics.fillRect(0, this.groundVisualHeight * 0.3, GAME_CONSTANTS.GAME_WIDTH, this.groundVisualHeight * 0.4);
        groundGenGraphics.fillStyle(0x6B8E23, 0.3); 
        groundGenGraphics.fillRect(0, this.groundVisualHeight * 0.7, GAME_CONSTANTS.GAME_WIDTH, this.groundVisualHeight * 0.3);
        groundGenGraphics.generateTexture('groundTexture', GAME_CONSTANTS.GAME_WIDTH, this.groundVisualHeight);
        groundGenGraphics.destroy();
    }

    private generateFullMoonTexture(): void {
        const { make } = this.scene;
        const size = 40;
        const graphics = make.graphics();
        const litColor = 0xe0e0f0;   
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 2;

        graphics.fillStyle(litColor);
        graphics.fillCircle(centerX, centerY, radius);
        
        graphics.generateTexture('moonTextureFull', size, size);
        graphics.destroy();
    }

    create(_initialHighScore: number): void { 
        const { add } = this.scene;
        this.cycleTime = BG_CONST.DAY_DURATION; // Start at the beginning of the night cycle
        this.nextShootingStarTime = 0; // Initialize shooting star timer

        this.skyRectangle = add.rectangle(0, 0, GAME_CONSTANTS.GAME_WIDTH, GAME_CONSTANTS.GAME_HEIGHT, BG_CONST.DAY_COLOR.color)
            .setOrigin(0, 0)
            .setDepth(-10);

        this.starsGroup = add.group();
        this.cloudsFarGroup = add.group(); 
        this.groundGroup = add.group();     
        this.mountainsBgGroup = add.group(); 
        this.mountainsFgGroup = add.group(); 
        this.treesGroup = add.group();       
        this.cloudsNearGroup = add.group();  
        
        this.createGroundLayer(); 
        this.createScenery();     
        this.createClouds();
        this.createStars(50);

        this.sun = add.sprite(-50, GAME_CONSTANTS.GAME_HEIGHT / 2, 'sunTexture').setDepth(-8).setVisible(false);
        this.moon = add.sprite(-50, GAME_CONSTANTS.GAME_HEIGHT / 2, 'moonTextureFull').setDepth(-8).setVisible(false);
    }

    private createGroundLayer(): void {
        for (let i = 0; i < 2; i++) { 
            this.groundGroup.create(
                i * GAME_CONSTANTS.GAME_WIDTH,
                GAME_CONSTANTS.GAME_HEIGHT, 
                'groundTexture'
            )
            .setOrigin(0, 1) 
            .setDepth(-7); 
        }
    }

    private createScenery(): void {
        const horizonLineY = GAME_CONSTANTS.GAME_HEIGHT - this.groundVisualHeight;

        for (let i = 0; i < 3; i++) {
            const mountainX = Phaser.Math.Between(0, GAME_CONSTANTS.GAME_WIDTH) + i * GAME_CONSTANTS.GAME_WIDTH * 0.6;
            const mountainY = horizonLineY + Phaser.Math.Between(0, 15); 
            this.mountainsBgGroup.create(mountainX, mountainY, 'mountainTexture1')
                .setOrigin(0.5, 1)
                .setScale(Phaser.Math.FloatBetween(0.8, 1.2))
                .setDepth(-6); 
        }
        for (let i = 0; i < 3; i++) {
            const mountainX = Phaser.Math.Between(0, GAME_CONSTANTS.GAME_WIDTH) + i * GAME_CONSTANTS.GAME_WIDTH * 0.7;
            const mountainY = horizonLineY + Phaser.Math.Between(15, 30); 
            this.mountainsFgGroup.create(mountainX, mountainY, 'mountainTexture2')
                .setOrigin(0.5, 1)
                .setScale(Phaser.Math.FloatBetween(0.9, 1.3))
                .setDepth(-5);
        }
        for (let i = 0; i < 5; i++) {
            const treeX = Phaser.Math.Between(0, GAME_CONSTANTS.GAME_WIDTH) + i * GAME_CONSTANTS.GAME_WIDTH * 0.3;
            const treeY = GAME_CONSTANTS.GAME_HEIGHT - 20 - Phaser.Math.Between(0,this.groundVisualHeight * 0.3); 
            this.treesGroup.create(treeX, treeY, 'treeTexture')
                .setOrigin(0.5, 1)
                .setScale(Phaser.Math.FloatBetween(0.7, 1.1))
                .setDepth(-4); 
        }
    }

    private createClouds(): void {
        for (let i = 0; i < 5; i++) {
            this.cloudsFarGroup.create(
                Phaser.Math.Between(0, GAME_CONSTANTS.GAME_WIDTH * 1.5), 
                Phaser.Math.Between(GAME_CONSTANTS.GAME_HEIGHT * 0.1, GAME_CONSTANTS.GAME_HEIGHT * 0.4), 
                Phaser.Math.RND.pick(['cloudTexture1', 'cloudTexture2']))
                .setAlpha(Phaser.Math.FloatBetween(0.5, 0.7))
                .setScale(Phaser.Math.FloatBetween(0.6, 0.9))
                .setDepth(-9); 
        }
        for (let i = 0; i < 4; i++) {
            this.cloudsNearGroup.create(
                Phaser.Math.Between(0, GAME_CONSTANTS.GAME_WIDTH * 1.5), 
                Phaser.Math.Between(GAME_CONSTANTS.GAME_HEIGHT * 0.15, GAME_CONSTANTS.GAME_HEIGHT * 0.5), 
                Phaser.Math.RND.pick(['cloudTexture1', 'cloudTexture2']))
                .setAlpha(Phaser.Math.FloatBetween(0.7, 0.9))
                .setScale(Phaser.Math.FloatBetween(0.8, 1.2))
                .setDepth(-3);
        }
    }
    
    private createStars(count: number): void {
        for (let i = 0; i < count; i++) {
            const star = this.starsGroup.create(
                Phaser.Math.Between(0, GAME_CONSTANTS.GAME_WIDTH), 
                Phaser.Math.Between(0, GAME_CONSTANTS.GAME_HEIGHT * 0.7), 
                'starTexture')
                .setAlpha(0)
                .setDepth(-9); 
            star.setData('twinkleDelay', Phaser.Math.Between(0, 2000));
            star.setData('twinkleDuration', Phaser.Math.Between(500, 1500));
        }
    }

    update(delta: number, _pipeSpeed: number, gameTime: number): void {
        // Always update day/night cycle, regardless of rainbow visibility
        this.updateDayNightCycle(delta, gameTime);
    }

    updateScrollingBackgrounds(delta: number, pipeSpeed: number): void {
         const baseSpeed = pipeSpeed * (delta / 1000);

        this.groundGroup.incX(baseSpeed * BG_CONST.GROUND_SPEED_FACTOR);
        this.mountainsBgGroup.incX(baseSpeed * BG_CONST.MOUNTAIN_BG_SPEED_FACTOR);
        this.mountainsFgGroup.incX(baseSpeed * BG_CONST.MOUNTAIN_FG_SPEED_FACTOR);
        this.treesGroup.incX(baseSpeed * BG_CONST.TREE_SPEED_FACTOR);
        this.cloudsFarGroup.incX(baseSpeed * BG_CONST.CLOUD_SPEED_FACTOR_FAR);
        this.cloudsNearGroup.incX(baseSpeed * BG_CONST.CLOUD_SPEED_FACTOR_NEAR);

        const recycleElement = (element: Phaser.GameObjects.Sprite, groupWidthMultiplier: number = 1.5, isGround: boolean = false) => {
            if (element.x + element.displayWidth * element.scaleX < 0) {
                if (isGround) {
                     element.x += element.displayWidth * 2; 
                } else {
                    element.x = GAME_CONSTANTS.GAME_WIDTH * groupWidthMultiplier + Phaser.Math.Between(0, GAME_CONSTANTS.GAME_WIDTH * 0.2);
                     if (element.texture.key.startsWith('cloud')) {
                         element.y = Phaser.Math.Between(GAME_CONSTANTS.GAME_HEIGHT * 0.1, GAME_CONSTANTS.GAME_HEIGHT * (element.depth === -9 ? 0.4 : 0.5));
                    } else if (element.texture.key.startsWith('mountain')) {
                        const horizonLineY = GAME_CONSTANTS.GAME_HEIGHT - this.groundVisualHeight;
                        if (this.mountainsBgGroup.contains(element)) {
                             element.y = horizonLineY + Phaser.Math.Between(0, 15);
                        } else if (this.mountainsFgGroup.contains(element)) {
                             element.y = horizonLineY + Phaser.Math.Between(15, 30);
                        }
                    } else if (element.texture.key === 'treeTexture') {
                         element.y = GAME_CONSTANTS.GAME_HEIGHT - 20 - Phaser.Math.Between(0,this.groundVisualHeight * 0.3);
                    }
                }
            }
        };
        
        this.groundGroup.getChildren().forEach(g => recycleElement(g as Phaser.GameObjects.Sprite, 0, true));
        this.mountainsBgGroup.getChildren().forEach(c => recycleElement(c as Phaser.GameObjects.Sprite, 1.8));
        this.mountainsFgGroup.getChildren().forEach(c => recycleElement(c as Phaser.GameObjects.Sprite, 2.1));
        this.treesGroup.getChildren().forEach(c => recycleElement(c as Phaser.GameObjects.Sprite, 1.5));
        this.cloudsFarGroup.getChildren().forEach(c => recycleElement(c as Phaser.GameObjects.Sprite, 1.5));
        this.cloudsNearGroup.getChildren().forEach(c => recycleElement(c as Phaser.GameObjects.Sprite, 1.5));
    }

    private updateDayNightCycle(delta: number, gameTime: number): void {
        this.cycleTime = (this.cycleTime + delta) % BG_CONST.TOTAL_CYCLE_DURATION;
        
        let skyColor;
        const sunPathYBase = GAME_CONSTANTS.GAME_HEIGHT * 0.65;
        const sunPathAmplitude = GAME_CONSTANTS.GAME_HEIGHT * 0.50;

        if (this.cycleTime < BG_CONST.DAY_DURATION) { 
            this.sun.setVisible(true);
            this.moon.setVisible(false);
            this.starsGroup.children.each(c => { (c as Phaser.GameObjects.Sprite).setAlpha(0); return true; });

            const dayProgress = this.cycleTime / BG_CONST.DAY_DURATION;
            this.sun.x = Phaser.Math.Linear(-this.sun.width / 2, GAME_CONSTANTS.GAME_WIDTH + this.sun.width / 2, dayProgress);
            this.sun.y = sunPathYBase - (Math.sin(dayProgress * Math.PI) * sunPathAmplitude);

            if (dayProgress < 0.5) { 
                skyColor = Phaser.Display.Color.Interpolate.ColorWithColor(BG_CONST.SUNRISE_COLOR, BG_CONST.DAY_COLOR, 1, dayProgress * 2);
            } else { 
                skyColor = Phaser.Display.Color.Interpolate.ColorWithColor(BG_CONST.DAY_COLOR, BG_CONST.SUNSET_COLOR, 1, (dayProgress - 0.5) * 2);
            }
        } else { 
            this.sun.setVisible(false);
            this.moon.setVisible(true);

            const nightProgress = (this.cycleTime - BG_CONST.DAY_DURATION) / BG_CONST.NIGHT_DURATION;
            this.moon.x = Phaser.Math.Linear(-this.moon.width/2, GAME_CONSTANTS.GAME_WIDTH + this.moon.width/2, nightProgress);
            this.moon.y = sunPathYBase - (Math.sin(nightProgress * Math.PI) * sunPathAmplitude);
            
            // Spawn shooting stars during night
            if (gameTime > this.nextShootingStarTime) {
                this.spawnShootingStar();
                this.nextShootingStarTime = gameTime + Phaser.Math.Between(2000, 7000); // Next one in 2-7 seconds
            }

            const thirdOfNight = 1/3;
            if (nightProgress < thirdOfNight) { 
                const t = nightProgress / thirdOfNight;
                skyColor = Phaser.Display.Color.Interpolate.ColorWithColor(BG_CONST.SUNSET_COLOR, BG_CONST.DUSK_COLOR, 1, t);
            } else if (nightProgress < thirdOfNight * 2) { 
                const t = (nightProgress - thirdOfNight) / thirdOfNight;
                skyColor = Phaser.Display.Color.Interpolate.ColorWithColor(BG_CONST.DUSK_COLOR, BG_CONST.NIGHT_COLOR, 1, t);
            } else { 
                const t = (nightProgress - (thirdOfNight * 2)) / thirdOfNight;
                skyColor = Phaser.Display.Color.Interpolate.ColorWithColor(BG_CONST.NIGHT_COLOR, BG_CONST.SUNRISE_COLOR, 1, t);
            }

            this.starsGroup.children.each(c => {
                const star = c as Phaser.GameObjects.Sprite;
                if(gameTime > (star.getData('twinkleDelay') || 0)) {
                    this.scene.tweens.add({
                        targets: star,
                        alpha: Phaser.Math.FloatBetween(0.2, 0.8),
                        duration: star.getData('twinkleDuration') || 1000,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        onComplete: () => { star.setData('twinkleDelay', gameTime + Phaser.Math.Between(1000,3000)); }
                    });
                    star.setData('twinkleDelay', Number.MAX_SAFE_INTEGER); 
                }
                return true;
            });
        }
        this.skyRectangle.fillColor = skyColor.color;
    }

    private spawnShootingStar(): void {
        const startX = Phaser.Math.Between(0, GAME_CONSTANTS.GAME_WIDTH);
        const startY = Phaser.Math.Between(-10, GAME_CONSTANTS.GAME_HEIGHT * 0.2); // Start near top, can be on screen

        const shootingStar = this.scene.add.sprite(startX, startY, 'shootingStarTexture')
            .setOrigin(0.5, 0.5)
            .setDepth(-7) // Above far stars/sky, below near clouds/moon maybe
            .setAlpha(0); // Start invisible, fade in

        // Random angle for downward movement
        // Angle: 90 is straight down. Add/subtract for diagonal.
        // Let's aim for 90 +/- 30 degrees (i.e., 60 to 120 degrees)
        const travelAngleDeg = Phaser.Math.Between(75, 105); // Mostly downward, slight left/right
        shootingStar.setAngle(travelAngleDeg - 90); // Sprite angle if texture is horizontal

        const speed = Phaser.Math.Between(200, 400); // pixels per second
        const distanceToTravel = GAME_CONSTANTS.GAME_HEIGHT * 1.2; // Ensure it goes well off screen
        
        const duration = (distanceToTravel / speed) * 1000; // Duration in ms

        const endX = startX + Math.cos(Phaser.Math.DegToRad(travelAngleDeg)) * distanceToTravel;
        const endY = startY + Math.sin(Phaser.Math.DegToRad(travelAngleDeg)) * distanceToTravel;

        this.scene.tweens.add({
            targets: shootingStar,
            x: endX,
            y: endY,
            alpha: { from: 0.9, to: 0, start: 0.2, end: 1}, // Fade in quickly, then fade out over life
            duration: duration,
            ease: 'Power1',
            onStart: () => {
                shootingStar.setAlpha(0.1); // Start slightly visible
            },
            onUpdate: (tween, target) => {
                // Quick fade in at the start of its life, then fade out
                if (tween.progress < 0.1) {
                    target.alpha = tween.progress * 9; // Ramp up to 0.9 alpha in first 10% of life
                } else {
                    target.alpha = 0.9 * (1 - (tween.progress - 0.1) / 0.9); // Fade out over remaining 90%
                }
            },
            onComplete: () => {
                shootingStar.destroy();
            }
        });
    }

    // --- Bonus Phase Background Methods ---
    createAndShowRainbow(): Promise<void> {
        if (this.rainbowGraphics) {
            this.rainbowGraphics.destroy();
        }
        this.rainbowGraphics = this.scene.add.graphics().setDepth(BG_CONST.RAINBOW_DEPTH);
        
        const colors = BONUS_CONSTANTS.RAINBOW_COLORS;
        const bandHeight = BONUS_CONSTANTS.RAINBOW_BAND_HEIGHT;
        const gameWidth = GAME_CONSTANTS.GAME_WIDTH;
        // Adjust total rainbow height and starting position to be more centered or fill more screen
        const totalRainbowHeight = colors.length * bandHeight;
        const startY = (GAME_CONSTANTS.GAME_HEIGHT / 2) - (totalRainbowHeight / 2) - bandHeight; // Shift up slightly

        for (let i = 0; i < colors.length; i++) {
            this.rainbowGraphics.fillStyle(colors[i], 0.65); // Slightly transparent
            this.rainbowGraphics.fillRect(0, startY + i * bandHeight, gameWidth, bandHeight);
        }
        
        this.rainbowGraphics.setAlpha(0);
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.rainbowGraphics,
                alpha: 1, 
                duration: 700,
                ease: 'Power2',
                onComplete: () => resolve()
            });
        });
    }

    fadeOutAndDestroyRainbow(): Promise<void> {
        if (!this.rainbowGraphics || !this.rainbowGraphics.active) return Promise.resolve();
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.rainbowGraphics,
                alpha: 0,
                duration: 700,
                ease: 'Power2',
                onComplete: () => {
                    this.rainbowGraphics?.destroy();
                    this.rainbowGraphics = undefined;
                    resolve();
                }
            });
        });
    }

    // Call this if game ends during bonus phase
    cleanupBonusVisuals(): void {
        if (this.rainbowGraphics) {
            this.rainbowGraphics.destroy();
            this.rainbowGraphics = undefined;
        }
    }
}
