# Fix & Improvement Log

This documents the changes made in this pass, grouped by type. All changes are
scoped to the existing HTML/JS/CSS files — no new dependencies were added.

## 🐞 Bugs fixed

1. **Wrong login redirect on `allocate-asset.html`** — logged-out users were
   sent to `https://techstrategy.co/login.html` (an unrelated external site)
   instead of the app's own `login.html`.
2. **Sidebar "active" page highlight never rendered** — every page added an
   `active` class to the current nav link, but no CSS rule for `.active` or
   `.sidebar-link` existed. Added the missing styles in `css/theme.css`.
3. **Wrong active tab on `user-asset-overview.html`** — the sidebar was
   highlighting "Add Asset" instead of "User Asset Overview".
4. **Asset Type dropdown wiped built-in categories** — `add-asset-page.js`
   rebuilt the `#assetType` dropdown entirely from the Firestore
   `assetTypes` collection on every load, deleting the 7 built-in options
   (Laptop, Desktop, Monitor, Printer, Mouse, Headset, Keyboard) whenever
   that collection didn't already contain them. The loader now always
   includes the built-in defaults and merges in custom types without
   duplicates.
5. **Editing "Allocated To" didn't update status** — the Edit Asset modal
   let you set/clear the "Allocated To" field without touching `status`,
   so an asset could show a person's name while still displaying as
   "Available" (or vice versa). `saveEditedAsset()` now keeps `status` (and
   clears `allocationDate`) in sync with whether "Allocated To" is filled.
6. **Wrong toast color on delete** — deleting a custom asset type showed a
   success message styled as an error (red) toast. Fixed to use the
   `success` type.
7. **Runtime errors on `asset-summary.html`** — the page's script referenced
   `#typeSearch` and `#logoutBtn`, neither of which existed in the markup,
   throwing on every load. Added the missing search input (and wired it up,
   since the feature was clearly intended) and removed the redundant/broken
   `#logoutBtn` handler — logout is already handled globally via `auth.js`.
8. **Malformed HTML** — a stray, unmatched `</div>` in `asset-summary.html`
   has been removed/rebalanced.
9. **Removed dead/broken files**:
   - `main.js` — legacy Firebase v8-style code, calls an undefined
     `uuidv4()`, and isn't included by any page.
   - `firebaseConfig_old.js` — superseded by `firebase-client.js`, unused.
   - `layout.html` — an orphaned template, not linked from anywhere, with
     its own broken nav link (`inventory.html` instead of
     `asset-inventory.html`).
10. **Leftover debug banner** — removed the hardcoded "REPO A • tejasgavli •
    TEST-01" badge from `login.html`.
11. **Enter-to-submit on login** — the email/password fields are now wrapped
    in a real `<form>`, so pressing Enter logs in instead of only working via
    button click. Added a basic empty-field check too.
12. **Invalid/duplicate auth-check script** — removed a `<script>` block
    placed before `<!DOCTYPE html>` in `asset-inventory.html` that duplicated
    the redirect logic already handled globally by `auth.js`.

## 🎨 UX / consistency polish

- Replaced all remaining native `confirm()`/`alert()` calls (in
  `asset-inventory.js`, `allocate-asset.js`, `user-asset-overview.js`) with
  the app's existing styled confirmation modal and toast system, so every
  page now has a consistent look and feel. This required adding the
  confirmation modal markup to `allocate-asset.html` and
  `user-asset-overview.html`, which didn't have it.
- Fixed inconsistent toast severity colors (several validation/error
  messages were using the default "info" style instead of "warning"/
  "error").
- Removed a hacky `transform: scale(0.9)` CSS trick used to fit the
  inventory table, replaced with a normal horizontally-scrollable
  container.
- Fixed the double Firestore collection fetch in `allocateAsset()` (it
  fetched the entire `assets` collection twice — once unused — instead of
  reading the single needed document via `getDoc`).

## Not changed (flagged for a later phase)

These are real opportunities but are bigger architectural/security changes
better done deliberately rather than folded into a bug-fix pass — see
`docs/PROJECT_ANALYSIS.md` for the phased plan:

- Firestore security rules / role-based access control.
- The hardcoded "Asset Admin" → email mapping in `auth.js`.
- Server-side/query-based pagination (currently loads the full `assets`
  collection client-side).
