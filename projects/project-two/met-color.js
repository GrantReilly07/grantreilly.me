import { parseRgb, rgbToHsv, hsvToRgb, rgbCss, rgbHex, safeUrl, imageUrl, validateMatch } from "./color-utils.mjs";

const $ = id => document.getElementById(id);
const inputs = [$("red"), $("green"), $("blue")];
const wheel = $("color-wheel");
const metadataCache = new Map();
let rgb = parseRgb(inputs.map(input => input.value));
let hsv = rgbToHsv(rgb);
let busy = false;
let currentMatch;

function updatePicker(updateInputs = true) {
  if (updateInputs) inputs.forEach((input, index) => { input.value = rgb[index]; });
  $("selected-swatch").style.backgroundColor = rgbCss(rgb);
  $("selected-hex").textContent = rgbHex(rgb);
  $("selected-rgb").textContent = `RGB (${rgb.join(", ")})`;
  $("brightness").value = hsv.v * 100;
  $("brightness-value").textContent = `${Math.round(hsv.v * 100)}%`;
  $("brightness").style.setProperty("--bright-color", rgbCss(hsvToRgb({ ...hsv, v: 1 })));
  $("wheel-shade").style.opacity = 1 - hsv.v;
  const radians = hsv.h * Math.PI / 180;
  $("wheel-marker").style.left = `${50 + Math.cos(radians) * hsv.s * 50}%`;
  $("wheel-marker").style.top = `${50 + Math.sin(radians) * hsv.s * 50}%`;
  wheel.setAttribute("aria-valuenow", Math.round(hsv.h) % 360);
  wheel.setAttribute("aria-valuetext", `Hue ${Math.round(hsv.h) % 360} degrees, saturation ${Math.round(hsv.s * 100)} percent. ${rgbCss(rgb)}`);
}

function updateFromWheel(event) {
  const rect = wheel.getBoundingClientRect();
  const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
  const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
  hsv.h = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  hsv.s = Math.min(1, Math.hypot(x, y));
  rgb = hsvToRgb(hsv);
  updatePicker();
}

wheel.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  event.preventDefault();
  wheel.focus({ preventScroll: true });
  wheel.setPointerCapture(event.pointerId);
  updateFromWheel(event);
});
wheel.addEventListener("pointermove", event => {
  if (wheel.hasPointerCapture(event.pointerId)) updateFromWheel(event);
});
wheel.addEventListener("pointerup", event => {
  if (wheel.hasPointerCapture(event.pointerId)) wheel.releasePointerCapture(event.pointerId);
});
wheel.addEventListener("keydown", event => {
  const step = event.shiftKey ? 10 : 2;
  if (event.key === "ArrowRight") hsv.h = (hsv.h + step) % 360;
  else if (event.key === "ArrowLeft") hsv.h = (hsv.h - step + 360) % 360;
  else if (event.key === "ArrowUp") hsv.s = Math.min(1, hsv.s + step / 100);
  else if (event.key === "ArrowDown") hsv.s = Math.max(0, hsv.s - step / 100);
  else return;
  event.preventDefault();
  rgb = hsvToRgb(hsv);
  updatePicker();
});
$("brightness").addEventListener("input", event => {
  hsv.v = Number(event.target.value) / 100;
  rgb = hsvToRgb(hsv);
  updatePicker();
});
inputs.forEach(input => input.addEventListener("input", () => {
  try {
    rgb = parseRgb(inputs.map(field => field.value));
    hsv = rgbToHsv(rgb, hsv.h);
    updatePicker(false);
  } catch { /* Keep incomplete input editable; native form validation runs on submit. */ }
}));

function setStatus(message, isError = false) {
  $("search-status").textContent = message;
  $("search-status").classList.toggle("is-error", isError);
}
function setBusy(value) {
  busy = value;
  $("find-match").disabled = value;
  $("retry-details").disabled = value;
  $("find-match").textContent = value ? "Finding your artwork…" : "Find matching artwork →";
  $("result-panel").setAttribute("aria-busy", String(value));
}
async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(response.status === 429
      ? "Too many requests. Wait a moment before trying again."
      : "The service is temporarily unavailable.");
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The request took too long.");
    if (error instanceof TypeError) throw new Error("Check your connection and try again.");
    throw error;
  } finally { clearTimeout(timeout); }
}

function colorComparison(label, color) {
  const row = document.createElement("div");
  row.className = "match-color";
  const chip = document.createElement("span");
  chip.className = "color-chip";
  chip.style.backgroundColor = rgbCss(color);
  chip.setAttribute("aria-hidden", "true");
  const text = document.createElement("div");
  const name = document.createElement("span");
  name.textContent = label;
  const value = document.createElement("strong");
  value.textContent = color.join(", ");
  text.append(name, value);
  row.append(chip, text);
  return row;
}

function showMatch(match, requestedRgb) {
  $("empty-result").hidden = true;
  $("match-result").hidden = false;
  $("result-heading").textContent = `Artwork #${match.objectID}`;
  $("artwork-byline").textContent = "Loading the collection record…";
  $("object-link").href = `https://www.metmuseum.org/art/collection/search/${match.objectID}`;
  $("match-colors").replaceChildren(colorComparison("Your color · RGB", requestedRgb), colorComparison("Artwork average · RGB", [match.red, match.green, match.blue]));
  $("match-distance").textContent = `Squared RGB distance: ${match.distanceSquared.toLocaleString()} · Lower is closer; 0 is an exact average-color match.`;
  $("artwork-figure").hidden = true;
  $("artwork-image").onload = null;
  $("artwork-image").onerror = null;
  $("artwork-image").removeAttribute("src");
  $("artwork-overview").hidden = true;
  $("catalog-details").hidden = true;
  $("catalog-details").open = false;
  $("retry-details").hidden = true;
  $("artwork-status").textContent = "Loading artwork details from the Met…";
}

function renderValue(value) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
    const empty = document.createElement("span");
    empty.className = "catalog-empty";
    empty.textContent = "Not provided";
    return empty;
  }
  if (Array.isArray(value)) {
    const list = document.createElement("ol");
    value.forEach(item => { const li = document.createElement("li"); li.append(renderValue(item)); list.append(li); });
    return list;
  }
  if (typeof value === "object") {
    const list = document.createElement("dl");
    Object.entries(value).forEach(([name, field]) => list.append(recordField(name, field)));
    return list;
  }
  const url = typeof value === "string" && safeUrl(value);
  if (url) {
    const link = document.createElement("a");
    link.href = url;
    link.textContent = value;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }
  const text = document.createElement("span");
  text.textContent = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return text;
}
function recordField(label, value) {
  const row = document.createElement("div");
  row.className = "catalog-field";
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.append(renderValue(value));
  row.append(term, description);
  return row;
}

function showArtwork(artwork, match) {
  $("result-heading").textContent = artwork.title || `Artwork #${match.objectID}`;
  $("artwork-byline").textContent = [artwork.artistDisplayName || "Artist not recorded", artwork.objectDate].filter(Boolean).join(" · ");
  const heading = document.createElement("h3");
  heading.textContent = "About this artwork";
  const overview = document.createElement("dl");
  overview.className = "overview-fields";
  const fields = [
    ["Object ID", artwork.objectID], ["Date", artwork.objectDate], ["Medium", artwork.medium],
    ["Dimensions", artwork.dimensions], ["Department", artwork.department], ["Classification", artwork.classification],
    ["Culture", artwork.culture], ["Artist", artwork.artistDisplayBio], ["Accession number", artwork.accessionNumber],
    ["Public domain", artwork.isPublicDomain], ["Credit", artwork.creditLine], ["Rights & reproduction", artwork.rightsAndReproduction]
  ];
  fields.filter(([, value]) => value !== "" && value !== null && value !== undefined).forEach(([label, value]) => {
    const row = recordField(label, value);
    row.className = label === "Credit" || label === "Rights & reproduction" ? "wide-field" : "";
    overview.append(row);
  });
  $("artwork-overview").replaceChildren(heading, overview);
  $("artwork-overview").hidden = false;
  $("catalog-fields").replaceChildren(...Object.entries(artwork).map(([key, value]) => recordField(key, value)));
  $("catalog-details").hidden = false;
  $("artwork-status").textContent = "";

  const original = imageUrl(artwork.primaryImage);
  const small = imageUrl(artwork.primaryImageSmall);
  const source = original || small;
  if (!source) {
    $("artwork-status").textContent = "The Met doesn't currently provide an image for this artwork. You can still explore its collection record below.";
    return;
  }
  const image = $("artwork-image");
  image.alt = [artwork.title, artwork.artistDisplayName, artwork.objectDate].filter(Boolean).join(" — ") || `Artwork #${match.objectID}`;
  $("artwork-status").textContent = "Loading artwork image…";
  $("full-image-link").href = source;
  image.onload = () => {
    $("artwork-figure").hidden = false;
    $("artwork-status").textContent = "";
  };
  image.onerror = () => {
    if (small && image.src !== small) {
      $("full-image-link").href = small;
      image.src = small;
    } else {
      $("artwork-figure").hidden = true;
      $("artwork-status").textContent = "The artwork image couldn't be loaded. Its details are available below, and you can view it on the Met's website.";
    }
  };
  $("image-caption").textContent = `The Metropolitan Museum of Art${artwork.isPublicDomain ? " · Public domain" : ""} · Click image to open full size`;
  image.src = source;
}

async function loadArtwork(match) {
  $("retry-details").hidden = true;
  try {
    let artwork = metadataCache.get(match.objectID);
    if (!artwork) {
      artwork = await fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${match.objectID}`, 25000);
      if (artwork.objectID !== match.objectID) throw new Error("The Met returned an unexpected collection record.");
      metadataCache.set(match.objectID, artwork);
    }
    showArtwork(artwork, match);
    setStatus("Match found. Explore your artwork and its collection details.");
  } catch (error) {
    $("artwork-byline").textContent = "Collection details unavailable";
    $("artwork-status").textContent = `Your color match is saved here, but the Met's details couldn't be loaded. ${error.message} Try again or use the link above to view it at the Met.`;
    $("retry-details").hidden = false;
    setStatus("Color match found; collection details could not be loaded.");
  }
}

$("color-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (busy) return;
  let requestedRgb;
  try { requestedRgb = parseRgb(inputs.map(input => input.value)); }
  catch (error) { setStatus(error.message, true); return; }
  setBusy(true);
  setStatus("Finding the closest average color in the collection…");
  try {
    const query = new URLSearchParams(Object.fromEntries(["red", "green", "blue"].map((name, index) => [name, requestedRgb[index]])));
    const match = validateMatch(await fetchJson(`/api/color-match?${query}`, 40000));
    currentMatch = match;
    showMatch(match, requestedRgb);
    setStatus("Color match found. Loading the artwork…");
    await loadArtwork(match);
  } catch (error) {
    setStatus(`We couldn't find a match right now. ${error.message} Please try again.`, true);
  } finally { setBusy(false); }
});
$("retry-details").addEventListener("click", async () => {
  if (busy || !currentMatch) return;
  setBusy(true);
  $("artwork-status").textContent = "Loading artwork details from the Met…";
  try { await loadArtwork(currentMatch); }
  finally { setBusy(false); }
});

updatePicker();
$("picker-controls").disabled = false;
