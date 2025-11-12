# Udemy Progress Helper

A small Chrome extension that helps you enable and mark Udemy course sections/lectures as complete in your browser.
Useful for local testing, accessibility, or personal organization. **Does not** (and should not) modify Udemy servers — it simulates clicks in your browser only.

---

## Features

* Detects sections on a Udemy course page.
* Enable & tick disabled progress checkboxes.
* Run a compact spec to mark full sections or specific lectures (e.g. `1`, `1:1-3`, `1,2:1,3`).
* Popup UI with section list, quick spec input, and keyboard command (Ctrl+Shift+Y).
* Fallback injection if the page hasn’t preloaded the content script.

---

## Quick example spec formats

* `1` → mark all items in **Section 1**
* `1:1-3` → mark lectures 1 through 3 in Section 1
* `1:1,3` → mark lectures 1 and 3 in Section 1
* `1,2,3` → mark all items in Sections 1, 2 and 3
* Combine with semicolons: `1;2:1-2;3`

---

## Folder structure

Your repo should look like:

```
udemy-progress-helper/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── icons/ (optional)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## Setup (local development)

### 1. Clone / unzip the project

```bash
# git
git clone <your-repo-url> udemy-progress-helper
cd udemy-progress-helper
# or unzip the provided archive and open the folder
```

### 2. Confirm `manifest.json`

Make sure your `manifest.json` contains the content_scripts `matches` entries that cover the Udemy domain(s) you use. A safe set:

```json
"content_scripts": [
  {
    "matches": [
      "*://*.udemy.com/*",
      "*://udemy.com/*",
      "*://*.udemybusiness.com/*",
      "*://gale.udemy.com/*"
    ],
    "js": ["content.js"]
  }
]
```

If you use other Udemy subdomains, add them here.

### 3. Load extension in Chrome (developer mode)

1. Open `chrome://extensions/`
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `udemy-progress-helper/` folder (ensure `manifest.json` is at the root)
5. The extension should appear in the extensions list

### 4. Test on a course page

1. Open a Udemy course page (e.g. your course URL)
2. Refresh the page (so content script is injected)
3. Open DevTools on the course page (F12) → Console and look for:

   ```
   Udemy Progress Helper: content.js loaded
   ```
4. Click the extension icon → use the popup UI:

   * **Refresh Sections** to detect sections
   * Type a spec (e.g. `1` or `1:1-3`) and click **Run Spec**
   * Or select sections from the list and click **Mark Selected**

---

## Troubleshooting & debugging

### Common problem: “Receiving end does not exist”

* This means the content script is not injected. Fix:

  * Ensure the active tab is a Udemy page that matches `manifest.json` patterns.
  * Reload the Udemy page after reloading the extension.
  * Add the exact subdomain to `matches` if you use non-standard hosts (e.g. `gale.udemy.com`).

### View logs:

* Popup logs: open the extension popup, right-click inside → **Inspect** → Console
* Content script logs: open DevTools on the course page → Console
* Background service worker logs: `chrome://extensions/` → find the extension → **Service worker** → Inspect

### Quick test in page console

```js
// check if content script loaded
!!window.__udemyProgressHelper

// list detected sections
window.__udemyProgressHelper && window.__udemyProgressHelper.getSectionsMeta()
```

### Fallback injection

If you want the popup to work even when the content script didn’t auto-inject, the popup uses `chrome.scripting.executeScript` fallback (already included). Ensure `scripting` permission is present in `manifest.json`.

---

## Packaging for Chrome Web Store

1. Ensure `manifest.json` `version` is correct (e.g. `"version": "1.2"`). Bump version on updates.
2. Zip the extension files with `manifest.json` at the root (do NOT zip the parent folder).

   * **Windows Explorer**: select the files inside the folder → right-click → Send to → Compressed (zipped) folder
   * **PowerShell**:

     ```powershell
     Compress-Archive -Path .\* -DestinationPath ..\udemy-progress-helper.zip
     ```
3. Create a Developer account: [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole) (one-time $5 USD fee)
4. Upload the zip, add description, screenshots, privacy policy link, and publish.
5. Wait for Google review.

---

## Privacy, permissions & ethical use

### Permissions used

* `activeTab` — to run on the active tab
* `scripting` — to inject code if needed
* `storage` — to remember last spec

### Privacy statement (example)

> This extension only manipulates page elements locally in your browser to help you mark items visually. It **does not** collect, store, or transmit personal data. No data is sent to any external servers.

Place a full privacy policy in your repo (e.g., `PRIVACY.md`) and add a hosted URL when publishing.

### Ethical note

This tool simulates UI interactions in your browser. Using it to fraudulently claim course completion can violate Udemy’s Terms of Service. Use this extension responsibly — for testing, development, accessibility, or personal organization only.

---

## Commands & useful snippets

### Reload extension

* `chrome://extensions/` → click **Reload** under the extension.

### Overwrite manifest from PowerShell (example)

```powershell
Set-Content -Path 'D:\udemy-progress-helper\manifest.json' -Value '<paste-correct-json-here>' -Encoding UTF8
```

### ZIP on Linux / macOS

```bash
cd udemy-progress-helper
zip -r ../udemy-progress-helper.zip *
```

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-change`
3. Make changes & test locally
4. Submit a PR with a clear description of what you changed and why

---

## License

Choose a license for your repo (e.g., MIT). Example `LICENSE` (MIT) is recommended if you want permissive reuse.

---

## Example README badge / metadata

* Version: 1.2
* Shortcut: `Ctrl+Shift+Y`

---

If you’d like, I can:

* generate a `PRIVACY.md` file for your repo, or
* create a ready-to-download zip file of your final extension, or
* produce `CHANGELOG.md` and a simple `LICENSE` (MIT) file and add them to the canvas. Which one do you want next?
