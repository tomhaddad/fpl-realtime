### FPL Realtime App

This application will poll the FPL API, and output the "realtime" state of each team, based on an inputted league ID.

The reason for building this was partly to out of impatience waiting for the league tables to update during a game week, and as an excuse to try out Svelte.

## Developing

Once you've installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.
