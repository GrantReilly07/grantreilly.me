const assert = require("node:assert/strict");
const { createDefaultFrame, validateFrame } = require("../shared/frameValidation");

function makeFrame() {
  const frame = createDefaultFrame();
  return {
    width: frame.width,
    height: frame.height,
    pixels: frame.pixels
  };
}

const validFrame = makeFrame();
validFrame.pixels[0][1] = "#ff0000";

const validResult = validateFrame(validFrame);
assert.equal(validResult.valid, true);
assert.equal(validResult.frame.pixels[0][1], "#FF0000");
assert.equal(validResult.frame.pixels.length, 32);
assert.equal(validResult.frame.pixels[0].length, 32);

assert.equal(validateFrame({ ...makeFrame(), width: 31 }).valid, false);
assert.equal(validateFrame({ ...makeFrame(), height: 31 }).valid, false);

const missingRow = makeFrame();
missingRow.pixels.pop();
assert.equal(validateFrame(missingRow).valid, false);

const shortRow = makeFrame();
shortRow.pixels[4] = shortRow.pixels[4].slice(0, 31);
assert.equal(validateFrame(shortRow).valid, false);

const badColor = makeFrame();
badColor.pixels[2][3] = "red";
assert.equal(validateFrame(badColor).valid, false);

console.log("Frame validation tests passed.");

