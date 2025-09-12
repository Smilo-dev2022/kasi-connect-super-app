# Release Process

We use semantic-release on pushes to `main`.

1. Follow Conventional Commits (feat:, fix:, chore:, docs:, refactor:, perf:, test:).
2. CI runs build, tests, and release.
3. semantic-release creates a GitHub release, updates CHANGELOG.md, and bumps version.

Manual release locally:

```
npm run build
npm run release
```
