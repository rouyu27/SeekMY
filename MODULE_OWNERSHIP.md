# SeekMY Module Ownership

This file documents the source-code ownership used for the GitHub submission. Shared integration files may be used by more than one member. Member-specific sections inside shared files are marked directly in the source code.

| Member | Assigned modules | Main source files |
|---|---|---|
| **WONG YUE SHAN** | Weather Module; Local Contributor Portal; Admin Panel | `src/app/lib/weather.ts`, `src/app/pages/ContributorPage.tsx`, `src/app/pages/AdminPage.tsx`, `src/app/pages/SuggestLocationPage.tsx`; weather section in `LocationPage.tsx` |
| **WILSON CHOONG WEI SHAN** | Account Module; Activity Filter Module; AI Outdoor Assistant Chatbot | `src/app/pages/AccountPage.tsx`, `src/app/components/AuthModal.tsx`, `src/app/pages/ExplorePage.tsx`, `src/app/pages/AIPage.tsx` |
| **LOW JUN FENG** | Home Module; Badge Achievement System | `src/app/pages/HomePage.tsx`, `src/app/components/StateFlagCard.tsx`, `src/app/components/Flags.tsx`, `src/app/lib/badges.ts`; badge integration in `App.tsx` |
| **LIM ROU YU** | Location Detail Module; Map Module | location-detail sections in `src/app/pages/LocationPage.tsx`, `src/app/pages/MapPage.tsx` |
| **LIM TZE XIN** | Bookmark Module; User Review & Rating Module | `src/app/pages/BookmarksPage.tsx`; bookmark/review sections in `src/app/pages/LocationPage.tsx` |
| **FONG XIN TONG** | Community Leaderboard & Ranking Module; Activity Log & Personal Stats Dashboard | `src/app/pages/LeaderboardPage.tsx`, `src/app/pages/LogPage.tsx`, `src/app/pages/InsightsPage.tsx` |

## Comment format

Single-owner files are wrapped with comments such as:

```ts
//LimRouYu Part - Map Module
...
//LimRouYu Part End - Map Module
```

Shared TSX files use JSX comments where required by React syntax, for example:

```tsx
{/* LimTzeXin Part - Bookmark Module */}
...
{/* LimTzeXin Part End - Bookmark Module */}
```

## Shared files

Files such as `firebaseClient.ts`, `types.ts`, constants, tokens and reusable UI components are shared integration code. They are not assigned exclusively to one member because multiple modules depend on them.


## Shared-file comment format

A file may contain code from more than one member. Each member's section is separated using clear `MemberName Part` and `MemberName END` comments. Do not assume the whole shared file belongs to the first member named in it.
