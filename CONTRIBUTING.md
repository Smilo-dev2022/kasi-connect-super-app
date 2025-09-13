# Contributing

## Goals
- Prevent cross-tool conflicts
- Keep changes traceable
- Ship small, tested increments

## Branching
- One task = one branch = one PR
- Never commit to `main`
- Branch format: `feature/agent-XX-tool-NN-short-title`
  - Example: `feature/agent07-cursor-db-persistence`

## Branch roles
- Cursor: `feature/agent-XX-cursor-*` (scaffold, APIs, compose, bulk edits)
- VS Code + Copilot: `feature/agent-XX-vscode-*` (refactors, tests, UI polish)
- Jules: creates tickets `JLS-###`, status/approvals

## Commits
- Template: `chore|feat|fix|refactor(scope): message [Agent-XX][Tool][JLS-###]`
  - Example: `fix(messaging): persist message create [Agent-07][Cursor][JLS-123]`

## Environments
- `.env.local.vscode` for VS Code
- `.env.local.cursor` for Cursor
- `.env.local.ci` for CI
- Never commit secrets; use `.env.example`

## Docker profiles
- `--profile vscode`
- `--profile cursor`

## Daily flow
```
# Sync
git checkout develop
git pull origin develop

# Branch
git checkout -b feature/agent07-cursor-db-persistence

# Run
docker compose -f docker-compose.dev.yml up -d

# Tests
npm run lint && npm run typecheck && npm test

# Commit small
git add -A
git commit -m "feat(messaging): DB persistence [Agent-07][Cursor][JLS-456]"

# Rebase
git fetch origin
git rebase origin/develop

# Push + PR
git push -u origin feature/agent07-cursor-db-persistence
```

## PR requirements
- What changed
- Acceptance criteria
- Test steps
- Risk and rollback
- Linked ticket IDs

## Merge policy
- PR to `develop`, protected checks must pass
- CI gates: lint, type, unit, integration (compose smoke), vuln scan

## Release flow
```
git checkout main
git merge --ff-only develop
git tag vX.Y.Z
git push --tags
```

## Merge conflicts
- Avoid GitHub UI for big files
- Resolve locally with rebase; build + test; `--force-with-lease`
