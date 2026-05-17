# LED Matrix API

Azure Static Web Apps serves these Azure Functions under `/api`.

## Endpoints

- `POST /api/frame` validates and stores the latest 32x32 LED frame.
- `GET /api/latest` returns the latest stored frame. If no frame has been saved yet, it returns an all-black frame with `version: 0`.

## Storage

The API stores the latest frame as JSON in Azure Blob Storage.

Required app setting:

- `AZURE_STORAGE_CONNECTION_STRING`: Azure Storage account connection string.

Optional app settings:

- `LED_FRAME_CONTAINER`: Blob container name. Defaults to `led-frames`.
- `LED_FRAME_BLOB`: Blob name for the latest frame. Defaults to `latest-frame.json`.

For local development with Azurite, copy `api/local.settings.example.json` to
`api/local.settings.json`.

`api/local.settings.json` is ignored by Git so secrets do not get committed.

## Local Testing

Install API dependencies once:

```bash
cd api
npm install
npm test
```

Run the site and API together with the Azure Static Web Apps CLI:

```bash
swa start . --api-location api
```

Then test the API:

```bash
curl http://localhost:4280/api/latest
curl -X POST http://localhost:4280/api/frame \
  -H "Content-Type: application/json" \
  --data @frame.json
```
