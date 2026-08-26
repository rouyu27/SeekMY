# SeekMY GitHub Upload Plan
## Rules
- `main` contains stable shared foundation/config and merged module code.
- Member module work is developed on that member branch and merged by Pull Request.
- `src/app/App.tsx` is owned/integrated by **LIM ROU YU** but is a **main integration file**.
- Firebase setup (`src/firebase.ts`, Firestore/Storage rules and primary Firebase integration) is owned by **WONG YUE SHAN**.
- UI foundation and package/config files are **MAIN / TEAM SHARED**. They are distributed only as maintenance/checking assignments so the workload is balanced.
- `.env.local` is included in this ZIP because the team requested it, but it contains credentials and remains in `.gitignore`; do **not** commit it to a public GitHub repository.

## Member branches and primary module files
### WONG YUE SHAN
Branch: `feature/wong-yue-shan`

- `src/firebase.ts`
- `src/app/api/firebaseClient.ts`
- `src/app/lib/weather.ts`
- `src/app/pages/AdminPage.tsx`
- `src/app/pages/ContributorPage.tsx`
- `src/app/pages/SuggestLocationPage.tsx`
- `firestore.rules`
- `storage.rules`

MAIN shared maintenance/checking assignment:
- `src/app/components/ui/ImageWithFallback.tsx`
- `src/app/components/ui/badge.tsx`
- `src/app/components/ui/chart.tsx`
- `src/app/components/ui/drawer.tsx`
- `src/app/components/ui/label.tsx`
- `src/app/components/ui/radio-group.tsx`
- `src/app/components/ui/sidebar.tsx`
- `src/app/components/ui/tabs.tsx`
- `src/app/components/ui/utils.ts`
- `API_SETUP.md`
- `MERGE_NOTES.md`
- `public/state-images/kedah.jpg`
- `public/state-images/pahang.jpg`
- `public/state-images/sarawak.jpg`

### WILSON CHOONG WEI SHAN
Branch: `feature/wilson-choong-wei-shan`

- `src/app/pages/AccountPage.tsx`
- `src/app/components/AuthModal.tsx`
- `src/app/pages/AIPage.tsx`
- `src/app/pages/ExplorePage.tsx`
- `src/app/components/FrapButton.tsx`

MAIN shared maintenance/checking assignment:
- `src/app/components/ui/accordion.tsx`
- `src/app/components/ui/breadcrumb.tsx`
- `src/app/components/ui/checkbox.tsx`
- `src/app/components/ui/dropdown-menu.tsx`
- `src/app/components/ui/menubar.tsx`
- `src/app/components/ui/resizable.tsx`
- `src/app/components/ui/skeleton.tsx`
- `src/app/components/ui/textarea.tsx`
- `ATTRIBUTIONS.md`
- `README.md`
- `public/state-images/kelantan.jpg`
- `public/state-images/perak.jpg`
- `public/state-images/selangor.jpg`

### LOW JUN FENG
Branch: `feature/low-jun-feng`

- `src/app/pages/HomePage.tsx`
- `src/app/lib/badges.ts`
- `src/app/components/Flags.tsx`
- `src/app/components/StateFlagCard.tsx`

MAIN shared maintenance/checking assignment:
- `src/app/components/ui/alert-dialog.tsx`
- `src/app/components/ui/button.tsx`
- `src/app/components/ui/collapsible.tsx`
- `src/app/components/ui/form.tsx`
- `src/app/components/ui/navigation-menu.tsx`
- `src/app/components/ui/scroll-area.tsx`
- `src/app/components/ui/slider.tsx`
- `src/app/components/ui/toggle-group.tsx`
- `FIREBASE_DATA_SETUP.md`
- `STATE_IMAGES.md`
- `public/state-images/kuala-lumpur.jpg`
- `public/state-images/perlis.jpg`
- `public/state-images/terengganu.jpg`

### LIM ROU YU
Branch: `feature/lim-rou-yu`

- `src/app/App.tsx`
- `src/app/pages/LocationPage.tsx`
- `src/app/pages/MapPage.tsx`
- `src/app/lib/mapGeocoding.ts`
- `src/app/components/LocationCard.tsx`

MAIN shared maintenance/checking assignment:
- `src/app/components/ui/alert.tsx`
- `src/app/components/ui/calendar.tsx`
- `src/app/components/ui/command.tsx`
- `src/app/components/ui/hover-card.tsx`
- `src/app/components/ui/pagination.tsx`
- `src/app/components/ui/select.tsx`
- `src/app/components/ui/sonner.tsx`
- `src/app/components/ui/toggle.tsx`
- `FIREBASE_SAME_THINKING.md`
- `guidelines/Guidelines.md`
- `public/state-images/labuan.jpg`
- `public/state-images/pulau-pinang.jpg`
- `src/app/pages/HelpPage.tsx`

### LIM TZE XIN
Branch: `feature/lim-tze-xin`

- `src/app/pages/BookmarksPage.tsx`

MAIN shared maintenance/checking assignment:
- `src/app/components/ui/aspect-ratio.tsx`
- `src/app/components/ui/card.tsx`
- `src/app/components/ui/context-menu.tsx`
- `src/app/components/ui/input-otp.tsx`
- `src/app/components/ui/popover.tsx`
- `src/app/components/ui/separator.tsx`
- `src/app/components/ui/switch.tsx`
- `src/app/components/ui/tooltip.tsx`
- `FIREBASE_SETUP.md`
- `public/state-images/PUT-YOUR-PHOTOS-HERE.txt`
- `public/state-images/melaka.jpg`
- `public/state-images/putrajaya.jpg`
- `src/imports/logo.png`

### FONG XIN TONG
Branch: `feature/fong-xin-tong`

- `src/app/pages/LeaderboardPage.tsx`
- `src/app/pages/LogPage.tsx`
- `src/app/pages/InsightsPage.tsx`

MAIN shared maintenance/checking assignment:
- `src/app/components/ui/avatar.tsx`
- `src/app/components/ui/carousel.tsx`
- `src/app/components/ui/dialog.tsx`
- `src/app/components/ui/input.tsx`
- `src/app/components/ui/progress.tsx`
- `src/app/components/ui/sheet.tsx`
- `src/app/components/ui/table.tsx`
- `src/app/components/ui/use-mobile.ts`
- `LOGIN_FIREBASE_PAGES.md`
- `public/state-images/johor.jpg`
- `public/state-images/negeri-sembilan.jpg`
- `public/state-images/sabah.jpg`

## Files that belong directly to MAIN / TEAM SHARED
- `src/main.tsx`
- `src/global.d.ts`
- `src/app/lib/types.ts`
- `src/app/lib/communityTypes.ts`
- `src/app/lib/constants.ts`
- `src/app/lib/helpers.ts`
- `src/app/lib/tokens.ts`
- `src/app/components/Atoms.tsx`
- `src/app/components/NavBar.tsx`
- `src/styles/index.css`
- `default_shadcn_theme.css`
- `index.html`
- `public/manifest.json`
- `package.json`
- `package-lock.json`
- `pnpm-workspace.yaml`
- `postcss.config.mjs`
- `tsconfig.json`
- `vite.config.ts`
- `.gitignore`
- `.env.local`

All `src/app/components/ui/*` files are also MAIN / TEAM SHARED; their maintenance assignment is recorded in `CODE_OWNERSHIP.md`.
