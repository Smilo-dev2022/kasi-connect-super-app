# Agent 14 – QA & Release (local only)

A local-only CLI for versioning, release notes, QA checklists, and tagging. No CI/CD, lint/test/build checks, or preview pipeline.

## Install

```bash
cd agent14-qa-release
npm i
```

## Build

```bash
npm run build
```

## Usage

```bash
# Read current version (defaults to 0.0.0 if missing)
node dist/index.js version

# Bump version and write VERSION
node dist/index.js version patch

# Generate release notes
node dist/index.js release-notes 1.2.3

# Generate QA checklist
node dist/index.js qa 1.2.3

# Create a git tag (local only)
node dist/index.js tag 1.2.3

# Dry run examples
node dist/index.js version patch --dry-run
node dist/index.js release-notes 1.2.3 --dry-run
node dist/index.js qa 1.2.3 --dry-run
node dist/index.js tag 1.2.3 --dry-run
```