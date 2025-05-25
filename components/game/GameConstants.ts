
// Fix: Import Phaser for Phaser.Display.Color
import Phaser from 'phaser';

export const GAME_CONSTANTS = {
    GAME_WIDTH: 480,
    GAME_HEIGHT: 720,
    HIGH_SCORE_KEY: 'floppyReactBirdHighScore',
};

export const BIRD_CONSTANTS = {
    BIRD_START_X: GAME_CONSTANTS.GAME_WIDTH / 3.5,
    BIRD_START_Y: GAME_CONSTANTS.GAME_HEIGHT / 2,
    BIRD_FLAP_VELOCITY: -330, 
    BIRD_GRAVITY: 800, 
    BIRD_ANGULAR_VELOCITY_UP: -20,
    BIRD_ANGULAR_VELOCITY_DOWN: 5, 
    BIRD_MAX_ANGLE_DOWN: 90,
};

export const PIPE_CONSTANTS = {
    PIPE_WIDTH: 80, 
    PIPE_SPAWN_INTERVAL_MIN: 1400, 
    PIPE_SPAWN_INTERVAL_MAX: 2000, 
    PIPE_SPEED: -160, 
    PIPE_GAP_MIN_HEIGHT: 150, 
    PIPE_GAP_MAX_HEIGHT: 200, 
};

export const BACKGROUND_CONSTANTS = {
    DAY_DURATION: 60000, 
    NIGHT_DURATION: 60000, 
    TOTAL_CYCLE_DURATION: 120000, 
    GROUND_SPEED_FACTOR: 0.03, 
    MOUNTAIN_BG_SPEED_FACTOR: 0.05,
    MOUNTAIN_FG_SPEED_FACTOR: 0.1,
    TREE_SPEED_FACTOR: 0.15,
    CLOUD_SPEED_FACTOR_NEAR: 0.25,
    CLOUD_SPEED_FACTOR_FAR: 0.15,

    SUNRISE_COLOR: new Phaser.Display.Color(255, 159, 64), 
    DAY_COLOR: new Phaser.Display.Color(113, 197, 207),     
    SUNSET_COLOR: new Phaser.Display.Color(255, 127, 80),  
    DUSK_COLOR: new Phaser.Display.Color(70, 70, 120),     
    NIGHT_COLOR: new Phaser.Display.Color(15, 15, 45),
    RAINBOW_DEPTH: -2, // Depth for the rainbow background element
};

export const UI_CONSTANTS = {
    PRIMARY_FONT: "'Press Start 2P', cursive",
    TEXT_COLOR_LIGHT: '#FFFFFF',
    TEXT_COLOR_DARK: '#000000',
    TEXT_COLOR_SCORE: '#FFFF00',
    TEXT_COLOR_HIGH_SCORE_FLASH: '#FFD700',
    TEXT_COLOR_GAME_OVER: '#FF0000',
    LUCKY_BREAK_TEXT_COLOR: '#FF69B4', // Hot pink for "Lucky Break"
};

export const SOUND_CONSTANTS = {
    SCORE_SOUND_PITCH_RISE_SEMITONES: 7, 
    SCORE_SOUND_DURATION: 0.25, 
    SCORE_MIDI_NOTE_MIN: 55, 
    SCORE_MIDI_NOTE_MAX: 79, 
    INITIAL_SCORE_MIDI_NOTE: 60,
    COLLECT_SOUND_BASE_NOTE: 'C5',
    COLLECT_SOUND_DURATION_COIN: '32n',
    COLLECT_SOUND_DURATION_DIAMOND: '16n',
};

export interface ItemType {
    key: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
    textureKey: string;
    value: number;
    rarityWeight: number;
    hoverDuration: number;
    color: number;
    width?: number;
    height?: number;
    soundNote: string;
}

export const ITEM_CONSTANTS = {
    ITEM_SPAWN_CHANCE: 0.75, 
    ITEM_SIZE: { width: 20, height: 20 }, 
    HOVER_PADDING: 5, 
    TYPES: [
        { 
            key: 'BRONZE', 
            textureKey: 'bronzeCoinTexture', 
            value: 1, 
            rarityWeight: 55, 
            hoverDuration: 2200, 
            color: 0xCD7F32,
            width: 40, 
            height: 40, 
            soundNote: 'C5'
        },
        { 
            key: 'SILVER', 
            textureKey: 'silverCoinTexture', 
            value: 2, 
            rarityWeight: 25, 
            hoverDuration: 1800, 
            color: 0xC0C0C0,
            width: 30, 
            height: 30, 
            soundNote: 'E5'
        },
        { 
            key: 'GOLD', 
            textureKey: 'goldCoinTexture', 
            value: 3, 
            rarityWeight: 15, 
            hoverDuration: 1400, 
            color: 0xFFD700,
            soundNote: 'G5'
        },
        { 
            key: 'DIAMOND', 
            textureKey: 'diamondTexture', 
            value: 5, 
            rarityWeight: 5, 
            hoverDuration: 1000, 
            color: 0xB9F2FF, 
            width: 22, 
            height: 28,
            soundNote: 'C6'
        },
    ] as ItemType[],
};

export const BONUS_CONSTANTS = {
    INITIAL_PIPES_FOR_BONUS: 10, // Initial number of pipes to trigger the first bonus
    PIPES_FOR_BONUS_INCREMENT: 10, // How much the pipe requirement increases after each bonus
    BONUS_PHASE_DURATION: 20000, // Duration of bonus phase in milliseconds (20 seconds)
    // BONUS_ITEM_COUNT: 50, // REMOVED - Items now spawn continuously
    BONUS_ITEM_SPAWN_INTERVAL: 175, // Milliseconds between each bonus item spawn
    RAINBOW_COLORS: [0xff0000, 0xffa500, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0xee82ee], // Red, Orange, Yellow, Green, Blue, Indigo, Violet
    RAINBOW_BAND_HEIGHT: 30,
};
