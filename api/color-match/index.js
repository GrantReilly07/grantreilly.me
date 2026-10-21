// Keep the browser on this site's origin; the Java service doesn't enable CORS.
const COLOR_API = "https://met-color-api-cxehftbtf8dbg4gx.westus3-01.azurewebsites.net/api/closest-color";

module.exports = async function colorMatch(context, req) {
  const query = new URLSearchParams();
  for (const channel of ["red", "green", "blue"]) {
    const value = String(req.query?.[channel] ?? "").trim();
    if (!/^\d{1,3}$/.test(value) || Number(value) > 255) {
      context.res = jsonResponse(400, { error: `${channel} must be a whole number from 0 to 255.` });
      return;
    }
    query.set(channel, String(Number(value)));
  }
  try {
    const response = await fetch(`${COLOR_API}?${query}`, {
      headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) {
      context.res = jsonResponse(response.status === 429 || response.status === 503 ? 503 : 502,
        { error: "The color matching service is temporarily unavailable. Please try again." });
      return;
    }
    const result = await response.json();
    if (!result || !Number.isSafeInteger(result.objectID) || result.objectID <= 0 ||
        ![result.red, result.green, result.blue].every(value => Number.isInteger(value) && value >= 0 && value <= 255) ||
        !Number.isInteger(result.distanceSquared) || result.distanceSquared < 0 || result.distanceSquared > 195075) {
      throw new Error("Invalid color API response");
    }
    context.res = jsonResponse(200, {
      objectID: result.objectID, red: result.red, green: result.green, blue: result.blue,
      distanceSquared: result.distanceSquared,
      objectURL: `https://www.metmuseum.org/art/collection/search/${result.objectID}`
    });
  } catch (error) {
    context.log.error("Color service request failed:", error.message);
    context.res = jsonResponse(error.name === "TimeoutError" ? 504 : 502,
      { error: "The color matching service couldn't be reached. Please try again." });
  }
};

function jsonResponse(status, body) {
  return { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body };
}
