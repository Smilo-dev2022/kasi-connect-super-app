# Migration Plan: Web React to React Native

This document outlines how to migrate reusable logic and components from the existing web React codebase to the mobile React Native app.

## What migrates well
- Business logic (TypeScript): services, utilities, validation, data mappers
- State and hooks: custom hooks with minimal DOM coupling
- Types and API clients: models, DTOs, API layer (axios)

## What to rewrite
- DOM/HTML/CSS-specific UI components
- Router usage (replace with React Navigation)
- Browser-only APIs (replace with RN modules)

## Steps
1. Identify shared logic in web repo (`src/lib`, `src/services`, utils)
2. Extract to `iKasiLinkMobileApp/src/features` or `src/utils`
3. Replace fetch with `@api` client where needed
4. Map routes to screens and navigation params
5. Replace styling with React Native `StyleSheet` or a RN styling library
6. Validate on-device behaviors (permissions, offline, gestures)

## Notes
- Keep platform checks (`Platform.OS`) for divergent code paths
- Prefer pure functions and headless hooks for maximum reuse
