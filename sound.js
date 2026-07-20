// ===================================
// WHO MOVED MY CHEESE? - THE GAME
// Sound Engine (procedural Web Audio SFX, SID-chip inspired)
// ===================================

const SoundEngine = (() => {
    let ctx = null;
    let masterGain = null;
    let muted = localStorage.getItem('cheese_sound_muted') === 'true';

    function ensureContext() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = muted ? 0 : 0.5;
        masterGain.connect(ctx.destination);
    }

    function init() {
        ensureContext();
        if (ctx.state === 'suspended') ctx.resume();
    }

    function tone(freq, startTime, duration, type, gainPeak) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
    }

    function sweep(freqFrom, freqTo, startTime, duration, type, gainPeak) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freqFrom, startTime);
        osc.frequency.linearRampToValueAtTime(freqTo, startTime + duration);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
    }

    const SOUNDS = {
        collect: () => sweep(440, 880, ctx.currentTime, 0.08, 'square', 0.2),
        'collect-golden': () => {
            const t = ctx.currentTime;
            [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.06, 0.06, 'triangle', 0.2));
        },
        warning: () => {
            const t = ctx.currentTime;
            tone(220, t, 0.1, 'triangle', 0.15);
            tone(220, t + 0.18, 0.1, 'triangle', 0.15);
        },
        'level-up': () => {
            const t = ctx.currentTime;
            [261, 329, 392, 523].forEach((f, i) => tone(f, t + i * 0.09, 0.09, 'square', 0.2));
        },
        'enemy-hit': () => sweep(150, 50, ctx.currentTime, 0.25, 'sawtooth', 0.3),
        'shield-block': () => tone(660, ctx.currentTime, 0.1, 'triangle', 0.2),
        powerup: () => sweep(440, 660, ctx.currentTime, 0.1, 'square', 0.2),
        achievement: () => {
            const t = ctx.currentTime;
            [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.06, 0.09, 'square', 0.22));
        },
        'game-over': () => {
            const t = ctx.currentTime;
            [392, 329, 261].forEach((f, i) => tone(f, t + i * 0.2, 0.2, 'square', 0.2));
        },
        button: () => tone(300, ctx.currentTime, 0.04, 'square', 0.1)
    };

    function play(type) {
        if (!ctx || muted) return;
        const fn = SOUNDS[type];
        if (fn) fn();
    }

    function speak(text) {
        if (muted || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel(); // don't let quotes stack/overlap
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        utter.pitch = 1;
        utter.volume = 0.8;
        window.speechSynthesis.speak(utter);
    }

    function updateMuteButtons() {
        document.querySelectorAll('.mute-btn').forEach(btn => {
            btn.textContent = muted ? '🔇' : '🔊';
        });
    }

    function toggleMute() {
        muted = !muted;
        localStorage.setItem('cheese_sound_muted', String(muted));
        if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
        if (muted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        updateMuteButtons();
        return muted;
    }

    function isMuted() {
        return muted;
    }

    return { init, play, speak, toggleMute, isMuted, updateMuteButtons };
})();

window.SoundEngine = SoundEngine;

document.addEventListener('DOMContentLoaded', () => {
    SoundEngine.updateMuteButtons();

    // Browsers require a user gesture before audio can start; arm on the first one.
    const unlock = () => {
        SoundEngine.init();
        document.removeEventListener('keydown', unlock);
        document.removeEventListener('click', unlock);
    };
    document.addEventListener('keydown', unlock);
    document.addEventListener('click', unlock);

    // Delegated click SFX for all buttons.
    document.addEventListener('click', (e) => {
        if (e.target.closest('button')) SoundEngine.play('button');
    }, true);
});
