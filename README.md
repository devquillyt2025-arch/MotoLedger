# Moto Ledger

Personal fuel / service / accessory tracker. Next.js 14 (App Router) + Neon Postgres + Drizzle. No auth.

## Setup

```bash
npm install
cp .env.example .env.local      # put your Neon connection string in DATABASE_URL
npm run db:push                 # drizzle-kit push: creates the entries + reminders tables
npm run dev                     # http://localhost:3000
```

The three default reminders (Chain Lube 500 km / 15 days, Full Service 3000 km / 90 days,
Battery Charge 30 days) are seeded on first load, using today's date and the latest odometer reading as "last done".

## Deploy to Vercel

1. Import the GitHub repo in Vercel (framework preset: Next.js, no build settings needed).
2. Add `DATABASE_URL` under **Settings → Environment Variables** (or add the Neon integration, which sets it).
   Use the **pooled** connection string (host contains `-pooler`).
3. Deploy. Tables must already exist: run `npm run db:push` locally against the same database first.

There is no login, so anyone with the URL can add or delete entries. Turn on
**Settings → Deployment Protection** (Vercel Authentication) if that matters.

## API

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/entries` | All entries oldest-first, with `seq` (#1, #2 per type) and `runningTotal` (per type) |
| POST | `/api/entries` | `{ type, date, amount, odometer?, category, notes? }` |
| GET | `/api/summary` | Dashboard card stats |
| GET | `/api/reminders` | `{ currentOdometer, reminders[] }` with `nextDueDate`, `daysLeft`, `kmLeft`, `status` |
| PATCH | `/api/entries/:id` | Same body as POST; replaces the entry |
| DELETE | `/api/entries/:id` | |
| PATCH | `/api/reminders/:id/mark-done` | `{ date?, odometer? }`; defaults to today and the latest odometer |
| PATCH | `/api/reminders/:id` | `{ intervalKm?, intervalDays? }`; `null` clears one |

## Profiles

Several riders (each with one bike) can share the app. Switch, add, rename or delete profiles from the
avatar (top-right on phones, under the logo on desktop). Every entry, reminder and odometer reading belongs
to one profile; deleting a profile deletes its data. The active profile is remembered per device in a
cookie. Profiles are not password-protected.

## Notes

- "Current odometer" is the highest reading on any entry or reminder, so log the odometer on refuels to keep km-based reminders accurate.
- Est. fuel and mileage assume ₹102/L (`FUEL_PRICE_PER_LITRE` in `src/lib/constants.ts`).
- Status colours: red = overdue, yellow = within 3 days or 50 km, green = OK.
