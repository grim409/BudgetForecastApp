# Budget Forecast

A mobile-first cash-flow planner built with Expo and React Native. It turns a starting balance, recurring income and expenses, and planned purchases into a daily or monthly balance forecast.

**[Open the web demo](https://budget-forecast-demo.vercel.app)**

The demo starts with sample data, so the chart is useful on the first visit. Anyone can explore it: changes stay in the current browser and are never uploaded. Use **Settings → Reset sample budget** to restore the example.

Signing in as the owner switches the same interface to a private budget stored in Supabase and synced across devices.

## What it does

- Forecasts balances from one week through one year
- Handles daily, weekly, monthly, and yearly recurring items
- Supports optional end dates for fixed-term income or expenses
- Includes planned one-time purchases in the forecast
- Lets users edit every sample item and starting balance
- Runs on iOS, Android, and the web from one React Native codebase

## Two modes

| | Signed out (demo) | Signed in as the owner |
| --- | --- | --- |
| Data | sample budget | the owner's real budget |
| Storage | browser only | Supabase Postgres |
| Persistence | until browser data is cleared | permanent, synced across devices |
| Who | anyone | one approved account |

The two never mix. State is tagged with the source it was loaded from and is only ever written back to that same source, so demo edits cannot reach the database and private data is not copied into browser storage.

## Security model

The web build is a static export with no server of its own, so **row-level security in Postgres is the authorization boundary**. Policies on `budget_forecast_budgets` require both `auth.uid()` to match the row and the verified JWT email to equal the owner address; anonymous roles hold no grants on the table at all. The owner check in the interface is a convenience, not a control.

This was verified by execution rather than by reading the policies: the owner can read and write their row; a second registered account, a plus-addressed alias of the owner, and a forged email claim on the owner's user id are all denied; anonymous access fails on privileges before policies are even evaluated.

Only the project URL, the publishable key, and the owner address reach the browser. See `.env.example`.

## Engineering notes

The forecast rules live in `src/lib/forecast.ts`, outside React and React Native. Tests cover recurrence normalization, planned-purchase timing, and recurrence end dates.

This version deliberately stores data locally. The original prototype used unauthenticated Firestore document links as shared-budget credentials. Removing that backend made the public demo safer and eliminated the need to publish configuration or maintain permissive database rules. Production synchronization would require real authentication and per-user authorization.

## Run locally

Use Node.js 22.13+ on the 22.x LTS line, or Node.js 24.3+.

```bash
npm install
npm run web
```

The app runs in demo mode with no configuration. To enable private mode, copy `.env.example` to `.env.local` and fill in your Supabase project values, then apply `supabase/migrations/` to that project.

Other targets:

```bash
npm run android
npm run ios
```

## Verify

```bash
npm run check
npx expo-doctor
```

`npm run check` runs TypeScript, the Vitest suite, and a production web export.

## Stack

- Expo SDK 57
- React Native 0.86 and React 19
- TypeScript
- React Navigation
- AsyncStorage
- Supabase (auth and Postgres)
- date-fns
- Vitest

## License

[MIT](LICENSE)
