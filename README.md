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

The API stores the latest frame in Azure Blob Storage. 

For local API setup and test commands, see `api/README.md`.
