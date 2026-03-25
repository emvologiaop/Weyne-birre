
# Birr Tracker

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-10b981)](#pwa-and-notifications)
[![License](https://img.shields.io/badge/License-Unspecified-lightgrey)](#license)

A modern personal finance web app built with React, TypeScript, Vite, and Firebase.

Birr Tracker helps users track income, expenses, accounts, budgets, subscriptions, receipts, net worth, and AI-assisted financial insights from a single dashboard.

## Highlights

- Comprehensive finance tracking: accounts, transactions, categories, and budgets
- AI-powered features: advisor chat, receipt insights, and report assistance
- Progress and motivation: achievements and financial goal support
- Analytics pages: dashboard trends, reports, and net worth views
- PWA-ready: installable app with offline readiness hooks and update prompts
- Firebase-based authentication and Firestore data persistence

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Routing: React Router
- Data/query state: TanStack Query
- Backend services: Firebase Auth + Firestore
- UI/UX: Tailwind CSS, Framer Motion, Recharts, Sonner
- AI integration: Mistral AI SDK
- PWA: vite-plugin-pwa

## Project Structure

Key directories and files:

- src/pages: route-level screens (Dashboard, Transactions, Reports, Settings, etc.)
- src/components: reusable UI, layout, modals, providers
- src/lib: Firebase setup, services, hooks, utilities
- src/types: shared TypeScript types
- public: static assets and service worker files
- firebase-applet-config.json: Firebase project configuration used at runtime

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ (or compatible package manager)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a file named .env.local in the project root:

```env
VITE_MISTRAL_API_KEY=your_mistral_api_key
```

### 3) Verify Firebase configuration

The app imports Firebase settings from firebase-applet-config.json.
Ensure this file points to your own Firebase project when developing or deploying.

Required keys include:

- projectId
- appId
- apiKey
- authDomain
- storageBucket
- messagingSenderId
- firestoreDatabaseId

### 4) Run the app

```bash
npm run dev
```

The development server runs on port 3000 by default.

## Available Scripts

- npm run dev: start Vite dev server (host 0.0.0.0, port 3000)
- npm run build: create production build in dist
- npm run preview: preview production build locally
- npm run start: serve the built dist directory
- npm run lint: run TypeScript type-checking (no emit)
- npm run clean: remove dist output

## Data Model (High-Level)

Firestore collections used by the app include:

- users
- accounts
- transactions
- categories
- budgets
- goals
- subscriptions
- achievements
- receipts

If you are migrating from Appwrite, see APPWRITE_SCHEMA.md for reference schema notes.

## PWA and Notifications

- Service worker registration is handled via vite-plugin-pwa.
- The app dispatches update/offline events and shows an update toast when a new version is available.
- Notification permissions are requested in-app to support reminder scheduling.

## Build and Deployment

### Production build

```bash
npm run build
```

### Serve build locally

```bash
npm run start
```

You can deploy the dist output to any static hosting provider (for example Firebase Hosting, Netlify, Vercel, or Cloudflare Pages).

## Screenshots and Demo

Use this section to showcase key flows for users and contributors. Replace the placeholders below with real captures from your current UI.

Suggested files (recommended naming):

- docs/screenshots/dashboard.png
- docs/screenshots/transactions.png
- docs/screenshots/reports.png
- docs/screenshots/mobile-home.png
- docs/gifs/quick-add.gif

Placeholder template:

```md
![Dashboard Overview](docs/screenshots/dashboard.png)
![Transactions Page](docs/screenshots/transactions.png)
![Reports Page](docs/screenshots/reports.png)
![Mobile Home](docs/screenshots/mobile-home.png)

![Quick Add Demo](docs/gifs/quick-add.gif)
```

Capture checklist:

- Desktop: dashboard summary cards + chart
- Desktop: transaction creation/edit flow
- Desktop: reports and AI insights section
- Mobile: navigation + main dashboard readability
- GIF: quick add or recurring transaction workflow

## Contributing

Contributions are welcome. Keep changes focused, tested, and easy to review.

### Workflow

1. Fork and clone the repository.
2. Create a feature branch from main.
3. Install dependencies and run the app locally.
4. Make your changes with clear commits.
5. Run checks before opening a PR.
6. Open a pull request with a concise description and screenshots (if UI changes).

### Local Development Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

### Pull Request Checklist

- Change is scoped to a clear problem or feature
- Type-check passes (npm run lint)
- Production build succeeds (npm run build)
- No secrets or environment keys committed
- README/docs updated when behavior changes
- UI changes include before/after screenshots or GIFs

### Commit and Review Guidance

- Use descriptive commit messages in present tense
- Keep PRs small enough for fast review
- Note any Firebase rule/index assumptions in the PR description
- Call out breaking changes explicitly

## Troubleshooting

- Blank AI responses:
   - Verify VITE_MISTRAL_API_KEY is set and valid.
- Firebase permission errors:
   - Check Firestore security rules and authenticated user context.
- PWA not updating:
   - Reload after update prompt and clear old caches if needed.

## Security Notes

- Do not commit secret keys to source control.
- Use environment variables and provider secret managers in production.
- Restrict Firestore rules to authenticated users with least privilege.

## License

No license file is currently defined in this repository.
Add a LICENSE file if you want to publish with explicit usage terms.
