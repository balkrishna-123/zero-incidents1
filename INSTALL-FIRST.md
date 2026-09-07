# Install Working at Height — release 1.3

Use this update for the Zero Incident project you already run. It includes BOTH frontend and backend changes, plus the shared Manual Handling code.

1. Finish any active timed question, then stop the Node server with **Ctrl+C**.
2. Back up your project, especially `.env`, `data/`, uploaded pictures and any custom code. **Do not delete them.**
3. Copy/merge the extracted `public`, `server`, `tests` and `docs` folders, and `README.md`, `package.json` and `package-lock.json`, into:

   ```text
   D:\Zero-Incident-Admin-Auth\zero-incident\
   ```

   This is the existing inner folder containing `package.json`. Replace matching code files; do not replace the entire project or create `public/public` / `server/server`. Merge your own custom edits where needed.

4. In that existing project folder run:

   ```powershell
   npm install
   npm start
   ```

5. Open **http://localhost:3000**, press **Ctrl+F5**, sign in as an employee, and choose **Working at Height → Start training**.

The patch does not contain `.env`, runtime data, uploads or the existing branding/trainer assets. No database reset is required. Existing accounts, credentials and Manual Handling history remain in the same database.

**Hazard Perception and final certificates are still pending.**

See [docs/WORKING-AT-HEIGHT.md](docs/WORKING-AT-HEIGHT.md) for the lesson, scoring, controls, test commands and troubleshooting. This is a planning simulation, not permission or proof of competence to work at height; have the content reviewed against your site’s procedures before real training.
