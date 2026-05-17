const { saveLatestFrame } = require("../shared/frameStorage");
const { validateFrame } = require("../shared/frameValidation");

module.exports = async function saveFrame(context, req) {
  try {
    const body = parseJsonBody(req);
    const result = validateFrame(body);

    if (!result.valid) {
      context.res = jsonResponse(400, { error: result.error });
      return;
    }

    const frame = await saveLatestFrame(result.frame);

    context.res = jsonResponse(200, {
      message: "Frame saved.",
      frame
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      context.res = jsonResponse(400, {
        error: "Request body must be valid JSON."
      });
      return;
    }

    context.log.error(error);
    context.res = jsonResponse(500, {
      error: "Unable to save frame. Check API storage configuration."
    });
  }
};

function parseJsonBody(req) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  return req.body;
}

function jsonResponse(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json"
    },
    body
  };
}

