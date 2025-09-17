# iKasiLinkMobileApp Project Instructions

This file contains step-by-step instructions for setting up, developing, and maintaining the iKasiLink React Native mobile app.

## 1. Project Root
- All mobile app work must be done in the `iKasiLinkMobileApp/` directory.
- Do not place mobile code outside this folder.

## 2. Getting Started
- Open `iKasiLinkMobileApp/` in VS Code.
- Review the README.md for project overview and contacts.

## 3. Development Workflow
- Use TypeScript for all code.
- Use React Navigation for app routing.
- Integrate backend APIs for auth, moderation, events, messaging.
- Follow modular code practices (separate features/components).
- Instrument analytics and authentication early.

## 4. Compilation & Launch
- Install dependencies: `npm install` or `yarn install` in the project root.
- Run the app:
  - Android: `npx react-native run-android`
  - iOS: `npx react-native run-ios` (requires macOS)
- Debug using VS Code and React Native tools.

## 5. Extensions & Tasks
- Only install extensions specified in project setup info.
- Use tasks.json for build/run automation if needed.

## 6. Documentation
- Keep README.md up to date with architecture, setup, and contacts.
- Document any new features, APIs, or configs added.

## 7. Best Practices
- Use environment variables for secrets/configs.
- Do not commit .env or secret files.
- Keep branding consistent: always use "iKasiLink".
- Coordinate API changes and major refactors with the team.

## 8. Contacts
- For questions, reach out to the project lead or check the README.md for contact info.

---

**Cursor and Jules:**
- Follow these instructions for all mobile app work.
- Confirm you are working in the correct folder before starting.
