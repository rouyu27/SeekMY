# SeekMY Complete Code Ownership Manifest

This manifest covers **every file** in the submitted SeekMY project. For text/code/config files, `Lines` covers the complete file from line 1 to its final line. Shared files may additionally contain in-code `Member Part` / `Member END` markers for section-level ownership. JSON files cannot safely contain comments, so their ownership is documented here instead of inserting invalid JSON comments.

| File | Owner / Classification | Responsibility | GitHub destination | Lines covered | Notes |
|---|---|---|---|---:|---|
| `.env.local` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-9 | Team shared |
| `.gitignore` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-6 | Team shared |
| `API_SETUP.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-21 | Maintenance assignment: WONG YUE SHAN |
| `ATTRIBUTIONS.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-3 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `FIREBASE_DATA_SETUP.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-59 | Maintenance assignment: LOW JUN FENG |
| `FIREBASE_SAME_THINKING.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-30 | Maintenance assignment: LIM ROU YU |
| `FIREBASE_SETUP.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-32 | Maintenance assignment: LIM TZE XIN |
| `LOGIN_FIREBASE_PAGES.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-14 | Maintenance assignment: FONG XIN TONG |
| `MERGE_NOTES.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-23 | Maintenance assignment: WONG YUE SHAN |
| `README.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-11 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `STATE_IMAGES.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-15 | Maintenance assignment: LOW JUN FENG |
| `default_shadcn_theme.css` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-124 | Team shared |
| `firestore.rules` | WONG YUE SHAN | Firebase Firestore Security Rules | `feature/wong-yue-shan` | 1-37 | Primary business/module owner |
| `guidelines/Guidelines.md` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-61 | Maintenance assignment: LIM ROU YU |
| `index.html` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-24 | Team shared |
| `package-lock.json` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-6749 | Team shared |
| `package.json` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-95 | Team shared |
| `pnpm-workspace.yaml` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-11 | Team shared |
| `postcss.config.mjs` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-20 | Team shared |
| `public/manifest.json` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-1 | Team shared |
| `public/state-images/PUT-YOUR-PHOTOS-HERE.txt` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-29 | Maintenance assignment: LIM TZE XIN |
| `public/state-images/johor.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: FONG XIN TONG |
| `public/state-images/kedah.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: WONG YUE SHAN |
| `public/state-images/kelantan.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `public/state-images/kuala-lumpur.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: LOW JUN FENG |
| `public/state-images/labuan.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: LIM ROU YU |
| `public/state-images/melaka.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: LIM TZE XIN |
| `public/state-images/negeri-sembilan.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: FONG XIN TONG |
| `public/state-images/pahang.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: WONG YUE SHAN |
| `public/state-images/perak.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `public/state-images/perlis.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: LOW JUN FENG |
| `public/state-images/pulau-pinang.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: LIM ROU YU |
| `public/state-images/putrajaya.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: LIM TZE XIN |
| `public/state-images/sabah.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: FONG XIN TONG |
| `public/state-images/sarawak.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: WONG YUE SHAN |
| `public/state-images/selangor.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `public/state-images/terengganu.jpg` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: LOW JUN FENG |
| `src/app/App.tsx` | LIM ROU YU | Main App Integration / App.tsx Owner | `main` | 1-426 | Primary business/module owner |
| `src/app/api/firebaseClient.ts` | WONG YUE SHAN | Firebase Integration / Shared CRUD Primary Owner | `feature/wong-yue-shan` | 1-1119 | Primary business/module owner |
| `src/app/components/Atoms.tsx` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-61 | Team shared |
| `src/app/components/AuthModal.tsx` | WILSON CHOONG WEI SHAN | Account Authentication UI | `feature/wilson-choong-wei-shan` | 1-295 | Primary business/module owner |
| `src/app/components/Flags.tsx` | LOW JUN FENG | Home State Flag Support | `feature/low-jun-feng` | 1-29 | Primary business/module owner |
| `src/app/components/FrapButton.tsx` | WILSON CHOONG WEI SHAN | AI Outdoor Assistant Entry Button | `feature/wilson-choong-wei-shan` | 1-50 | Primary business/module owner |
| `src/app/components/LocationCard.tsx` | LIM ROU YU | Location Display / Location Detail Support | `feature/lim-rou-yu` | 1-52 | Primary business/module owner |
| `src/app/components/NavBar.tsx` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-147 | Team shared |
| `src/app/components/StateFlagCard.tsx` | LOW JUN FENG | Home State Card UI | `feature/low-jun-feng` | 1-57 | Primary business/module owner |
| `src/app/components/ui/ImageWithFallback.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-32 | Maintenance assignment: WONG YUE SHAN |
| `src/app/components/ui/accordion.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-71 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `src/app/components/ui/alert-dialog.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-162 | Maintenance assignment: LOW JUN FENG |
| `src/app/components/ui/alert.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-71 | Maintenance assignment: LIM ROU YU |
| `src/app/components/ui/aspect-ratio.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-16 | Maintenance assignment: LIM TZE XIN |
| `src/app/components/ui/avatar.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-58 | Maintenance assignment: FONG XIN TONG |
| `src/app/components/ui/badge.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-51 | Maintenance assignment: WONG YUE SHAN |
| `src/app/components/ui/breadcrumb.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-114 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `src/app/components/ui/button.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-63 | Maintenance assignment: LOW JUN FENG |
| `src/app/components/ui/calendar.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-80 | Maintenance assignment: LIM ROU YU |
| `src/app/components/ui/card.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-97 | Maintenance assignment: LIM TZE XIN |
| `src/app/components/ui/carousel.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-246 | Maintenance assignment: FONG XIN TONG |
| `src/app/components/ui/chart.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-358 | Maintenance assignment: WONG YUE SHAN |
| `src/app/components/ui/checkbox.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-37 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `src/app/components/ui/collapsible.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-38 | Maintenance assignment: LOW JUN FENG |
| `src/app/components/ui/command.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-182 | Maintenance assignment: LIM ROU YU |
| `src/app/components/ui/context-menu.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-257 | Maintenance assignment: LIM TZE XIN |
| `src/app/components/ui/dialog.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-140 | Maintenance assignment: FONG XIN TONG |
| `src/app/components/ui/drawer.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-137 | Maintenance assignment: WONG YUE SHAN |
| `src/app/components/ui/dropdown-menu.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-262 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `src/app/components/ui/form.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-173 | Maintenance assignment: LOW JUN FENG |
| `src/app/components/ui/hover-card.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-49 | Maintenance assignment: LIM ROU YU |
| `src/app/components/ui/input-otp.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-82 | Maintenance assignment: LIM TZE XIN |
| `src/app/components/ui/input.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-26 | Maintenance assignment: FONG XIN TONG |
| `src/app/components/ui/label.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-29 | Maintenance assignment: WONG YUE SHAN |
| `src/app/components/ui/menubar.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-281 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `src/app/components/ui/navigation-menu.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-173 | Maintenance assignment: LOW JUN FENG |
| `src/app/components/ui/pagination.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-132 | Maintenance assignment: LIM ROU YU |
| `src/app/components/ui/popover.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-53 | Maintenance assignment: LIM TZE XIN |
| `src/app/components/ui/progress.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-36 | Maintenance assignment: FONG XIN TONG |
| `src/app/components/ui/radio-group.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-50 | Maintenance assignment: WONG YUE SHAN |
| `src/app/components/ui/resizable.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-61 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `src/app/components/ui/scroll-area.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-63 | Maintenance assignment: LOW JUN FENG |
| `src/app/components/ui/select.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-194 | Maintenance assignment: LIM ROU YU |
| `src/app/components/ui/separator.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-33 | Maintenance assignment: LIM TZE XIN |
| `src/app/components/ui/sheet.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-144 | Maintenance assignment: FONG XIN TONG |
| `src/app/components/ui/sidebar.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-731 | Maintenance assignment: WONG YUE SHAN |
| `src/app/components/ui/skeleton.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-18 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `src/app/components/ui/slider.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-68 | Maintenance assignment: LOW JUN FENG |
| `src/app/components/ui/sonner.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-30 | Maintenance assignment: LIM ROU YU |
| `src/app/components/ui/switch.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-36 | Maintenance assignment: LIM TZE XIN |
| `src/app/components/ui/table.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-121 | Maintenance assignment: FONG XIN TONG |
| `src/app/components/ui/tabs.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-71 | Maintenance assignment: WONG YUE SHAN |
| `src/app/components/ui/textarea.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-23 | Maintenance assignment: WILSON CHOONG WEI SHAN |
| `src/app/components/ui/toggle-group.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-78 | Maintenance assignment: LOW JUN FENG |
| `src/app/components/ui/toggle.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-52 | Maintenance assignment: LIM ROU YU |
| `src/app/components/ui/tooltip.tsx` | MAIN / TEAM SHARED | UI foundation | `main` | 1-66 | Maintenance assignment: LIM TZE XIN |
| `src/app/components/ui/use-mobile.ts` | MAIN / TEAM SHARED | UI foundation | `main` | 1-26 | Maintenance assignment: FONG XIN TONG |
| `src/app/components/ui/utils.ts` | MAIN / TEAM SHARED | UI foundation | `main` | 1-11 | Maintenance assignment: WONG YUE SHAN |
| `src/app/lib/badges.ts` | LOW JUN FENG | Badge Achievement System | `feature/low-jun-feng` | 1-76 | Primary business/module owner |
| `src/app/lib/communityTypes.ts` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-32 | Team shared |
| `src/app/lib/constants.ts` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-62 | Team shared |
| `src/app/lib/helpers.ts` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-31 | Team shared |
| `src/app/lib/mapGeocoding.ts` | LIM ROU YU | Map Address Geocoding | `feature/lim-rou-yu` | 1-124 | Primary business/module owner |
| `src/app/lib/tokens.ts` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-26 | Team shared |
| `src/app/lib/types.ts` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-108 | Team shared |
| `src/app/lib/weather.ts` | WONG YUE SHAN | Weather Module | `feature/wong-yue-shan` | 1-563 | Primary business/module owner |
| `src/app/pages/AIPage.tsx` | WILSON CHOONG WEI SHAN | AI Outdoor Assistant Chatbot | `feature/wilson-choong-wei-shan` | 1-419 | Primary business/module owner |
| `src/app/pages/AccountPage.tsx` | WILSON CHOONG WEI SHAN | Account Module | `feature/wilson-choong-wei-shan` | 1-450 | Primary business/module owner |
| `src/app/pages/AdminPage.tsx` | WONG YUE SHAN | Admin Panel | `feature/wong-yue-shan` | 1-356 | Primary business/module owner |
| `src/app/pages/BookmarksPage.tsx` | LIM TZE XIN | Bookmark Module | `feature/lim-tze-xin` | 1-342 | Primary business/module owner |
| `src/app/pages/ContributorPage.tsx` | WONG YUE SHAN | Local Contributor Portal | `feature/wong-yue-shan` | 1-362 | Primary business/module owner |
| `src/app/pages/ExplorePage.tsx` | WILSON CHOONG WEI SHAN | Activity Filter Module | `feature/wilson-choong-wei-shan` | 1-197 | Primary business/module owner |
| `src/app/pages/HelpPage.tsx` | MAIN / TEAM SHARED | Docs/assets/support | `main` | 1-28 | Maintenance assignment: LIM ROU YU |
| `src/app/pages/HomePage.tsx` | LOW JUN FENG | Home Module | `feature/low-jun-feng` | 1-187 | Primary business/module owner |
| `src/app/pages/InsightsPage.tsx` | FONG XIN TONG | Personal Stats Dashboard | `feature/fong-xin-tong` | 1-74 | Primary business/module owner |
| `src/app/pages/LeaderboardPage.tsx` | FONG XIN TONG | Community Leaderboard & Ranking Module | `feature/fong-xin-tong` | 1-70 | Primary business/module owner |
| `src/app/pages/LocationPage.tsx` | LIM ROU YU | Location Detail Module - Primary Shared File Owner | `feature/lim-rou-yu` | 1-580 | Primary business/module owner |
| `src/app/pages/LogPage.tsx` | FONG XIN TONG | Activity Log Module | `feature/fong-xin-tong` | 1-414 | Primary business/module owner |
| `src/app/pages/MapPage.tsx` | LIM ROU YU | Map Module | `feature/lim-rou-yu` | 1-247 | Primary business/module owner |
| `src/app/pages/SuggestLocationPage.tsx` | WONG YUE SHAN | Local Contributor / Location Suggestion | `feature/wong-yue-shan` | 1-263 | Primary business/module owner |
| `src/firebase.ts` | WONG YUE SHAN | Firebase Setup | `feature/wong-yue-shan` | 1-25 | Primary business/module owner |
| `src/global.d.ts` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-18 | Team shared |
| `src/imports/logo.png` | MAIN / TEAM SHARED | Docs/assets/support | `main` | binary asset | Maintenance assignment: LIM TZE XIN |
| `src/main.tsx` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-10 | Team shared |
| `src/styles/index.css` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-27 | Team shared |
| `storage.rules` | WONG YUE SHAN | Firebase Storage Security Rules | `feature/wong-yue-shan` | 1-12 | Primary business/module owner |
| `tsconfig.json` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-29 | Team shared |
| `vite.config.ts` | MAIN / TEAM SHARED | Project foundation/config/shared types | `main` | 1-41 | Team shared |
