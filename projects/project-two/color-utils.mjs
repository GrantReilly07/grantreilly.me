export function parseRgb(values) {
  const rgb = values.map(value => String(value).trim());
  if (rgb.length !== 3 || rgb.some(value => !/^\d{1,3}$/.test(value) || Number(value) > 255)) {
    throw new Error("Enter a whole number from 0 to 255 for red, green, and blue.");
  }
  return rgb.map(Number);
}

export function rgbToHsv([red, green, blue], previousHue = 0) {
  const [r, g, b] = [red, green, blue].map(channel => channel / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let hue = previousHue;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { h: hue, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToRgb({ h, s, v }) {
  const hue = ((h % 360) + 360) % 360 / 60;
  const c = v * s, x = c * (1 - Math.abs(hue % 2 - 1)), m = v - c;
  const channels = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(hue)];
  return channels.map(channel => Math.round((channel + m) * 255));
}

export const rgbCss = rgb => `rgb(${rgb.join(", ")})`;
export const rgbHex = rgb => "#" + rgb.map(channel => channel.toString(16).padStart(2, "0")).join("").toUpperCase();

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function imageUrl(value) {
  const url = safeUrl(value);
  return url && new URL(url).protocol === "https:" && new URL(url).hostname === "images.metmuseum.org" ? url : null;
}

export function validateMatch(match) {
  if (!match || !Number.isSafeInteger(match.objectID) || match.objectID <= 0 ||
      ![match.red, match.green, match.blue].every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255) ||
      !Number.isInteger(match.distanceSquared) || match.distanceSquared < 0 || match.distanceSquared > 195075) {
    throw new Error("The color service returned an incomplete result. Please try again.");
  }
  return match;
}
