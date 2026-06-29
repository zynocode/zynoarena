/**
 * Procedural sound generators.
 * Each renders a high-quality AudioBuffer once (via OfflineAudioContext) at
 * preload time; the AudioManager caches the result for low-latency playback.
 *
 * No external assets — only the dice roll uses a recorded file (see registry).
 */

type ToneType = OscillatorType;

interface ToneOpts {
  type: ToneType;
  freq: number;
  freqEnd?: number;
  start: number;
  dur: number;
  gain: number;
  attack?: number;
}

interface NoiseOpts {
  start: number;
  dur: number;
  gain: number;
  filter?: BiquadFilterType;
  freq?: number;
  q?: number;
  /** Exponent for the decay envelope baked into the noise (higher = snappier). */
  decay?: number;
}

/** Render a buffer of `dur` seconds by running `build` on an offline graph. */
function render(
  sampleRate: number,
  dur: number,
  build: (ctx: OfflineAudioContext) => void,
): Promise<AudioBuffer> {
  const length = Math.max(1, Math.ceil(sampleRate * dur));
  const ctx = new OfflineAudioContext(2, length, sampleRate);
  build(ctx);
  return ctx.startRendering();
}

/** A pitched oscillator note with an exponential attack/decay envelope. */
function tone(ctx: OfflineAudioContext, o: ToneOpts) {
  const osc = ctx.createOscillator();
  osc.type = o.type;
  osc.frequency.setValueAtTime(o.freq, o.start);
  if (o.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), o.start + o.dur);
  }
  const g = ctx.createGain();
  const attack = o.attack ?? 0.006;
  g.gain.setValueAtTime(0.0001, o.start);
  g.gain.exponentialRampToValueAtTime(o.gain, o.start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, o.start + o.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(o.start);
  osc.stop(o.start + o.dur);
}

/** A filtered noise burst (percussive texture / shimmer). */
function noise(ctx: OfflineAudioContext, o: NoiseOpts) {
  const n = Math.max(1, Math.ceil(ctx.sampleRate * o.dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  const decay = o.decay ?? 2;
  for (let i = 0; i < n; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = o.filter ?? 'lowpass';
  f.frequency.value = o.freq ?? 3000;
  f.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  g.gain.value = o.gain;
  src.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  src.start(o.start);
  src.stop(o.start + o.dur);
}

// Musical note frequencies (equal temperament)
const N = {
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  C6: 1046.5, E6: 1318.5, G6: 1568.0, C7: 2093.0,
};

/** Soft wooden tick — one token step on the board (~70ms, not metallic). */
export function renderTokenStep(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.08, (ctx) => {
    // Woody body
    tone(ctx, { type: 'sine', freq: 230, freqEnd: 150, start: 0, dur: 0.07, gain: 0.5, attack: 0.002 });
    tone(ctx, { type: 'triangle', freq: 460, freqEnd: 300, start: 0, dur: 0.05, gain: 0.18, attack: 0.002 });
    // Short soft transient (no metallic ring)
    noise(ctx, { start: 0, dur: 0.03, gain: 0.12, filter: 'lowpass', freq: 2200, q: 0.7, decay: 3 });
  });
}

/** Punchy rewarding impact + sparkle — token kill (~450ms). */
export function renderTokenKill(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.5, (ctx) => {
    // Impact thud
    tone(ctx, { type: 'sine', freq: 220, freqEnd: 70, start: 0, dur: 0.22, gain: 0.7, attack: 0.002 });
    // Body crack
    noise(ctx, { start: 0, dur: 0.12, gain: 0.4, filter: 'lowpass', freq: 1800, q: 1, decay: 2.5 });
    // Upward sparkle chime (reward)
    tone(ctx, { type: 'triangle', freq: N.C6, start: 0.07, dur: 0.18, gain: 0.22 });
    tone(ctx, { type: 'triangle', freq: N.E6, start: 0.13, dur: 0.18, gain: 0.2 });
    tone(ctx, { type: 'triangle', freq: N.G6, start: 0.19, dur: 0.22, gain: 0.18 });
    // High shimmer tail
    noise(ctx, { start: 0.1, dur: 0.3, gain: 0.06, filter: 'highpass', freq: 6000, q: 0.5, decay: 1.5 });
  });
}

/** Magical success jingle — a token reaches home (~700ms). */
export function renderTokenHome(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.72, (ctx) => {
    const seq = [N.C5, N.E5, N.G5, N.C6];
    seq.forEach((f, i) => {
      const t = i * 0.1;
      tone(ctx, { type: 'triangle', freq: f, start: t, dur: 0.45, gain: 0.28 });
      tone(ctx, { type: 'sine', freq: f * 2, start: t, dur: 0.3, gain: 0.08 });
    });
    // Sparkle shimmer over the top
    noise(ctx, { start: 0.25, dur: 0.4, gain: 0.05, filter: 'highpass', freq: 7000, q: 0.5, decay: 1.2 });
  });
}

/** Soft calm shimmer — token lands on a safe/star cell (~280ms). */
export function renderSafeCell(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.3, (ctx) => {
    tone(ctx, { type: 'sine', freq: N.G6, start: 0, dur: 0.26, gain: 0.16, attack: 0.02 });
    tone(ctx, { type: 'sine', freq: N.C7, start: 0.05, dur: 0.22, gain: 0.1, attack: 0.02 });
    noise(ctx, { start: 0, dur: 0.25, gain: 0.04, filter: 'highpass', freq: 8000, q: 0.4, decay: 1 });
  });
}

/** Premium victory — a player wins the match (~2.5s). */
export function renderGameWin(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 2.6, (ctx) => {
    // Warm chord swell pad (C major), detuned saws through a soft lowpass
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700, 0);
    lp.frequency.linearRampToValueAtTime(2600, 1.2);
    const pad = ctx.createGain();
    pad.gain.setValueAtTime(0.0001, 0);
    pad.gain.exponentialRampToValueAtTime(0.16, 0.4);
    pad.gain.setValueAtTime(0.16, 1.8);
    pad.gain.exponentialRampToValueAtTime(0.0001, 2.55);
    lp.connect(pad);
    pad.connect(ctx.destination);
    [261.63, 329.63, 392.0].forEach((f) => {
      [0, 4].forEach((detune) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = detune;
        o.connect(lp);
        o.start(0);
        o.stop(2.55);
      });
    });
    // Triumphant ascending arpeggio
    const arp = [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6];
    arp.forEach((f, i) => {
      const t = 0.35 + i * 0.13;
      tone(ctx, { type: 'triangle', freq: f, start: t, dur: 0.5, gain: 0.26 });
    });
    // Final shimmer sparkle tail
    for (let i = 0; i < 8; i++) {
      const t = 1.2 + i * 0.12;
      const f = 1500 + ((i * 911) % 2600);
      tone(ctx, { type: 'sine', freq: f, start: t, dur: 0.25, gain: 0.07 });
    }
  });
}

/** Soft UI tap — button click (~45ms). */
export function renderButtonClick(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.06, (ctx) => {
    tone(ctx, { type: 'sine', freq: 520, freqEnd: 380, start: 0, dur: 0.05, gain: 0.3, attack: 0.001 });
    noise(ctx, { start: 0, dur: 0.02, gain: 0.05, filter: 'lowpass', freq: 3000, q: 0.7, decay: 3 });
  });
}

/** Soft rising pop — popup opens (~170ms). */
export function renderPopupOpen(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.2, (ctx) => {
    tone(ctx, { type: 'sine', freq: 380, freqEnd: 820, start: 0, dur: 0.16, gain: 0.26, attack: 0.004 });
    tone(ctx, { type: 'triangle', freq: 760, freqEnd: 1640, start: 0, dur: 0.12, gain: 0.07, attack: 0.004 });
  });
}

/** Soft falling pop — popup closes (~170ms). */
export function renderPopupClose(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.2, (ctx) => {
    tone(ctx, { type: 'sine', freq: 760, freqEnd: 340, start: 0, dur: 0.16, gain: 0.24, attack: 0.004 });
    tone(ctx, { type: 'triangle', freq: 1520, freqEnd: 680, start: 0, dur: 0.1, gain: 0.06, attack: 0.004 });
  });
}

/** Soft wooden chess move click (~80ms). */
export function renderChessMove(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.1, (ctx) => {
    tone(ctx, { type: 'sine', freq: 160, freqEnd: 90, start: 0, dur: 0.08, gain: 0.4, attack: 0.002 });
    noise(ctx, { start: 0, dur: 0.02, gain: 0.08, filter: 'lowpass', freq: 1800, q: 0.8, decay: 4 });
  });
}

/** Snappy chess capture wood impact (~150ms). */
export function renderChessCapture(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.18, (ctx) => {
    tone(ctx, { type: 'sine', freq: 180, freqEnd: 70, start: 0, dur: 0.15, gain: 0.55, attack: 0.001 });
    tone(ctx, { type: 'triangle', freq: 360, freqEnd: 120, start: 0, dur: 0.1, gain: 0.25, attack: 0.001 });
    noise(ctx, { start: 0, dur: 0.08, gain: 0.2, filter: 'bandpass', freq: 1000, q: 1, decay: 3 });
  });
}

/** Sliding dual-wood castle sound (~250ms). */
export function renderChessCastle(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.25, (ctx) => {
    // King slide
    tone(ctx, { type: 'sine', freq: 150, freqEnd: 100, start: 0, dur: 0.12, gain: 0.4, attack: 0.005 });
    noise(ctx, { start: 0, dur: 0.08, gain: 0.06, filter: 'lowpass', freq: 1200, decay: 2 });
    // Rook slide slightly delayed
    tone(ctx, { type: 'sine', freq: 130, freqEnd: 90, start: 0.06, dur: 0.12, gain: 0.35, attack: 0.005 });
    noise(ctx, { start: 0.06, dur: 0.08, gain: 0.06, filter: 'lowpass', freq: 1000, decay: 2 });
  });
}

/** Chime warning chord for check state (~400ms). */
export function renderChessCheck(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.45, (ctx) => {
    tone(ctx, { type: 'sine', freq: 1046.5, start: 0, dur: 0.4, gain: 0.2, attack: 0.01 });
    tone(ctx, { type: 'sine', freq: 1318.51, start: 0, dur: 0.4, gain: 0.15, attack: 0.01 });
    tone(ctx, { type: 'triangle', freq: 523.25, start: 0, dur: 0.4, gain: 0.08, attack: 0.01 });
  });
}

/** Low thud + minor chord checkmate orchestra hit (~1.5s). */
export function renderChessCheckmate(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 1.5, (ctx) => {
    tone(ctx, { type: 'sine', freq: 110, freqEnd: 55, start: 0, dur: 0.6, gain: 0.6, attack: 0.002 });
    noise(ctx, { start: 0, dur: 0.3, gain: 0.25, filter: 'lowpass', freq: 500, decay: 2 });
    [220, 261.63, 329.63].forEach((f) => {
      tone(ctx, { type: 'sawtooth', freq: f, start: 0.1, dur: 1.2, gain: 0.1, attack: 0.05 });
    });
  });
}

/** Soft double tone neutral chime for draw state (~500ms). */
export function renderChessDraw(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.5, (ctx) => {
    tone(ctx, { type: 'sine', freq: 880, start: 0, dur: 0.45, gain: 0.18, attack: 0.01 });
    tone(ctx, { type: 'sine', freq: 739.99, start: 0.08, dur: 0.38, gain: 0.14, attack: 0.01 });
  });
}

/** Magical ascending scale pop for pawn promotion (~600ms). */
export function renderChessPromotion(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.6, (ctx) => {
    const scale = [N.C5, N.E5, N.G5, N.C6, N.E6];
    scale.forEach((f, i) => {
      const t = i * 0.06;
      tone(ctx, { type: 'triangle', freq: f, start: t, dur: 0.25, gain: 0.16 });
    });
    noise(ctx, { start: 0.15, dur: 0.4, gain: 0.05, filter: 'highpass', freq: 8000, decay: 1.5 });
  });
}

/** Short muted thud for invalid chess operations (~60ms). */
export function renderChessIllegal(sampleRate: number): Promise<AudioBuffer> {
  return render(sampleRate, 0.06, (ctx) => {
    tone(ctx, { type: 'sine', freq: 90, freqEnd: 60, start: 0, dur: 0.05, gain: 0.3, attack: 0.001 });
  });
}

