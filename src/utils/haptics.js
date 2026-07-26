export const hapticLight = () => {
  try {
    if (navigator && navigator.vibrate) navigator.vibrate(30);
  } catch (e) {
    // Ignore errors on devices that don't support vibration
  }
};

export const hapticMedium = () => {
  try {
    if (navigator && navigator.vibrate) navigator.vibrate(50);
  } catch (e) {
    // Ignore
  }
};

export const hapticHeavy = () => {
  try {
    if (navigator && navigator.vibrate) navigator.vibrate(80);
  } catch (e) {
    // Ignore
  }
};

export const hapticSuccess = () => {
  try {
    if (navigator && navigator.vibrate) navigator.vibrate([30, 50, 40]);
  } catch (e) {
    // Ignore
  }
};

export const hapticError = () => {
  try {
    if (navigator && navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 80]);
  } catch (e) {
    // Ignore
  }
};
