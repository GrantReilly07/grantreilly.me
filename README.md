# grantreilly.me

A personal project website deployed with Azure Static Web Apps.

## Site structure

- `index.html` is the home page.
- `style.css` contains the shared design system and responsive layout.
- `projects/index.html` lists the projects.
- `projects/project-one/index.html` is the LED matrix editor page.
- `projects/project-one/matrix.css` styles the editor housing and controls; the
  1,024 cells have no shadows or transitions.
- `projects/project-two/` is Met Color: a continuous color wheel, manual RGB inputs,
  and an artwork matcher with images and full Met collection records.
- `projects/project-three/index.html` is an explicitly unfinished project template.
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

## Neumorphic design system

The portfolio uses dark charcoal materials with consistent upper-left lighting.
`style.css` owns the palette, text, shadow colors, three raised depths, two inset
depths, control edges, focus ring, spacing, 6–12px radii, and 160–200ms transitions.
The original public color variables remain available to page styles.

Shared patterns include raised cards and panels, recessed work areas, primary
and secondary buttons, pressed tools, inputs, native range controls, navigation,
status labels, and technology tags. Selected tools use both `aria-pressed` and
visible indicators. The active navigation item is recessed with a visible edge.
Keyboard focus stays visible, reduced motion disables transitions, and forced
colors retain control outlines. Text tokens have at least 5.7:1 contrast against
the standard surfaces; control edges have at least 3:1.

The navigation wraps into a visible grid on mobile without a JavaScript menu.
Project cards share one layout across the homepage and directory. The two apps
keep their existing DOM IDs and JavaScript; page styles only arrange their
workspaces. The profile panel retains the existing GitHub avatar URL, which
currently supplies an identicon rather than a portrait photograph.

### Design references and licensing

HTML and CSS/SCSS implementations were studied from the
[FreeFrontend neumorphism collection](https://freefrontend.com/css-neumorphism-examples/):

- [Ana Tudor's volume slider](https://codepen.io/thebabydino/pen/eYvzRPN): separate
  track/thumb styling, paired directional shadows, and focus feedback informed
  the native brightness slider. The track is recessed and the thumb raised.
- [Billy's realistic switches](https://codepen.io/billyysea/pen/ndzGXm): layered
  gradients, inset channels, and highlighted control edges informed the material
  surfaces and pressed tool states.
- [CSSParadise's mechanical toggle](https://codepen.io/cssparadise/pen/QwGbBLa)
  (credited in the Pen to Uiverse creator `tunminh_6850`): shared outer/inset shadow
  tokens, a selected-state indicator, and depression on activation informed the
  LED tools. Its glow and spring animation were deliberately omitted.

The implementation is original native CSS reproducing these general techniques;
no third-party snippets, demo markup, fonts, animation engines, or assets were
copied into the project. No external code license or attribution notice is being
redistributed. No new runtime dependency or frontend build step is required.

### Validation

```sh
npm test --prefix api
node --test test/site.test.mjs
python -m http.server 4317 --bind 127.0.0.1
```

The existing nine API/color tests and frame validation assertions pass. The three
site tests check local links/assets/anchors, navigation and app hooks, and text
and control-edge contrast. Browser QA covered all five pages at 1440, 1024, 768,
390, and 320px without horizontal overflow, including populated artwork metadata
and the expanded collection record at 320px.

Browser interactions checked LED color selection, painting, dragging, erasing,
clearing, JSON dimensions/pixels, pressed states, and export loading/success/error
feedback. Met Color checks covered pointer and keyboard wheel input, brightness,
RGB synchronization/validation, accurate swatches, search loading/error recovery,
real Met metadata/image rendering, and the expandable collection record. Temporary
local API fixtures exercised the application's success/error branches without
writing to the production LED frame. No fixture code is shipped in this repo.

Azure Blob persistence and the deployed Java color matcher were not tested end to
end. Physical touch devices, Firefox/Safari, screen-reader output, and network
failure during Met image fallback/retry were not manually tested. The original
API integration and fallback/retry JavaScript remain unchanged.
