# Cyrro Money

A private, offline-first personal finance tracker for Android and the browser.

## Status
This is the starter application shell. Finance features will be added incrementally. Never commit real financial records or backup files.

## Stack
- Vanilla JavaScript + Vite
- PWA shell for browser preview and offline app-shell caching
- IndexedDB for browser-local test data
- Capacitor for Android packaging
- SQLite adapter planned for native Android persistence
- GitHub Actions for checks and Android APK builds
- Vercel for browser preview deployments

## Requirements
- Node.js 22+
- npm 10+
- Android Studio + Android SDK for local Android builds

## Local development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```
Production output is generated in `dist/`.

## Capacitor / Android
```bash
npx cap add android
npm run build
npx cap sync android
npx cap open android
```
Build a debug APK in Android Studio or use the GitHub Actions workflow **Android APK**.

## Vercel
Import this private GitHub repository into Vercel.

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- Production branch: `main`

Pull Requests and non-production branches should create Preview Deployments.

## Data and privacy rules
- Browser transactions belong in IndexedDB, never Cache Storage.
- Cache Storage is only for static app assets / app shell.
- Android user data must stay in app-private storage.
- No analytics, advertising, remote sync, or login without an explicit product decision.
- Never commit backups, database files, signing keys, passwords, or real personal finance data.
- Store Rupiah amounts as integer values. Never use floating-point arithmetic for money.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
