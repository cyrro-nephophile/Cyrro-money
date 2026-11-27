# Mamoney Hybrid UI & Android Audit

Status: initial repository audit, 27 November 2026  
Target branch: `improve/hybrid-ui-audit`

## Visual direction

Mamoney uses the **Hybrid** design direction:
- Minimalist layout and clear information hierarchy as the foundation.
- Glass/blur effects only as restrained accents; avoid expensive full-screen blur.
- Modern, readable typography and stronger contrast.
- Smooth, short transitions that respect Android's Reduce Motion setting.
- Mobile-first layouts with safe areas and one-hand reachability.

## Initial findings

### Fixed in this branch
- [x] Corrected the backup date validator in `src/main.js`. The date pattern was double-escaped, so valid ISO dates could be rejected during restore.

### High priority

1. **Backup import/export**
   - Export currently uses a browser-created Blob URL and an anchor download, then revokes the URL immediately.
   - Import currently uses a hidden HTML file input.
   - Android should use the Storage Access Framework / Android document picker so the user chooses the destination or source file.
   - Keep restore as replace-all, validate the full backup before writing, and preserve the current database if validation or the transaction fails.
   - Add tests for valid dates, invalid calendar dates, malformed JSON, duplicate IDs, references, and failed atomic restore.

2. **PDF report**
   - No PDF export implementation is currently present.
   - Add a locally generated PDF report with period and wallet filters, income/expense/net summary, transaction detail, and budget summary when applicable.
   - Save/share through Android's document picker or share sheet. No cloud upload.

3. **Navigation and motion**
   - Main navigation currently switches page state and replaces `#view` immediately.
   - Existing CSS contains several appended motion overrides and duplicate selectors. Consolidate these into a small tokenized motion layer before adding more effects.
   - Add a subtle enter/exit transition between the four primary pages; avoid animating layout-heavy properties.
   - Preserve `prefers-reduced-motion` behavior and avoid expensive backdrop filters on lower-powered devices.

4. **Typography and contrast**
   - Current CSS uses Inter with system fallbacks, but many labels and supporting text are set to 11–12px.
   - Establish a consistent type scale with comfortable body text, tabular numerals, and scalable text.
   - Review muted text and semantic colors in both themes against WCAG AA contrast targets. Color must not be the only status indicator.

5. **Android compatibility**
   - Verify status/navigation bar appearance, safe areas, system back behavior, keyboard resizing, document picker, share sheet, and app resume behavior.
   - Test at narrow widths and with enlarged system font/display size.
   - Confirm minimum Android version and Capacitor plugin compatibility before adding native dependencies.

### Medium priority

- Add accessible labels and current-page state to navigation.
- Raise interactive targets to at least 44–48 dp where practical.
- Audit dialog focus, keyboard navigation, and scroll locking.
- Add graceful handling for unavailable IndexedDB and storage quota failures.
- Revisit service worker cache strategy so failed asset requests never fall back to the HTML document.

## Implementation sequence

1. Fix data integrity and backup/restore defects; add focused tests.
2. Consolidate CSS tokens and typography/contrast rules.
3. Add accessible page transitions and interaction polish.
4. Implement Android document picker for JSON backup.
5. Implement local PDF generation and Android share/save.
6. Test Android compatibility and run the full build/test suite.

## QA checklist

- [ ] Existing local data remains intact after app update.
- [ ] Valid backup imports; malformed/unsupported backups are rejected.
- [ ] Restore replaces all data atomically and confirms before replacement.
- [ ] JSON export is saved to a user-selected location.
- [ ] PDF report is generated and can be saved/shared.
- [ ] All four navigation destinations work repeatedly without stuck overlays.
- [ ] Dark/light/system themes remain readable.
- [ ] Reduced motion disables nonessential animations.
- [ ] Keyboard does not obscure form actions.
- [ ] System Back closes the topmost modal before navigating away.
- [ ] APK builds and is manually tested on the target Android device.

This audit is a starting point, not a claim that every item has been fully tested or fixed.
