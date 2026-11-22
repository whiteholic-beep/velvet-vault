// audio.js — tiny synthesised sound effects (WebAudio, no audio files):
// a chime for loot, a low buzz for the alarm, a sting for being caught,
// a little arpeggio for the getaway, a tick for a tossed coin.

let ac = null;

function ctx() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(freq, dur = 0.08, type = 'sine', gain = 0.05, when = 0) {
  try {
    const a = ctx();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, a.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + when + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + when);
    o.stop(a.currentTime + when + dur + 0.02);
  } catch (e) { /* audio is a garnish; a silent game still plays */ }
}

export const sfx = {
  pickup() { tone(880, 0.09, 'sine', 0.06); tone(1318, 0.12, 'sine', 0.05, 0.07); },
  alert() { tone(220, 0.15, 'square', 0.04); tone(220, 0.15, 'square', 0.04, 0.18); },
  caught() { tone(160, 0.3, 'sawtooth', 0.06); tone(110, 0.4, 'sawtooth', 0.06, 0.2); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'sine', 0.05, i * 0.09)); },
  coin() { tone(1567, 0.06, 'sine', 0.04); },
  click() { tone(660, 0.05, 'sine', 0.04); },
};
