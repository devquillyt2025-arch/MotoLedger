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

## API

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/entries` | All entries oldest-first, with `seq` (#1, #2 per type) and `runningTotal` (per type) |
| POST | `/api/entries` | `{ type, date, amount, odometer?, category, notes? }` |
| GET | `/api/summary` | Dashboard card stats |
| GET | `/api/reminders` | `{ currentOdometer, reminders[] }` with `nextDueDate`, `daysLeft`, `kmLeft`, `status` |
| PATCH | `/api/reminders/:id/mark-done` | `{ date?, odometer? }`; defaults to today and the latest odometer |
| PATCH | `/api/reminders/:id` | `{ intervalKm?, intervalDays? }`; `null` clears one |

## Notes

- "Current odometer" is the highest reading on any entry or reminder, so log the odometer on refuels to keep km-based reminders accurate.
- Est. fuel and mileage assume ₹102/L (`FUEL_PRICE_PER_LITRE` in `src/lib/constants.ts`).
- Status colours: red = overdue, yellow = within 3 days or 50 km, green = OK.
