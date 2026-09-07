# ZERO INCIDENT
## A safer start, for everyone.

**Release 1.3 — Admin/authentication + Manual Handling + Working at Height**  
Built for the Tech-Yeti safety-training project, using the supplied screens and the revised **three-module** scope.

> **This is a working development prototype, not a completed three-module training product.** Account management, Manual Handling and Working at Height are implemented. Both playable modules have procedural 3D scenes, five scored checkpoints, five timed quiz questions, server-marked results, stars, history and retakes. Hazard Perception assessment and final certificates are still pending. Sample progress is labelled and is not real training evidence.

---

## Working at Height update — install this release

Follow **[docs/WORKING-AT-HEIGHT.md](docs/WORKING-AT-HEIGHT.md)** for the current Windows update, lesson content and test commands. The patch updates both frontend and backend while preserving your `.env`, database, trainer pictures and existing Manual Handling results.

Working at Height adds a blue-themed maintenance zone covering ground-level alternatives, defective access equipment, edge protection, falling objects and competent work/rescue planning. It uses **70 activity + 30 quiz marks**, **20 seconds per question**, and the same **70/100** pass threshold. The learner remains at ground level; completing the simulation is not permission to climb or operate equipment.

Both modules now share a tested controller and warehouse renderer, while their attempts, question banks and best scores remain separate. Hazard Perception and final certificates are next.

## Manual Handling — release 1.2 curriculum

**For the latest installation, use the Working at Height guide above.** [docs/MANUAL-HANDLING.md](docs/MANUAL-HANDLING.md) retains the Manual Handling lesson and original release notes. Do not install the older patch over release 1.3.

The module covers **TILE risk assessment, planning the route, selecting a handling aid, a controlled move and setting down safely**. Each of five activity decisions earns up to 14 marks (70 total). Five quiz questions earn up to 6 marks each (30 total), with a server-enforced **20-second** deadline. **70/100 passes**; the best genuine assessed result is kept across retakes. Completing a real assessment replaces that module’s illustrative sample score, if present.

Use the assigned trainer’s briefing, then click 3D markers or accessible Inspect controls. The complete content, safety limits, API/test notes and Windows update instructions are in the module guide above.

## UI update: visible sign-out and light/dark themes

Use **Sign out** at the top right of the workspace. The top bar stays visible while scrolling, and the sidebar profile can no longer be pushed below a short screen.

Use **Light mode / Dark mode** beside Sign out. Each role remembers its appearance in this browser; switching preserves unsaved form inputs. On small screens, use the sun/moon icon. The login page retains its light design.

For the earlier theme-only patch, see [docs/UI-UPDATE.md](docs/UI-UPDATE.md). For the current two-module release, use **docs/WORKING-AT-HEIGHT.md** instead: it also updates the backend. Existing accounts, passwords and uploaded pictures are not replaced.

---

## What works now

### Admin
- Secure sign-in and an overview with database-backed counts and recent activity.
- Register employees with first name, last name, age, username and temporary password.
- Optional employee ID; an atomic database counter generates one when omitted.
- Search, filter, paginate, view and edit employee accounts.
- Deactivate/reactivate employees. Deactivation revokes their sessions without deleting progress.
- Reset temporary passwords and revoke existing sessions.
- Permanently delete an employee and their progress, with an explicit username confirmation.
- View per-module scores, completion status and certification eligibility; export the displayed progress to CSV.
- Edit the admin profile and username; change the admin password.

### Virtual trainers
- Create and edit first name, last name, nickname, optional character age and welcome introduction.
- Required image upload: JPG, PNG or WebP, maximum 5 MB / 20 megapixels.
- Images are validated, re-encoded as WebP, stripped of metadata and stored behind authenticated access.
- Assign a trainer to any of the three modules; selecting a module replaces its current guide.
- Deactivate/reactivate or permanently delete a trainer.
- **No trainer login, username or password:** trainers are characters managed by the admin.

### Employees
- Sign in with administrator-issued temporary credentials.
- Cannot access the hub or protected learning APIs until the temporary password is changed.
- After choosing a new password, the session ends and the employee returns to login.
- Sign in again to access the three-module training hub and virtual-trainer introductions.
- Complete Manual Handling and Working at Height, resume open attempts, review results and retake while keeping a separate assessed best for each module.
- View their own progress, profile, certificate eligibility and password settings.
- Other employees’ data and every admin API remain inaccessible.

### Three modules only
1. Manual Handling
2. Working at Height
3. Hazard Perception

---

## Start locally

### Requirements
- Node.js **20.19 or newer**. Prefer an actively supported LTS release for deployment.
- npm and an internet connection for initial dependency / MongoDB binary downloads.
- A modern desktop browser. A responsive mobile layout is also included.

```bash
cd zero-incident
npm install
```

Copy the example environment file:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

Then:

```bash
npm start
```

Open **http://localhost:3000**.

**Important:** do not open `public/index.html` directly or use VS Code Live Server. This version needs the Node.js server for authentication and database access. The frontend and API are served together from the same origin.

### No MongoDB installed? The demo still uses a real database.

The example configuration enables a **real local MongoDB process** through `mongodb-memory-server`. Despite the package name, this project uses MongoDB’s WiredTiger storage engine and a persistent `data/mongodb` directory, not a JavaScript array or browser storage.

The first startup may need time to download the MongoDB binary. The local database listens only on the machine’s loopback interface. Do not use this development-only database launcher for production.

If the automatic binary cannot run on your operating system, configure your own MongoDB / Atlas URI instead:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/zero_incident
ALLOW_LOCAL_MONGO=false
```

The local data directory survives an ordinary stop/restart. Keep backups; copying a live database directory is not a substitute for a consistent database backup. Do not run two app instances against the same local data directory.

---

## Try the demo

| Account | Username | Password |
|---|---|---|
| Admin | `safety.admin` | `ZeroIncident!2026` |
| New employee | `ramesh.s` | `Welcome!2026` |

The small **Admin console** and **New employee** buttons fill the sign-in form; they do not bypass authentication.

### Recommended walkthrough
1. Sign in as the admin.
2. Open **Manage employees → Register employee**.
3. Fill the required details and choose **Generate** or enter a temporary password.
4. Create the account. Copy or print its credentials from the one-time dialog.
5. Sign out and sign in as that employee.
6. Set a different password. You are returned to the login page.
7. Sign in again with the new password to reach the three-module hub.
8. Return as admin to try trainer image uploads, progress viewing, account edits, password resets and deactivation.

**The demo is shared and intentionally uses published credentials. Do not enter real personal data or reuse a real password.**

Changing a demo password really changes it. Use the new password afterwards. The relevant auto-fill button becomes unavailable once the original demo credentials are no longer valid. Reset employee credentials through the admin console; use server-side recovery for the admin.

Six fictional employee accounts and one virtual trainer are seeded on the first demo initialization. Some employees have sample results for reporting demonstrations. New accounts have no assessment scores. Seed records are not recreated or reset on every restart.

To reset the entire *local demo*, stop the app, back up anything you need, and remove the development `data/mongodb` directory before restarting. This is destructive; never do it to data you need to retain.

---

## Configure a non-demo installation

Use a **new, clean MongoDB database**, preferably a managed instance with restricted network access and backups. Do not point a production installation at the shared demo database.

```dotenv
NODE_ENV=production
PORT=3000
DEMO_MODE=false
ALLOW_LOCAL_MONGO=false
MONGODB_URI=your-private-mongodb-connection-string
SESSION_SECRET=your-long-cryptographically-random-secret
BOOTSTRAP_ADMIN_USERNAME=your.admin.username
BOOTSTRAP_ADMIN_PASSWORD=your-strong-initial-password
BOOTSTRAP_ADMIN_FIRST_NAME=Safety
BOOTSTRAP_ADMIN_LAST_NAME=Administrator
```

Generate a session secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

- The first non-demo admin is created only when no admin exists.
- A non-demo bootstrap admin must change the initial password before accessing the console.
- There is deliberately **no public admin-registration endpoint**.
- Bootstrap values do not overwrite an existing admin. Remove the bootstrap password from the environment after setup.
- Production startup refuses `DEMO_MODE=true`, a missing/weak session-secret configuration, and a database containing labelled demo accounts.
- Configure HTTPS and one trusted reverse proxy. The code currently trusts **one** proxy hop; change this to match your deployment, not arbitrary client-supplied forwarding headers.
- On Render, use `npm install` as the build command and `npm start` as the start command. Set the variables in the hosting environment. The app binds to `0.0.0.0` and honours `PORT`.
- Trainer uploads need persistent storage. Set `DATA_DIR` to your persistent disk mount, or implement object storage before using ephemeral hosting. Do not rely on Render’s temporary filesystem for durable uploads.
- The development preview allows iframe embedding and uses Secure, SameSite=None, partitioned cookies over HTTPS. Production uses SameSite=Lax and blocks framing.
- Shared-store rate limiting, monitoring, backup/restore drills, a retention/privacy policy, formal security review and organisational approval are still required before real deployment. MFA and email recovery are not implemented.

Never commit `.env` or database credentials. Only `.env.example` belongs in source control.

---

## Admin recovery

This is an **operator-only command**, not a web endpoint. If using the locally managed database, **stop the app first** to avoid opening the same data directory twice.

Set `RECOVERY_ADMIN_USERNAME` and `RECOVERY_TEMP_PASSWORD` in your secure environment or temporarily in the ignored `.env`, then run:

```bash
npm run admin:recover
```

The command hashes the supplied temporary password, revokes every existing session and requires a first-login password change. It does not print the password. Remove the recovery password from the environment immediately afterwards, restart the app, sign in and choose a new private password.

There is no configured email service; the login-page password-help dialog directs employees to their administrator rather than pretending to send email.

---

## Security and data rules

- Passwords: individually salted **scrypt** hashes (`N=32768, r=8, p=3`), using Node’s built-in crypto implementation. Passwords and temporary passwords are never stored in readable form.
- Usernames remain readable, unique account identifiers; passwords are the values that are hashed.
- Password policy: 8–128 characters, at least one uppercase letter and one number. New passwords must differ from the current/temporary password.
- Server-side sessions stored in MongoDB; HttpOnly cookies; session IDs regenerated at login.
- Unchecked **Remember me**: a browser-session cookie with an eight-hour server-side absolute limit. Checked: up to fourteen days. Password changes, resets and deactivation invalidate access sooner.
- Synchronizer CSRF tokens for every mutating API call, including login.
- Login rate limiting, password-operation rate limiting, input validation and security headers.
- Every protected request re-checks the current account status, role, mandatory-password-change flag and session version.
- Only the employee’s own progress is available to that employee.
- Names and other user-controlled text are escaped before HTML rendering. CSV fields are quoted and formula-prefixed values neutralised.
- Destructive deletion requires an exact username or trainer nickname confirmation.
- Audit records track account and trainer changes, but contain no passwords. Audit history is retained after account deletion; set a retention policy before using real employee information.

### Learning-result rules

| Score | Classification |
|---|---|
| 85–100 | Excellent / Safety Ready |
| 70–84 | Pass |
| Below 70 | Fail / Retake |

Each of the three modules is equally weighted for the final average. The overall score remains unavailable until all three scores exist. **Every module must individually score at least 70** for certification eligibility; an average of 70 is insufficient if one module failed.

Both released modules accept validated **activity and quiz responses**, not client-supplied totals. The server marks them and writes the best assessed result. Quiz deadlines survive reloads, replayed answers cannot earn more marks, and only the owner can access an attempt. There is still **no certificate-issuance API**; Hazard Perception will follow. Demonstration scores are not treated as genuine assessed best scores.

---

## Test the implementation

### API / database integration checks
```bash
npm test
npm run test:manual
npm run test:height
```

Tests use a separate disposable MongoDB database. They do not modify your running app database.

### Browser checks
```bash
npx playwright install chromium
# On Linux, install the browser's system libraries if needed:
npx playwright install-deps chromium
npm run test:browser
# Additional appearance / logout regression checks:
npm run test:appearance
npm run test:manual:browser
npm run test:height:browser
```

The browser script launches its own isolated test application and database, then closes them. It covers registration, account edits, deactivation, onboarding, the employee hub, trainer upload/deletion, progress export and mobile navigation. Screenshots are written to `data/browser-test-artifacts/`, not committed.

See [docs/TEST-REPORT.md](docs/TEST-REPORT.md) for the verification record and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the API and database design.

---

## Project layout

```text
zero-incident/
├── public/
│   ├── index.html              # App entry point
│   ├── styles.css              # Shared light/dark workspace UI
│   ├── training.css            # Shared learning UI; green Manual / blue Height
│   ├── vendor/                 # Bundled Three.js and MIT licence
│   ├── assets/                 # Local font, icons, supplied trainer character
│   └── js/
│       ├── app.js              # Routing, session state and workspace shells
│       ├── api.js              # Same-origin requests and CSRF handling
│       ├── theme.js            # Remembered appearance; no authentication data
│       ├── login.js            # Login and mandatory password setup
│       ├── admin.js            # Accounts, trainers, reports and settings
│       ├── employee.js         # Three-module hub and employee views
│       ├── manual-handling.js  # Manual Handling page entry
│       ├── working-at-height.js # Working at Height page entry
│       ├── learning-module.js  # Shared briefing, activity, quiz, result/history
│       ├── module-views.js     # Module-specific presentation and study guides
│       ├── module-readings.js  # Original Manual Handling reading guide
│       ├── warehouse-scene.js  # Shared warehouse/camera/picking/cleanup
│       ├── manual-scene.js     # Original Manual Handling 3D props
│       ├── height-scene.js     # Access equipment and fall-prevention props
│       ├── ui.js               # Safe templates, dialogs, forms and feedback
│       └── icons.js            # Inline SVG icon helpers
├── server/
│   ├── index.js                # Startup and graceful shutdown
│   ├── app.js                  # Express APIs, guards and uploads
│   ├── config.js               # Environment configuration
│   ├── db.js                   # MongoDB connection / local dev launcher
│   ├── models.js               # User, Trainer, Module, Progress, Audit, Counter
│   ├── training-models.js      # Owned attempts; optimistic concurrency
│   ├── training.js             # Module-scoped marking, deadlines and history
│   ├── training-content.js     # Fixed lesson and private assessment bank
│   ├── passwords.js            # Hashing and password validation
│   ├── seed.js                 # Module outlines and optional demo fixtures
│   └── recover-admin.js        # Operator-only recovery
├── tests/                      # API and browser checks
├── docs/                       # Architecture and test record
├── data/                       # Runtime database / uploads; ignored by Git
├── .env.example
├── package.json
└── package-lock.json
```

## Assets and next phase

The Yeti/lady character was isolated from the screenshot supplied for this project. Replace it with the original high-resolution asset when available, and confirm reuse rights with its creator before distribution. Uploaded trainer pictures must also be owned or appropriately licensed. The bundled Inter font includes its licence. The small SVG icons are in the source and need no CDN.

The uploaded SRS still says **six modules** in its product description, scope and evaluation sections. Update those to three and add the explicit admin / virtual-trainer requirements before sign-off. Employee age 16–100 follows the provided registration-screen convention; trainer age is optional because the trainer is a virtual character.

**Next updates:** Hazard Perception, then the three-module final summary and certificate flow. Manual Handling and Working at Height are playable; the 3D warehouse is an original procedural scene using locally bundled Three.js (MIT). Safety content must be reviewed against local law and the company’s procedures by an appropriate safety reviewer before real use. The simulation does not authorise practical work.
