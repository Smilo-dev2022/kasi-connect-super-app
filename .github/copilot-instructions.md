# Copilot Instructions for iKasiLinkMobileApp

This repository contains the React Native mobile app `iKasiLinkMobileApp` (TypeScript) targeting Android and iOS. All mobile work must occur under `/workspace/iKasiLinkMobileApp`.

## Setup Checklist
- [ ] Node 18+ and Java 17 installed
- [ ] Android SDK + emulator, or physical device with USB debugging
- [ ] iOS requires Xcode (macOS only)
- [ ] From `iKasiLinkMobileApp/`: `npm install`
- [ ] Start Metro: `npm start`
- [ ] Android: `npm run android`
- [ ] iOS: `npm run ios` (macOS)

## Code Structure
- `src/navigation` root and tab navigation
- `src/screens` app screens (Home, Events, Messages, Profile)
- `src/api` axios client and API modules (auth, moderation, events, messaging)
- `src/components`, `src/utils`, `src/types`, `src/features`

## Conventions
- Use path aliases: `@api`, `@navigation`, `@screens`, `@components`, `@utils`, `@types`, `@features`
- Keep business logic in `src/features`
- Prefer function components and hooks
- Tests colocated under `__tests__` or next to modules

## Notes
- For mobile tasks, operate only in `iKasiLinkMobileApp/`
- For backend endpoints, coordinate with services in `/workspace/services` or `/workspace/app`
