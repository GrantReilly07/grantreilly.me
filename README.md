# grantreilly.me

A personal project website deployed with Azure Static Web Apps.

## Site structure

- `index.html` is the home page.
- `style.css` contains the shared design system and responsive layout.
- `projects/index.html` lists the projects.
- `projects/project-one/index.html` is the LED matrix editor page.
- `projects/project-two/` is Met Color: a continuous color wheel, manual RGB inputs,
  and an artwork matcher with images and full Met collection records.
- `projects/project-three/index.html` is a blank project page ready to edit.
- `api/` contains Azure Static Web Apps API routes for the LED matrix and Met Color projects.

## LED matrix API

Project 1 uses these API routes:

- `POST /api/frame` validates and saves the latest 32x32 LED frame.
- `GET /api/latest` returns the latest saved frame for a Raspberry Pi polling script.

The API stores the latest frame in Azure Blob Storage. 

For local API setup and test commands, see `api/README.md`.

## Met Color demo

The page requests `GET /api/color-match?red=104&green=133&blue=111` on this site's
origin. That route validates the RGB channels and calls the deployed Java
`closest-color` Azure Function. This avoids requiring CORS changes on the Java
service. No API key or additional application settings are needed.

After finding a match, the browser requests the Met Collection API for the object
record and displays `primaryImage`, falling back to `primaryImageSmall` if the
original image fails. If the Met request fails, the match and collection link
remain visible and the visitor can retry the details request. Complete metadata,
including nested records, is available under “Explore the full collection record.”

Run the API and color utility tests with `npm test --prefix api`. A plain static
server previews the layout; use the Azure Static Web Apps CLI with its API support
for local end-to-end development. The existing GitHub workflow deploys the static
site and API together on a push to `main`.
