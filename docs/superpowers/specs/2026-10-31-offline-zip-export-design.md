# Offline Student Game ZIP Export — Approved Design

## Intent

Students use the existing V5 TXT workshop in an online editor on GitHub Pages, refine and preview their game, then click **📦 匯出完整遊戲 ZIP**. No login, server-side save, or cross-device sync is required. The existing teacher/editor functionality remains available online.

## Exported deliverable

One ZIP named after the student's project, containing:

- `index.html`: a **self-contained offline** student-play-only game with the current project, question bank, 3D engine, CSS and JS embedded; no network or Python dependency.
- `執行遊戲.cmd`: an ASCII-content Windows launcher that opens `index.html` with the default browser.
- `README.txt`: brief Traditional Chinese launch instructions and browser compatibility caveat.

The game starts directly in play mode. It retains the campus/room templates, 3D doors and E key, NPCs, challenges and unlocking rules. It exposes no project editing controls. Exported data is embedded as encoded JSON, never interpreted as executable code. Existing editing saves and students' other files are not modified.

## Architecture and approaches

Selected: **browser-side static ZIP and self-contained HTML**. The online editor fetches a prebuilt offline HTML shell, embeds the current validated project and question bank, and creates the ZIP in-browser. Its original V5 files remain deployable on GitHub Pages.

Alternatives rejected:

- Multi-file ZIP + Python server: simpler technically, but contradicts the user's explicit no-Python/no-network requirement.
- A PowerShell local server: no Python, but can be blocked by Windows execution policies and endpoint security.

The offline HTML uses an embedded module graph. A build-time Node script gathers current JS dependencies and CSS, then an inline runtime constructs module URLs from its embedded sources and loads the V5 app. This avoids external imports or a file:// web server. A build-time test checks the dependency graph and data placeholder; the browser ZIP export uses a local JSZip vendor file.

## Non-goals and cautions

- No GAS/Google Sheets accounts, cloud storage, or cross-device sync.
- Downloaded ZIP is a single-player artifact; it is not a copy of the online teacher editor.
- `file://` browsing, WebGL and browser storage policies vary; validate with Chrome/Edge on Windows before classroom distribution.
- Exporting makes the quiz answer data available inside the local game; it is not a secure exam platform.
- GitHub publication is a separate authorized action; the repository destination must be verified before upload.
