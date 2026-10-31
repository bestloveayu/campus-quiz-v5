# Offline Student ZIP Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-browser ZIP download of a self-contained offline student game, including a Windows command file called `執行遊戲.cmd`.

**Architecture:** Embed the static V5 ESM module dependency graph and CSS into an offline HTML shell; inject the current game data in Base64 at export time; let the existing runtime start automatically in player-only mode. Generate ZIP entirely client-side with a bundled JSZip library.

**Tech Stack:** HTML, ES modules, Three.js vendor files, Node test runner/build script, JSZip, browser Blob downloads.

**Spec:** `docs/superpowers/specs/2026-10-31-offline-zip-export-design.md`

## Global Constraints

- Output must run offline on Windows without Python or installing other software.
- Exported ZIP includes exactly `index.html`, `執行遊戲.cmd`, and `README.txt`.
- Online V5 editing features and previous localStorage content remain intact.
- No remote API calls or external CDNs in exported HTML.

## Review Focus

- Unicode filenames and Chinese TXT fields → export file entries retain UTF-8.
- HTML injection inside authored text → game data encoded as Base64 JSON.
- Duplicate/invalid task IDs and too few questions → export validates project and bank before downloading.
- Shared dependencies and import aliases → build resolves graph and rewrites each import to a unique blob URL.
- Reloading an offline game → avoid loading unrelated online-editor localStorage saves.

---

### Task 1: Build a self-contained offline HTML shell

**Files:** Create `build-offline-template.mjs`, `offline-template.test.mjs`; generate `offline-player-template.html`.

**Interfaces:** Build consumes `index.html`, CSS and the module files reachable from `ui.js`; emits an HTML file with exactly one data placeholder `__CAMPUS_GAME_DATA_BASE64__` and no external resource references.

- [ ] Write a failing test that runs the build and asserts embedded module graph and CSS; reject missing or external module references.
- [ ] Verify RED using `node --test offline-template.test.mjs`.
- [ ] Implement the Node build script and inline module loader.
- [ ] Verify GREEN and check generated HTML byte count.

### Task 2: Start the embedded game in play-only mode

**Files:** Modify `author.js`, `ui.js`, and offline stylesheet generated in Task 1; extend `offline-template.test.mjs`.

**Interfaces:** `window.__CAMPUS_OFFLINE_GAME__={project,questions}` overrides defaults and old saves only in the downloaded game; `author.resumePlay()` initializes play mode; editor/authoring controls are hidden.

- [ ] Write a failing source/runtime-oriented test for embedded project and game boot conventions.
- [ ] Verify RED.
- [ ] Implement offline initialization and safe separate localStorage namespace.
- [ ] Verify GREEN and full 51-test JavaScript regression suite.

### Task 3: Export ZIP from online editor

**Files:** Create `export-game.mjs`, `export-game.test.mjs`; add `vendor/jszip.min.js` and its license; modify `author.js` and `README.md`.

**Interfaces:** `exportStudentGame({project,questions})` downloads a ZIP after validation. ZIP has `index.html` with injected Base64 payload, `執行遊戲.cmd` and `README.txt`; offline template comes from a relative fetch.

- [ ] Write RED export tests for Unicode file name, ZIP contents, Base64 payload and rejected invalid data.
- [ ] Implement exported game builder, ZIP button, and vendor dependency.
- [ ] Verify tests and check ZIP can be read by JSZip in Node.

### Task 4: Package, document and deliver

**Files:** Update `QA.md`, `README.md` and pack a new V5 full-project ZIP.

- [ ] Run the offline build and all automated checks; confirm exact output files and tests.
- [ ] Verify archive integrity and produce a new standalone downloadable ZIP in the scratch workspace and persistent Library.
- [ ] Identify the user's GitHub repository destination before publishing, avoiding unsolicited changes to other repositories.
