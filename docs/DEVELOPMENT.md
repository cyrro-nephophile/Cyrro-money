# Development workflow

## Branch strategy
- `main`: stable production-ready baseline.
- `feature/<short-name>`: feature work.
- `fix/<short-name>`: bug fixes.
- Open a Pull Request into `main`; review the diff and ensure checks pass before merging.

## GitHub
1. Keep the repository private.
2. Commit source and workflow files; never commit real transaction data or signing secrets.
3. GitHub Actions runs checks for pushes and Pull Requests.
4. Android APK workflow can be started manually or from a version tag.

## Vercel
Connect the GitHub repository to Vercel:
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Production branch: `main`

Each Pull Request should receive a Preview Deployment. The preview is for UI and browser-storage testing, not a substitute for Android device testing.

## Capacitor
Generate the native project:

```bash
npx cap add android
npm run build
npx cap sync android
```

After changing web assets or Capacitor plugins, run `npx cap sync android` again.

## Quality gates
- Unit tests for balance calculations and transfer invariants.
- Validation for positive integer amounts and account references.
- Import/restore validation and atomicity tests.
- Manual browser and Android smoke tests before release.
