# Requirements coverage

An honest audit of the platform against the stated requirements. Written so
nothing has to be discovered by clicking around.

Legend: **Done** · **Partial** · **Not started**

---

## 1. Public portal

| Item | State | Notes |
| --- | --- | --- |
| Bilingual UI (AR/EN) | **Done** | 497 keys, verified identical in both languages; full RTL |
| Services | **Done** | Facilities, discounts, directory, advertising |
| Investment opportunities | **Done** | Tenders module with categories and statuses |
| News | **Done** | Newsroom with tag filtering |
| Strategic partners | **Done** | Interactive Oman map with real partner logos, taken from the reference project you supplied |
| **Events** | **Not started** | No events model or calendar |
| Service catalogue | **Done** | 32 services in 9 categories at `/services`, each labelled available or planned |

## 2. Onboarding

| Item | State | Notes |
| --- | --- | --- |
| Register individuals / companies / institutions | **Done** | `accountType` on the user model, validated server-side |
| Email verification by OTP | **Done** | `POST /api/auth/send-code`, `POST /api/auth/verify-code` |
| Strong credential policy | **Done** | Shared rules, enforced on both sides |
| Document upload | **Partial** | The UI collects file names; **bytes are not stored anywhere**. Needs object storage before it is real |
| SMS OTP | **Not started** | Adapter interface exists (`utils/notify.js`), no gateway |

**On the OTP implementation.** Codes are stored as SHA-256 hashes, never plain
text. They expire in ten minutes, are single-use, and are capped at five
attempts to stop a six-digit code being brute-forced. Comparison is
constant-time. `send-code` answers identically for known and unknown addresses
so it cannot be used to enumerate accounts.

**No mail is actually sent.** `utils/notify.js` reports `delivered: false` and
logs the message instead of pretending. In development the code is returned in
the API response so the flow is testable end to end; in production that never
happens. Wire a real SMTP transport into `sendEmail` and every caller keeps
working unchanged.

## 3. Business opportunities

| Item | State | Notes |
| --- | --- | --- |
| Browse and search opportunities | **Done** | Filter by category and status |
| Apply electronically | **Done** | `POST /api/applications` |
| Track application status | **Done** | Six-state lifecycle with an append-only audit trail |

Statuses: `submitted → under_review → shortlisted → accepted / rejected`, with
`withdrawn` reachable from any live state. Transitions are enforced server-side,
so an application cannot skip review. Applicants may only withdraw; moving an
application forward is a staff action. Applicants see only their own records —
enforced against the stored `applicant`, and a foreign id returns 404 rather
than 403 so other applications are not revealed to exist.

## 4. Facility booking

| Item | State | Notes |
| --- | --- | --- |
| Book halls and rooms | **Done** | Pricing computed server-side from rate × duration |
| Booking status tracking | **Done** | Admin can confirm or cancel |
| **Interactive calendar** | **Not started** | Booking is a form; there is no availability calendar and **no double-booking check** |

## 5. Promotions and advertisements

| Item | State | Notes |
| --- | --- | --- |
| Submit ad requests | **Done** | Price computed server-side from the published rate card |
| Admin review and publish | **Done** | `PATCH /api/admin/advertisements/:id/status` |
| Campaigns and discounts | **Done** | Partner discounts by category |

## 6. CMS and admin dashboard

| Item | State | Notes |
| --- | --- | --- |
| User management | **Done** | Search, filter, change role, suspend, delete |
| RBAC | **Done** | Four roles, route-level guards, role-specific dashboards |
| Statistics | **Partial** | Overview and charts exist; no exportable reports |
| **Content management** | **Not started** | Tenders, news, facilities and discounts are seeded, not editable through the UI |

## 7. Integrations

| Item | State | Notes |
| --- | --- | --- |
| **Thawani Pay** | **Not started** | No payment flow at all |
| **SMS gateway** | **Not started** | Adapter interface only |
| Email | **Partial** | Adapter interface, no transport |
| Maps | **Partial** | Uses Leaflet/OpenStreetMap, not Google Maps |
| Google Analytics | **Not started** | |
| ODP hosting / PDPL | **Not started** | Deployment concern; see below |

---

## The stack conflict

The requirements specify **PostgreSQL**. The platform is built on **MongoDB
with Mongoose** — 6 models, 6 controllers and every query.

This is not an addition, it is a rewrite of the whole data layer. It needs a
deliberate decision, because a hurried migration would break working
functionality for no visible gain:

- **Option A — migrate.** Sequelize or Prisma, redefine every model with real
  foreign keys, rewrite the aggregation pipelines as SQL, remigrate the seed.
  A relational schema genuinely suits this domain better: applications,
  bookings and evaluations are all join-heavy.
- **Option B — keep MongoDB** and record the deviation. Everything works today.

I have not started this, because starting it halfway is the worst outcome.

**ODP hosting and PDPL** are deployment concerns rather than code. The
application is already containerised, so it can run at ODP; what it needs is
a data-residency review, retention policy and a privacy notice.

---

## Suggested order of work

1. Thawani Pay — bookings and adverts already compute a price with nothing to charge against.
2. Document storage — onboarding collects file names but keeps no files.
3. Booking calendar with a double-booking check — the current gap allows two confirmed bookings in one slot.
4. CMS so content stops depending on `npm run seed`.
5. Events module.
6. The PostgreSQL decision.
