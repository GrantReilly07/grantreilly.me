# LED Matrix API

Azure Static Web Apps serves these Azure Functions under `/api`.

## Endpoints

- `POST /api/frame` validates and stores the latest 32x32 LED frame.
- `GET /api/latest` returns the latest stored frame. If no frame has been saved yet, it returns an all-black frame with `version: 0`.

## Storage

The API stores the latest frame as JSON in Azure Blob Storage.
