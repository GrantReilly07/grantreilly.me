import test from "node:test";
import assert from "node:assert/strict";
import { parseRgb, rgbToHsv, hsvToRgb, rgbHex, safeUrl, imageUrl, validateMatch } from "../projects/project-two/color-utils.mjs";

test("RGB parsing accepts endpoints and rejects incomplete or non-integer values", () => {
  assert.deepEqual(parseRgb(["0", " 255 ", "128"]), [0, 255, 128]);
  for (const value of ["", "-1", "256", "1.5", "1e2", "NaN"]) {
    assert.throws(() => parseRgb([value, "0", "0"]));
  }
  assert.throws(() => parseRgb([0, 1]));
});

test("wheel hue positions produce the six primary and secondary RGB colors", () => {
  const colors = [[255, 0, 0], [255, 255, 0], [0, 255, 0], [0, 255, 255], [0, 0, 255], [255, 0, 255]];
  colors.forEach((rgb, index) => assert.deepEqual(hsvToRgb({ h: index * 60, s: 1, v: 1 }), rgb));
  assert.deepEqual(hsvToRgb({ h: 180, s: 1, v: 0 }), [0, 0, 0]);
  assert.deepEqual(hsvToRgb({ h: 180, s: 0, v: 1 }), [255, 255, 255]);
});

test("manual RGB input round-trips through the wheel, including grayscale", () => {
  for (let red = 0; red <= 255; red += 17) {
    for (let green = 0; green <= 255; green += 17) {
      for (let blue = 0; blue <= 255; blue += 17) {
        const rgb = [red, green, blue];
        assert.deepEqual(hsvToRgb(rgbToHsv(rgb)), rgb);
      }
    }
  }
  assert.equal(rgbToHsv([0, 0, 0], 230).h, 230);
  assert.equal(rgbHex([104, 133, 111]), "#68856F");
});

test("catalog links and artwork images cannot use script URLs or foreign image hosts", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("data:text/html,test"), null);
  assert.equal(imageUrl("https://images.metmuseum.org/CRDImages/ep/original/test.jpg"), "https://images.metmuseum.org/CRDImages/ep/original/test.jpg");
  assert.equal(imageUrl("https://images.metmuseum.org.evil.example/test.jpg"), null);
  assert.equal(imageUrl(""), null);
});

test("validates color match response before rendering", () => {
  const match = { objectID: 437376, red: 17, green: 13, blue: 7, distanceSquared: 507 };
  assert.equal(validateMatch(match), match);
  for (const invalid of [null, {}, { ...match, red: "17" }, { ...match, distanceSquared: 195076 }]) {
    assert.throws(() => validateMatch(invalid));
  }
});
