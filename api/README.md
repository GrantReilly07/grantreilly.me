# Website API

Azure Static Web Apps serves these Azure Functions under `/api`.
The site's `staticwebapp.config.json` selects the Node.js 22 runtime.

## Endpoints

- `POST /api/frame` validates and stores the latest 32x32 LED frame.
- `GET /api/latest` returns the latest stored frame. If no frame has been saved yet, it returns an all-black frame with `version: 0`.
- `GET /api/color-match?red=104&green=133&blue=111` calls the Met Color Java service
  through this site's origin. Each RGB channel must be an integer from 0 to 255.
  The upstream URL is fixed, requests time out after 30 seconds, and no credentials
  or extra settings are needed. Invalid input returns 400; upstream failures return
  502/503 and timeouts return 504. The browser separately loads the Met object record.

## Storage

The API stores the latest frame as JSON in Azure Blob Storage.

## Tests

Run `npm test --prefix api` from the repository root. Tests cover existing frame
validation, the color service route (without network requests), and RGB/HSV conversion.
