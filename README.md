# Istedama Platform — منصة استدامة

A production-grade MERN application for Oman's SME sustainability initiative. Omani SMEs register their business, submit sustainability data, receive an **Istedama Score**, earn an official Sustainability Certificate, and discover location-based banking and consulting partners.

---

## Table of contents

- [Stack](#stack)
- [Directory structure](#directory-structure)
- [Quick start (Docker)](#quick-start-docker)
- [Quick start (local development)](#quick-start-local-development)
- [Environment variables](#environment-variables)
- [The Istedama Score](#the-istedama-score)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Testing](#testing)
- [Design system](#design-system)
- [Accessibility](#accessibility)
- [Publishing to GitHub](#publishing-to-github)

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router 6, Tailwind CSS, Framer Motion, Recharts, Leaflet / react-leaflet, lucide-react |
| Backend | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, express-validator, Helmet |
| Database | MongoDB 7 |
| Testing | Vitest + React Testing Library (client), Jest (server) |
| DevOps | Docker, docker compose, nginx |

> **Note on the test runner.** The client uses **Vitest**, which implements the same `describe / test / expect` API as Jest and works with React Testing Library unchanged. It's the standard choice for Vite projects and avoids a separate Babel transform pipeline. The server uses Jest directly. If your assignment requires the literal `jest` binary on the client, swap in `jest` + `@babel/preset-react` — the test files themselves need no changes.

---

## Directory structure

```
istidamah-platform/
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js             # Axios instance + JWT interceptor
│   │   ├── assets/
│   │   │   └── logo.png
│   │   ├── components/
│   │   │   ├── AccessibilityWidget.jsx   # Floating a11y panel (bottom-left)
│   │   │   ├── ChatbotWidget.jsx         # Istedama Assistant (bottom-right)
│   │   │   ├── Footer.jsx
│   │   │   ├── LocationPicker.jsx        # Leaflet click-to-pin picker
│   │   │   ├── Navbar.jsx                # Search, language, notifications, auth
│   │   │   ├── PartnerFinder.jsx         # Map + filterable partner list
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ScoreSeal.jsx             # Signature certificate seal
│   │   │   ├── SectionHead.jsx
│   │   │   └── StatCard.jsx
│   │   ├── context/
│   │   │   ├── AccessibilityContext.jsx
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Companies.jsx        # Directory + search + governorate filter
│   │   │   ├── CompanyDetail.jsx    # Score, breakdown chart, certificate
│   │   │   ├── CompanyRegister.jsx  # Full form-control showcase
│   │   │   ├── Dashboard.jsx        # Recharts bar + line + stat cards
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── About.jsx            # Mandate, method, governance
│   │   │   ├── Contact.jsx          # Channels + enquiry form
│   │   │   ├── Partners.jsx
│   │   │   └── Register.jsx
│   │   ├── tests/
│   │   │   ├── Dashboard.test.jsx          # Component rendering
│   │   │   ├── Navbar.test.jsx             # Navigation
│   │   │   ├── RegistrationForm.test.jsx   # Forms
│   │   │   ├── ScoreCalculation.test.jsx   # Score calculations
│   │   │   └── setupTests.js
│   │   ├── utils/
│   │   │   └── scoring.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile                   # Multi-stage build → nginx
│   ├── nginx.conf                   # SPA fallback + asset caching
│   ├── index.html
│   ├── tailwind.config.js           # Design tokens
│   ├── postcss.config.js
│   └── vite.config.js
│
├── server/                          # Express API
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── companyController.js
│   │   │   └── evaluationController.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # protect + authorize(role)
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── Company.js
│   │   │   ├── Evaluation.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── companyRoutes.js
│   │   │   └── evaluationRoutes.js
│   │   ├── utils/calculateScore.js  # Istedama Score business logic
│   │   ├── seed.js                  # 5 Omani SMEs + 5 evaluations
│   │   └── server.js
│   ├── tests/calculateScore.test.js
│   └── Dockerfile
│
├── docker-compose.yml               # client + server + mongo
├── package.json                     # Convenience scripts
├── .gitignore
└── README.md
```

---

## Quick start (Docker)

The fastest path — no local Node or MongoDB required.

```bash
git clone https://github.com/<your-username>/istidamah-platform.git
cd istidamah-platform

docker compose up --build
```

Then seed the database (in a second terminal, while the stack is running):

```bash
docker compose exec server npm run seed
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |
| MongoDB | mongodb://localhost:27017/istidamah |

**Seeded demo accounts** (created by `npm run seed`, one per role):

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@istidamah.om` | `ChangeMe123!` |
| SME owner | `owner@istidamah.om` | `Owner123!` |
| Merchant | `merchant@istidamah.om` | `Merchant123!` |
| Auditor | `auditor@istidamah.om` | `Auditor123!` |

These are **not** shown anywhere in the UI. Seeding is idempotent — re-running it keeps existing users rather than resetting passwords. **Change all four before deploying anywhere public.**

Stop everything with `docker compose down` (add `-v` to also drop the database volume).

---

## Quick start (local development)

Requires Node.js 20+ and a running MongoDB instance.

```bash
# 1. Install dependencies for both workspaces
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env — set MONGO_URI to mongodb://localhost:27017/istidamah
# and replace JWT_SECRET with a real secret

# 3. Seed the database
npm run seed

# 4. Run both dev servers (two terminals)
npm run dev:server     # → http://localhost:5000
npm run dev:client     # → http://localhost:5173
```

---

## Environment variables

**`server/.env`**

| Variable | Purpose | Example |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `development` |
| `PORT` | API port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/istidamah` |
| `JWT_SECRET` | Token signing secret — **change this** | `a-long-random-string` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

**`client/.env`**

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_URL` | API base URL | `http://localhost:5000/api` |

Vite inlines env vars at build time, so the Docker image takes `VITE_API_URL` as a **build arg** (see `docker-compose.yml`). Change it there if you deploy the API to a different host.

---

## The Istedama Score

The composite score is calculated **server-side only**, on every create and update of an evaluation. A client-submitted score is never trusted or persisted.

```
Score = (Omanization Rate × 0.4)
      + (Financial Stability Index × 0.3)
      + (ICV Contribution × 0.3)
```

All three inputs are percentages on a 0–100 scale. The result is clamped to `[0, 100]` and rounded to two decimals.

- **Omanization Rate** is derived, not entered — it's computed from `omaniEmployeeCount / employeeCount` on the company record and snapshotted onto the evaluation at scoring time, so historical scores stay accurate even if staffing later changes.
- **Certification threshold:** a score of **70 or above** automatically issues a Sustainability Certificate with a generated serial (`IST-XXXXXX-XXXXX`).

Implementation lives in `server/src/utils/calculateScore.js`. The client keeps a mirror of the formula in `client/src/utils/scoring.js` for instant preview only.

---

## API reference

Base URL: `http://localhost:5000/api`

Protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | — | Create an account, returns JWT |
| `POST` | `/auth/login` | — | Authenticate, returns JWT |
| `GET` | `/auth/me` | ✅ | Current user profile |

### Companies

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/companies` | — | List with `?search=`, `?governorate=`, `?page=`, `?limit=` |
| `GET` | `/companies/:id` | — | One company + its latest evaluation |
| `GET` | `/companies/stats/overview` | — | Totals, governorate breakdown, avg Omanization |
| `POST` | `/companies` | ✅ | Register an SME (validated) |
| `PUT` | `/companies/:id` | ✅ | Update a company |
| `DELETE` | `/companies/:id` | ✅ | Delete a company and its evaluations |

### Evaluations

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/evaluations` | — | List, optionally `?companyId=` |
| `GET` | `/evaluations/:id` | — | One evaluation (company populated) |
| `POST` | `/evaluations` | ✅ | Create — **runs scoring before saving** |
| `PUT` | `/evaluations/:id` | ✅ | Update — **re-runs scoring** |
| `DELETE` | `/evaluations/:id` | ✅ | Delete |

**Example — create an evaluation**

```bash
curl -X POST http://localhost:5000/api/evaluations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "companyId": "665f1a...",
    "icvPercentage": 68,
    "financialStabilityIndex": 74,
    "auditorNotes": "Strong local sourcing."
  }'
```

Every response follows a consistent envelope:

```json
{ "success": true, "data": { } }
{ "success": false, "message": "Validation failed", "details": ["crNumber: must be 4-10 digits"] }
```

---

## Data model

Two connected collections in a single database, plus a `users` collection for auth.

### `companies`

| Field | Type | Notes |
| --- | --- | --- |
| `companyName` | String | Required, 2–150 chars |
| `crNumber` | String | Required, **unique**, 4–10 digits |
| `governorate` | String | Enum of Oman's 11 governorates |
| `sector` | String | Defaults to `General Trading` |
| `employeeCount` | Number | Min 1 |
| `omaniEmployeeCount` | Number | Validated ≤ `employeeCount` |
| `hasRiyadaCard` | Boolean | Riyada SME card holder |
| `registrationDate` | Date | Defaults to now |
| `location` | Object | `{ lat, lng, address }`, range-validated |
| `contactEmail` | String | Format-validated |
| `owner` | ObjectId → `User` | |
| `omanizationRate` | *virtual* | `omaniEmployeeCount / employeeCount × 100` |

A text index on `companyName` + `crNumber` powers directory search.

### `evaluations`

| Field | Type | Notes |
| --- | --- | --- |
| `companyId` | ObjectId → `Company` | **The connection between the two schemas** |
| `auditorNotes` | String | Max 2000 chars |
| `icvPercentage` | Number | 0–100 |
| `financialStabilityIndex` | Number | 0–100 |
| `omanizationRateSnapshot` | Number | Captured at scoring time |
| `calculatedScore` | Number | Written by the server, never the client |
| `certificateIssued` | Boolean | True when score ≥ 70 |
| `certificateSerial` | String | Generated on issue |
| `evaluationDate` | Date | |
| `evaluatedBy` | ObjectId → `User` | |

### Seed data

`server/src/seed.js` inserts 5 realistic Omani SMEs across different governorates and sectors — agritech in Nizwa, marine logistics in Muscat, a frankincense cooperative in Salalah, solar in Sohar, and adventure tourism in Khasab — each with a matching evaluation. Every seeded evaluation is passed through the real scoring function, so the data is always internally consistent.

```bash
npm run seed              # import
npm --prefix server run seed:destroy   # wipe all collections
```

---

## Testing

```bash
npm test                     # both suites
npm --prefix server test     # Jest  — 70 tests
npm --prefix client test     # Vitest — 70 tests across 13 files
```

The four required categories are covered:

| Category | File | What it asserts |
| --- | --- | --- |
| **Score calculations** | `client/src/tests/ScoreCalculation.test.jsx` | The weighted formula returns 71 for (80, 70, 60); the 70-point certification boundary is inclusive |
| **Navigation** | `client/src/tests/Navbar.test.jsx` | All four primary nav links render; the company search input is present |
| **Forms** | `client/src/tests/RegistrationForm.test.jsx` | Required fields render; submission is blocked with a visible error until location and the accuracy checkbox are set |
| **Component rendering** | `client/src/tests/Dashboard.test.jsx` | Stat cards render real values once mocked API data resolves |
| **Localisation** | `client/src/tests/Language.test.jsx` | Switching to Arabic translates nav labels, flips `dir` to `rtl`, and persists the choice |
| **Bilingual data** | `client/src/tests/Bilingual.test.jsx` | Database-sourced names, sectors and governorates switch language, and records lacking an Arabic field fall back to English |

The server suite (`server/tests/calculateScore.test.js`) independently verifies the formula, clamping and rounding at the 0/100 edges, that non-numeric input throws rather than silently yielding `NaN`, and the certificate threshold gate.

Two notes on the test setup: `setupTests.js` polyfills `IntersectionObserver` and `ResizeObserver`, which jsdom lacks but Framer Motion's `whileInView` and Recharts' `ResponsiveContainer` both require. And `RegistrationForm.test.jsx` mocks `LocationPicker`, since Leaflet needs a real layout engine — keeping that test fast and focused on form logic.

---

## Design system

The direction is **soft portal**, matching the reference estidamah screens: a pale lavender-blue ground, white content blocks with generous radii, deep brand navy for headings and primary actions, and the brand orange reserved for accents, status pills and the eyebrow dots.

| Token | Hex | Role |
| --- | --- | --- |
| `canvas` / `mist` | `#EFF2FC` / `#F6F8FE` | Page ground and quiet fills |
| `surface` | `#FFFFFF` | Content blocks and cards |
| `rule` | `#E4E9F7` | Hairline borders |
| `navy-700` | `#223E98` | Brand navy, sampled from the logo wordmark |
| `navy-900` | `#101F52` | Headings, impact band, footer |
| `gold-500` | `#EC9D51` | Brand orange, sampled from the logo check |
| `teal-500` | `#3D8A72` | Certified state |
| `ink` / `ink-muted` | `#1A2340` / `#5C6684` | Body and secondary text |

**Typography — Tajawal** across both scripts, so the interface keeps one voice when the user switches language.

**Layout.** The navigation is a floating rounded pill that tightens on scroll, with secondary destinations grouped under a Services dropdown. Sections sit inside large white blocks on the lavender ground. Ambient colour blooms and drifting sparkles (`Decor.jsx`) sit behind everything, hidden from assistive technology and disabled under reduce-motion.

**Signature element — `ScoreSeal`.** The Istedama Score as a stamped certificate rosette; the ring is a progress arc and a notch marks the 70-point threshold. Gold below the threshold, teal at or above it.

## Motion

All movement pulls from one vocabulary in `client/src/motion/presets.js` — a single easing curve (`[0.22, 1, 0.36, 1]`) and shared `fadeUp`, `scaleIn`, `stagger` and `slideFromEdge` variants. That is what keeps a site with this much animation feeling coordinated rather than noisy.

Applied as: a staggered hero entrance with a drawn underline stroke, scroll reveals on every section, hover lift on all interactive cards, weight bars that fill on scroll, statistics that count up when they enter view, a layout-animated indicator under the active nav item, dropdown and mobile-menu transitions, and gently floating hero chips.

Every one of these is suppressed by the accessibility panel's reduce-motion switch and by `prefers-reduced-motion`.


## Accessibility

The accessibility widget is deliberately broader than a contrast toggle, because the programme serves the general public.

**Read-aloud (text to speech).** Built on the browser's own `SpeechSynthesis`, so nothing is sent to a server and no API key is needed. Three modes: read the whole page, read one element on demand, or hover-to-read — while that mode is on, pointing at or keyboard-focusing any text element speaks it, and the element gets a dashed outline so the behaviour is discoverable rather than invisible. The utterance language follows `<html lang>`, so Arabic content is read with an Arabic voice when the operating system provides one. Speech stops automatically when the tab is hidden or the feature is switched off mid-sentence.

**Other controls.** High contrast, link highlighting, four text-size steps, a large-cursor mode, a readable-font mode, and a reduce-motion switch that disables the interface animations independently of the OS setting. Every preference persists to `localStorage`.

**Baseline.** Semantic landmarks, labelled controls, `aria-label` on icon-only buttons, `role="switch"` with `aria-checked` on toggles, `role="dialog"` on floating panels, visible focus rings throughout, and `prefers-reduced-motion` respected globally.


## Publishing to GitHub

```bash
cd istidamah-platform

git init
git add .
git commit -m "feat: Istedama Platform — MERN sustainability & ICV scoring portal"

git branch -M main
git remote add origin https://github.com/<your-username>/istidamah-platform.git
git push -u origin main
```

Before the first push, confirm no secrets are staged — `.env` files are already ignored at the root and in both workspaces:

```bash
git status --short
git check-ignore -v server/.env    # should report a match
```

If you later change `JWT_SECRET` in a committed file by mistake, rotate the secret rather than only amending the commit.

---

## Where to take it next

- Wire `ChatbotWidget`'s `answerQuery` to a real LLM endpoint — the local knowledge base is a drop-in placeholder with the same signature.
- Persist uploaded CR certificates and financials to S3 or GridFS; the upload UI is built but currently client-side only.
- Add an auditor console for creating evaluations from the UI (the API endpoints already exist and are role-guarded).
- Code-split the Leaflet and Recharts bundles with dynamic `import()` — the production build currently ships one ~960 kB chunk.
- Wire the Contact enquiry form to a real mail transport; it currently simulates dispatch and says so in the UI.

---

## License

MIT
