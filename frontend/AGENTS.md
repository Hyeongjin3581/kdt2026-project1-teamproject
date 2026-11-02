# oncare_frontend

React + Vite + Tailwind CSS frontend for OnCare. It talks to the Spring backend at `http://localhost:8080`. The project was scaffolded in Figma Make, but it now runs locally.

## Package Manager

This project uses **npm**. Install dependencies with `npm install` and run the dev server with `npm run dev`. Do not use pnpm or yarn, and keep `package-lock.json` as the only lockfile.

## Development Server

The dev server is not started automatically. Run `npm run dev` to start it.

- Dev server: `http://localhost:5173` (`strictPort`, so it fails instead of switching ports if 5173 is taken)
- Backend: start the backend on `localhost:8080` first, or API calls will fail
- Proxy: `vite.config.js` forwards `/api`, `/user`, `/center`, `/request`, and `/careworkerreport` to `localhost:8080`. Many screens also call `http://localhost:8080/...` directly.
- Build check: `npm run build`

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.jsx` - React entrypoint; imports `src/index.css` and mounts `src/App.jsx` inside `BrowserRouter` into the `#root` element
- `src/App.jsx` - Login state and role-based routes (`/login`, `/signup`, `/admin`, `/guardian`, `/caregiver`)
- `src/features/` - Screens grouped by role: `admin`, `guardian`, `caregiver`, `auth` (login/signup), `chat` (STOMP chat)
- `src/components/common/` - Shared UI components (modals, badges, panels, selects)
- `src/context/` - React context (`CenterContext`)
- `src/utils/` - API response adapters per role (`adminAdapters`, `guardianAdapters`, `caregiverAdapters`) and date/time helpers
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.jsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.js` - Vite configuration with React, Tailwind CSS v4, the backend proxy, Figma Make plugins, and the `@` alias for `src`
- `jsconfig.json` - Editor path alias (`@/*` → `src/*`)
- `.figma/make/site.json` - Page title and meta settings read by `vite.config.js`; do not delete
- `.mise.toml` - Toolchain version for Node.js

## Dependencies

- Runtime: React 19, React DOM 19, React Router 7
- HTTP / realtime: axios, `@stomp/stompjs`
- Charts: recharts
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8 and `@vitejs/plugin-react`
- Formatting: oxfmt

## Backend API

- Use camelCase names for request query params and body fields (e.g. `careRecipientNo`, `centerNo`, `requestNo`), matching the backend controllers.
- For DELETE requests that take an id, send it as a query param (`params: { ... }`), not in the body.

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.js`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.jsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- The code is JavaScript (`.jsx` / `.js`). Do not add TypeScript files.
- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
