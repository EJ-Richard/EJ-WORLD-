export function createAudio() {
  let ctx = null;
  let muted = false;
  try {
    muted = localStorage.getItem("spin-x-mute") === "1";
  } catch {
    muted = false;
  }

  function ac() {
    if (muted) return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, peak, delay = 0) {
    const audio = ac();
    if (!audio) return;
    const t = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, peak, freq) {
    const audio = ac();
    if (!audio) return;
    const t = audio.currentTime;
    const length = Math.floor(audio.sampleRate * dur);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = audio.createBufferSource();
    src.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.7;
    const gain = audio.createGain();
    gain.gain.value = peak;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    src.start(t);
  }

  return {
    get muted() {
      return muted;
    },
    toggle() {
      muted = !muted;
      try {
        localStorage.setItem("spin-x-mute", muted ? "1" : "0");
      } catch {
        /* private mode */
      }
      if (ctx) {
        if (muted && ctx.state === "running") ctx.suspend();
        if (!muted && ctx.state === "suspended") ctx.resume();
      }
      return muted;
    },
    unlock() {
      ac();
    },
    blip(freq = 520) {
      tone(freq, 0.12, "square", 0.045);
    },
    launch() {
      tone(220, 0.18, "sawtooth", 0.04);
      tone(520, 0.22, "square", 0.03, 0.05);
      noise(0.18, 0.05, 900);
    },
    hit(level) {
      const peak = Math.min(0.08, 0.02 + level * 0.01);
      noise(0.09, peak, 380 + Math.min(3, level) * 180);
      tone(140 + level * 30, 0.08, "square", peak * 0.45);
    },
    finish(kind) {
      const base = kind === "xtreme" ? 523 : kind === "burst" ? 392 : kind === "over" ? 440 : 349;
      tone(base, 0.16, "square", 0.05);
      tone(base * 1.25, 0.18, "square", 0.045, 0.1);
      tone(base * 1.5, 0.28, "square", 0.05, 0.2);
      if (kind === "xtreme" || kind === "burst") noise(0.2, 0.04, 1400);
    },
  };
}
