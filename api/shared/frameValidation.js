const MATRIX_WIDTH = 32;
const MATRIX_HEIGHT = 32;
const OFF_COLOR = "#000000";
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function invalid(error) {
  return { valid: false, error };
}

function createDefaultPixels() {
  return Array.from({ length: MATRIX_HEIGHT }, () =>
    Array.from({ length: MATRIX_WIDTH }, () => OFF_COLOR)
  );
}

function createDefaultFrame() {
  return {
    width: MATRIX_WIDTH,
    height: MATRIX_HEIGHT,
    version: 0,
    pixels: createDefaultPixels()
  };
}

function validateFrame(frame) {
  if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
    return invalid("Frame payload must be a JSON object.");
  }

  if (frame.width !== MATRIX_WIDTH) {
    return invalid("Frame width must be 32.");
  }

  if (frame.height !== MATRIX_HEIGHT) {
    return invalid("Frame height must be 32.");
  }

  if (!Array.isArray(frame.pixels) || frame.pixels.length !== MATRIX_HEIGHT) {
    return invalid("Frame pixels must contain exactly 32 rows.");
  }

  const pixels = [];

  for (let rowIndex = 0; rowIndex < MATRIX_HEIGHT; rowIndex += 1) {
    const row = frame.pixels[rowIndex];

    if (!Array.isArray(row) || row.length !== MATRIX_WIDTH) {
      return invalid(`Frame row ${rowIndex + 1} must contain exactly 32 colors.`);
    }

    const normalizedRow = [];

    for (let colIndex = 0; colIndex < MATRIX_WIDTH; colIndex += 1) {
      const color = row[colIndex];

      if (typeof color !== "string" || !HEX_COLOR_PATTERN.test(color)) {
        return invalid(
          `Frame pixel ${rowIndex + 1}, ${colIndex + 1} must be a 6-digit hex color like "#000000".`
        );
      }

      normalizedRow.push(color.toUpperCase());
    }

    pixels.push(normalizedRow);
  }

  return {
    valid: true,
    frame: {
      width: MATRIX_WIDTH,
      height: MATRIX_HEIGHT,
      pixels
    }
  };
}

module.exports = {
  MATRIX_WIDTH,
  MATRIX_HEIGHT,
  OFF_COLOR,
  createDefaultFrame,
  validateFrame
};

