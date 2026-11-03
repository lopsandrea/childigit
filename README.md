# CHILDIGIT 2027 — Workshop website

Single-page website for **CHILDIGIT – Children in a Digital World: Bridging Technical and Legal
Perspectives on Security, Safety and Participation**, a workshop at the Joint National Conference on
Cybersecurity ITASEC & SERICS 2027 (Siena, February 8, 2027).

**Live site:** https://childigit.web.app/

Plain HTML/CSS/JS: no build step and no dependencies, so you can edit it directly and serve it as is.

```
index.html              the whole page (content lives here)
assets/css/styles.css   styles; colours are tokens at the top of the file
assets/js/main.js       small enhancements (menu, countdown, date status, copy button, bios)
assets/img/             favicon and social preview image (og-image.png, 1200×630)
firebase.json           Firebase Hosting: what gets published (only index.html and assets/) and headers
.firebaserc             the Firebase project (childigit)
```

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Tests

```sh
npm install        # once
npm test           # HTML validation + the Playwright suite (uses your installed Google Chrome)
npm run test:links # also checks that external links respond (needs internet)
```

The suite (`tests/`) starts a local server by itself and covers:

- **content** (`content.spec.js`): the sections of the brief, topics, dates, submission types,
  e-mail address and subject, template links, organisers and their photos;
- **behaviour** (`behaviour.spec.js`): countdown and date status at fixed dates, copy button, bios,
  navigation highlight, mobile menu, the page without JavaScript;
- **accessibility** (`accessibility.spec.js`): axe-core WCAG 2.2 A/AA in light/dark, desktop/mobile,
  before/after the deadline; keyboard focus (visible, never under the sticky header); headings,
  names and roles; animations stopping within 5 seconds;
- **layout** (`layout.spec.js`): no horizontal scrolling from 320 to 1440 px, navigation per width;
- **links** (`links.spec.js`): in-page anchors and local files.

GitHub Actions runs `npm test` on every push to `main` and on pull requests
(`.github/workflows/tests.yml`); on `main` it then publishes the site (see below).

## Publishing

The site is served by **Firebase Hosting** (project `childigit`, https://childigit.web.app/). Every push
to `main` runs the tests and, if they pass, deploys the site from GitHub Actions; it is live within a
couple of minutes. The workflow authenticates with a service account key stored in the repository secret
`FIREBASE_SERVICE_ACCOUNT`.

To deploy by hand (you need access to the Firebase project):

```sh
npx firebase-tools deploy --only hosting
```

Only the files that are not listed under `ignore` in `firebase.json` are published: `index.html` and
`assets/`. If you add files at the top level, check that list.

If the address changes (for example a custom domain under **Hosting** in the Firebase console), update
the `canonical`, `og:url` and `og:image` tags in `index.html`.

## Common updates

- **Technical Program Committee**: one `<li>` per member in `<ul class="committee">` (name and
  affiliation).
- **Workshop Program**: `index.html` has a commented-out template (`<ol class="agenda">`). Replace the
  `placeholder` block with it. The styles are already in place.
- **Organiser photos**: put the image in `assets/img/people/` and replace the initials
  `<span class="avatar …">ST</span>` with
  `<img class="avatar" src="assets/img/people/tibido.jpg" alt="" width="88" height="88">`.
- **Dates**: each date appears in the hero, the "At a glance" card, the timeline and the footer. The
  countdown and the timeline status ("Next up", "Passed") come from the `data-deadline` and `data-ends`
  attributes in `index.html`.
