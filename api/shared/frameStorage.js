const { BlobServiceClient } = require("@azure/storage-blob");
const { createDefaultFrame } = require("./frameValidation");

const DEFAULT_CONTAINER_NAME = "led-frames";
const DEFAULT_BLOB_NAME = "latest-frame.json";

function getStorageSettings() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not configured.");
  }

  return {
    connectionString,
    containerName: process.env.LED_FRAME_CONTAINER || DEFAULT_CONTAINER_NAME,
    blobName: process.env.LED_FRAME_BLOB || DEFAULT_BLOB_NAME
  };
}

async function getLatestFrameBlobClient() {
  const { connectionString, containerName, blobName } = getStorageSettings();
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists();

  return containerClient.getBlockBlobClient(blobName);
}

async function saveLatestFrame(frame) {
  const latestFrame = {
    ...frame,
    version: Date.now()
  };
  const body = JSON.stringify(latestFrame);
  const blobClient = await getLatestFrameBlobClient();

  await blobClient.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: {
      blobContentType: "application/json"
    }
  });

  return latestFrame;
}

async function getLatestFrame() {
  const blobClient = await getLatestFrameBlobClient();

  if (!(await blobClient.exists())) {
    return createDefaultFrame();
  }

  const downloadResponse = await blobClient.download(0);
  const body = await streamToString(downloadResponse.readableStreamBody);

  return JSON.parse(body);
}

function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });

    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });

    readableStream.on("error", reject);
  });
}

module.exports = {
  getLatestFrame,
  saveLatestFrame
};

