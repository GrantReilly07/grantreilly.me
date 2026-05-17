const { getLatestFrame } = require("../shared/frameStorage");

module.exports = async function latestFrame(context) {
  try {
    const frame = await getLatestFrame();

    context.res = jsonResponse(200, frame);
  } catch (error) {
    context.log.error(error);
    context.res = jsonResponse(500, {
      error: "Unable to load latest frame. Check API storage configuration."
    });
  }
};

function jsonResponse(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json"
    },
    body
  };
}

