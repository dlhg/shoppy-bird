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
            this.jumpSoundSynth.triggerAttackRelease("G3", "16n", Tone.now() + 0.001); 
        }
    }

    playImpactSound(): void {
        if (this.impactSoundSynth && Tone.context.state === 'running') {
            this.impactSoundSynth.triggerAttackRelease("8n", Tone.now());
        }
    }

    playScoreSound(): void { // This is for passing pipes
        if (!this.scoreSoundSynth || Tone.context.state !== 'running') return;

        const now = Tone.now();
        const startFreq = Tone.Frequency(this.currentScoreBaseMidiNote, "midi").toFrequency();
        const endFreq = Tone.Frequency(this.currentScoreBaseMidiNote + SC.SCORE_SOUND_PITCH_RISE_SEMITONES, "midi").toFrequency();

        this.scoreSoundSynth.triggerAttack(startFreq, now);
        this.scoreSoundSynth.frequency.linearRampTo(endFreq, now + SC.SCORE_SOUND_DURATION * 0.7); 
        this.scoreSoundSynth.triggerRelease(now + SC.SCORE_SOUND_DURATION);

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
        const duration = itemKey === 'DIAMOND' ? SC.COLLECT_SOUND_DURATION_DIAMOND : SC.COLLECT_SOUND_DURATION_COIN;
        
        this.collectSoundSynth.triggerAttackRelease(note, duration, Tone.now() + 0.001);
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
