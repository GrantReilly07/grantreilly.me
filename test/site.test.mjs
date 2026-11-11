import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const root = new URL("../", import.meta.url);
const routes = ["index.html", "projects/index.html", "projects/project-one/index.html", "projects/project-two/index.html", "projects/project-three/index.html"];
const read = path => readFileSync(new URL(path, root), "utf8");

test("every page has unique IDs, one active navigation item, and resolving local links/assets", () => {
  for (const route of routes) {
    const html = read(route);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${route}`);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1, route);
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = new URL(value, new URL(route, root));
      if (target.protocol !== "file:") continue;
      const fragment = target.hash;
      target.hash = "";
      if (statSync(target).isDirectory()) target.pathname += "index.html";
      assert.ok(statSync(target).isFile(), `${route}: ${value}`);
      if (fragment) assert.ok(readFileSync(target, "utf8").includes(`id="${fragment.slice(1)}"`), `${route}: ${value}`);
    }
  }
});

test("app controls, accessible feedback, and the 32 × 32 matrix stay connected", () => {
  const led = read("projects/project-one/index.html");
  for (const id of ["led-grid", "draw-color", "draw-tool", "erase-tool", "clear-frame", "export-frame", "frame-output", "frame-status"]) {
    assert.ok(led.includes(`id="${id}"`), id);
  }
  assert.match(led, /MATRIX_WIDTH = 32/);
  assert.match(led, /MATRIX_HEIGHT = 32/);
  assert.match(led, /aria-live="polite"/);
  const met = read("projects/project-two/index.html");
  const script = read("projects/project-two/met-color.js");
  for (const [, id] of script.matchAll(/\$\("([^"]+)"\)/g)) {
    assert.ok(met.includes(`id="${id}"`), `Missing Met Color hook: ${id}`);
  }
  for (const [, list] of met.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)) {
    for (const id of list.split(" ")) assert.ok(met.includes(`id="${id}"`), id);
  }
});

test("shared text and control edges meet AA contrast on the material surfaces", () => {
  const css = read("style.css");
  const token = name => css.match(new RegExp(`--${name}: (#[0-9a-f]{6});`, "i"))[1];
  const luminance = hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
  for (const surface of ["bg", "surface", "surface-strong", "recessed"].map(token).concat(["#2c2f35", "#25282e"])) {
    for (const text of ["ink", "secondary", "muted", "green", "coral"].map(token)) assert.ok(contrast(text, surface) >= 4.5, `${text} on ${surface}`);
    assert.ok(contrast(token("control-border"), surface) >= 3, `Control edge on ${surface}`);
  }
});
