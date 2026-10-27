# CHILDIGIT 2027 — Workshop website

Single-page website for **CHILDIGIT – Children in a Digital World: Bridging Technical and Legal
Perspectives on Security, Safety and Participation**, a workshop at the Joint National Conference on
Cybersecurity ITASEC & SERICS 2027 (Siena, February 8, 2027).

**Live site:** https://lopsandrea.github.io/childigit/

Plain HTML/CSS/JS: no build step and no dependencies, so you can edit it directly and serve it as is.

```
index.html              the whole page (content lives here)
assets/css/styles.css   styles; colours are tokens at the top of the file
assets/js/main.js       small enhancements (menu, countdown, date status, copy button, bios)
assets/img/             favicon and social preview image (og-image.png, 1200×630)
.nojekyll               tells GitHub Pages to serve the files untouched
```

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Publishing

The site is served by GitHub Pages from the `main` branch (root folder): every push to `main`
updates it within a minute or two.

If the address changes (another repository, or a custom domain under **Settings → Pages**), update the
`canonical`, `og:url` and `og:image` tags in `index.html`.

## Common updates

- **Technical Program Committee / Workshop Program**: `index.html` has a commented-out template in each
  section (`<ul class="committee">` and `<ol class="agenda">`). Replace the `placeholder` block with it.
  The styles are already in place.
- **Organiser photos**: put the image in `assets/img/people/` and replace the initials
  `<span class="avatar …">ST</span>` with
  `<img class="avatar" src="assets/img/people/tibido.jpg" alt="" width="88" height="88">`.
- **Dates**: each date appears in the hero, the "At a glance" card, the timeline and the footer. The
  countdown and the timeline status ("Next up", "Passed") come from the `data-deadline` and `data-ends`
  attributes in `index.html`.
