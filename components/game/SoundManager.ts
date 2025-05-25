import * as Tone from 'tone';
import { SOUND_CONSTANTS as SC, ITEM_CONSTANTS } from './GameConstants';

export class SoundManager {
    public jumpSoundSynth: Tone.Synth | null = null;
    public jumpSoundLFO: Tone.LFO | null = null;
    public impactSoundSynth: Tone.NoiseSynth | null = null;
    private scoreSoundSynth: Tone.Synth | null = null;
    private collectSoundSynth: Tone.Synth | null = null;
    private collectSoundFilter: Tone.Filter | null = null;
    
    private currentScoreBaseMidiNote: number = SC.INITIAL_SCORE_MIDI_NOTE;

    // Next available play times for each synth to prevent scheduling conflicts
    private nextFlapSoundTime: number = 0;
    private nextImpactSoundTime: number = 0;
    private nextScoreSoundTime: number = 0;
    private nextCollectSoundTime: number = 0;
    private readonly schedulingBuffer: number = 0.005; // 5ms buffer

    constructor() {
        // Constructor can be empty if no scene-specific setup is needed for Tone.js
    }

    initSounds(): void {
        this.jumpSoundSynth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.005, decay: 0.05, sustain: 0.01, release: 0.1 }
        }).toDestination();
        this.jumpSoundLFO = new Tone.LFO({
            frequency: "8n",
            type: 'sine',
            min: -50,
            max: 50
        }).connect(this.jumpSoundSynth.detune).start();

        this.impactSoundSynth = new Tone.NoiseSynth({
            noise: { type: 'brown' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
        
        this.scoreSoundSynth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.15 }
        }).toDestination();

        this.collectSoundSynth = new Tone.Synth({
            oscillator: { type: 'square' }, // Changed for a slightly different timbre
            envelope: { attack: 0.005, decay: 0.08, sustain: 0.01, release: 0.12 }
        });

        // Initialize and connect the filter for collect sounds
        this.collectSoundFilter = new Tone.Filter({
            type: 'lowpass',
            frequency: 1000, // Initial base frequency
            Q: 1
        }).toDestination();
        this.collectSoundSynth.connect(this.collectSoundFilter);

        // Initialize next available times
        const now = Tone.now();
        this.nextFlapSoundTime = now;
        this.nextImpactSoundTime = now;
        this.nextScoreSoundTime = now;
        this.nextCollectSoundTime = now;
    }

    async ensureAudioContextStarted(): Promise<void> {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
    }

    playFlapSound(): void {
        if (this.jumpSoundSynth && this.jumpSoundLFO && Tone.context.state === 'running') {
            this.jumpSoundLFO.frequency.value = 6 + Math.random() * 8; 
            const randomDepth = 40 + Math.random() * 60; 
            this.jumpSoundLFO.min = -randomDepth / 2;
            this.jumpSoundLFO.max = randomDepth / 2;
            
            const durationString = "16n";
            const durationSeconds = Tone.Time(durationString).toSeconds();
            const now = Tone.now();
            const scheduledPlayTime = Math.max(now, this.nextFlapSoundTime);

            this.jumpSoundSynth.triggerAttackRelease("G3", durationString, scheduledPlayTime); 
            this.nextFlapSoundTime = scheduledPlayTime + durationSeconds + this.schedulingBuffer;
        }
    }

    playImpactSound(): void {
        if (this.impactSoundSynth && Tone.context.state === 'running') {
            const durationString = "8n";
            const durationSeconds = Tone.Time(durationString).toSeconds();
            const now = Tone.now();
            const scheduledPlayTime = Math.max(now, this.nextImpactSoundTime);

            this.impactSoundSynth.triggerAttackRelease(durationString, scheduledPlayTime);
            this.nextImpactSoundTime = scheduledPlayTime + durationSeconds + this.schedulingBuffer;
        }
    }

    playScoreSound(): void { // This is for passing pipes
        if (!this.scoreSoundSynth || Tone.context.state !== 'running') return;

        const soundDurationSeconds = SC.SCORE_SOUND_DURATION;
        const now = Tone.now();
        const scheduledPlayTime = Math.max(now, this.nextScoreSoundTime);
        
        const startFreq = Tone.Frequency(this.currentScoreBaseMidiNote, "midi").toFrequency();
        const endFreq = Tone.Frequency(this.currentScoreBaseMidiNote + SC.SCORE_SOUND_PITCH_RISE_SEMITONES, "midi").toFrequency();

        this.scoreSoundSynth.triggerAttack(startFreq, scheduledPlayTime);
        this.scoreSoundSynth.frequency.linearRampTo(endFreq, scheduledPlayTime + soundDurationSeconds * 0.7); 
        this.scoreSoundSynth.triggerRelease(scheduledPlayTime + soundDurationSeconds);
        this.nextScoreSoundTime = scheduledPlayTime + soundDurationSeconds + this.schedulingBuffer;

        this.currentScoreBaseMidiNote++;
        if (this.currentScoreBaseMidiNote > SC.SCORE_MIDI_NOTE_MAX) {
            this.currentScoreBaseMidiNote = SC.SCORE_MIDI_NOTE_MIN;
        }
    }

    playCollectSound(itemKey: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND'): void {
        if (!this.collectSoundSynth || !this.collectSoundFilter || Tone.context.state !== 'running') return;

        const itemDefinition = ITEM_CONSTANTS.TYPES.find(type => type.key === itemKey);
        if (!itemDefinition) return;

        // Randomize filter cutoff slightly each time
        this.collectSoundFilter.frequency.value = 800 + (Math.random() * 400); // Randomize between 800 Hz and 1200 Hz

        const note = itemDefinition.soundNote;
        const durationString = itemKey === 'DIAMOND' ? SC.COLLECT_SOUND_DURATION_DIAMOND : SC.COLLECT_SOUND_DURATION_COIN;
        const durationSeconds = Tone.Time(durationString).toSeconds();
        const now = Tone.now();
        const scheduledPlayTime = Math.max(now, this.nextCollectSoundTime);
        
        this.collectSoundSynth.triggerAttackRelease(note, durationString, scheduledPlayTime);
        this.nextCollectSoundTime = scheduledPlayTime + durationSeconds + this.schedulingBuffer;
    }

    dispose(): void {
        this.jumpSoundSynth?.dispose();
        this.jumpSoundLFO?.dispose();
        this.impactSoundSynth?.dispose();
        this.scoreSoundSynth?.dispose();
        this.collectSoundSynth?.dispose();
        this.collectSoundFilter?.dispose();

        this.jumpSoundSynth = null;
        this.jumpSoundLFO = null;
        this.impactSoundSynth = null;
        this.scoreSoundSynth = null;
        this.collectSoundSynth = null;
        this.collectSoundFilter = null;
        
        this.currentScoreBaseMidiNote = SC.INITIAL_SCORE_MIDI_NOTE;
    }
}
