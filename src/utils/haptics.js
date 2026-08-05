const getHapticConfig = () => {
  try {
    const saved = localStorage.getItem('pyphone_editor_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      const enabled = parsed.hapticsEnabled !== false; // default true
      const strength = typeof parsed.hapticsStrength === 'number' ? parsed.hapticsStrength : 100;
      return { enabled, multiplier: strength / 100 };
    }
  } catch {
    // ignore
  }
  return { enabled: true, multiplier: 1.0 };
};

let lastHapticTime = 0;

const vibrate = (pattern) => {
  try {
    const now = Date.now();
    if (now - lastHapticTime < 50) return;
    lastHapticTime = now;

    if (!navigator || !navigator.vibrate) return;
    const { enabled, multiplier } = getHapticConfig();
    if (!enabled) return;

    if (Array.isArray(pattern)) {
      navigator.vibrate(pattern.map(p => Math.max(1, Math.round(p * multiplier))));
    } else {
      navigator.vibrate(Math.max(1, Math.round(pattern * multiplier)));
    }
  } catch {
    // Ignore
  }
};

export const hapticLight = () => vibrate(30);
export const hapticMedium = () => vibrate(50);
export const hapticHeavy = () => vibrate(80);
export const hapticSuccess = () => vibrate([30, 50, 40]);
export const hapticError = () => vibrate([50, 50, 50, 50, 80]);
export const hapticSelection = () => vibrate([15, 30, 15]);
