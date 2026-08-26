# Budget Forecast

A mobile-first cash-flow planner built with Expo and React Native. It turns a starting balance, recurring income and expenses, and planned purchases into a daily or monthly balance forecast.

**[Open the web demo](https://budget-forecast-demo.vercel.app)**

The demo starts with sample data, so the chart is useful on the first visit. Changes stay on the current device through AsyncStorage. Use **Settings → Reset sample budget** to restore the example.

## What it does

- Forecasts balances from one week through one year
- Handles daily, weekly, monthly, and yearly recurring items
- Supports optional end dates for fixed-term income or expenses
- Includes planned one-time purchases in the forecast
- Lets users edit every sample item and starting balance
- Runs on iOS, Android, and the web from one React Native codebase

## Engineering notes

The forecast rules live in `src/lib/forecast.ts`, outside React and React Native. Tests cover recurrence normalization, planned-purchase timing, and recurrence end dates.

This version deliberately stores data locally. The original prototype used unauthenticated Firestore document links as shared-budget credentials. Removing that backend made the public demo safer and eliminated the need to publish configuration or maintain permissive database rules. Production synchronization would require real authentication and per-user authorization.

## Run locally

Use Node.js 22.13+ on the 22.x LTS line, or Node.js 24.3+.

```bash
npm install
npm run web
```

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
- date-fns
- Vitest

## License

[MIT](LICENSE)
