# grantreilly.me

A personal project website deployed with Azure Static Web Apps.

## Site structure

- `index.html` is the home page.
- `style.css` contains the shared design system and responsive layout.
- `projects/index.html` lists project placeholders.
- `projects/project-one/index.html` is the LED matrix editor page.
- `projects/project-two/index.html` and `projects/project-three/index.html` are blank project pages ready to edit.
- `api/` contains Azure Static Web Apps API routes for the Project 1 LED matrix backend.

## LED matrix API

Project 1 uses these API routes:

- `POST /api/frame` validates and saves the latest 32x32 LED frame.
- `GET /api/latest` returns the latest saved frame for a Raspberry Pi polling script.

The API stores the latest frame in Azure Blob Storage. Configure these Azure Static Web App application settings:

- `AZURE_STORAGE_CONNECTION_STRING`: required Azure Storage account connection string.
- `LED_FRAME_CONTAINER`: optional blob container name. Defaults to `led-frames`.
- `LED_FRAME_BLOB`: optional blob name. Defaults to `latest-frame.json`.

For local API setup and test commands, see `api/README.md`.

## How to customize

Search the HTML files for placeholder text like `Your Name`, `About me placeholder`, and `Project One`. Replace those with your own name, bio, links, and project details.

The profile image on the home page currently uses the GitHub avatar for `GrantReilly07`. Replace the `src` attribute on the profile image in `index.html` when you have a preferred photo or image.
