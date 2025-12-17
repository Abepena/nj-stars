# Git Workflow Guide

This project uses a **feature branch workflow** - a simplified version of Git Flow optimized for small teams.

## Branch Structure

```
main (production)
  │
  └── dev (integration/staging)
        │
        ├── feature/calendar-sync
        ├── feature/billing-page
        ├── fix/typescript-error
        └── feature/user-auth
```

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production-ready code | Railway + Vercel (production) |
| `dev` | Integration testing | Vercel preview (optional) |
| `feature/*` | New features | None (local only) |
| `fix/*` | Bug fixes | None (local only) |
| `hotfix/*` | Urgent production fixes | Direct to main (rare) |

---

## Workflow: Starting a New Feature

### 1. Create Feature Branch
```bash
# Always start from an up-to-date dev branch
git checkout dev
git pull origin dev

# Create and switch to feature branch
git checkout -b feature/my-feature-name
```

**Naming conventions:**
- `feature/calendar-sync` - New functionality
- `fix/billing-typescript-error` - Bug fixes
- `refactor/event-components` - Code improvements
- `docs/api-documentation` - Documentation only

### 2. Work on Your Feature
```bash
# Make changes, commit often with descriptive messages
git add .
git commit -m "Add CalendarSource model for iCal sync"

git add .
git commit -m "Create sync_calendars management command"

# Push to remote (first time)
git push -u origin feature/my-feature-name

# Subsequent pushes
git push
```

**Commit message tips:**
- Start with verb: Add, Fix, Update, Remove, Refactor
- Be specific: "Fix TypeScript error in billing page" not "Fix bug"
- Reference issues if applicable: "Fix #123: Add calendar sync"

### 3. Keep Branch Updated (if working > 1 day)
```bash
# Fetch latest dev changes
git checkout dev
git pull origin dev

# Switch back and merge dev into your feature
git checkout feature/my-feature-name
git merge dev

# Resolve any conflicts, then continue working
```

### 4. Merge to Dev
```bash
# Ensure your feature is complete and tested locally
git checkout dev
git pull origin dev
git merge feature/my-feature-name

# Push updated dev
git push origin dev
```

### 5. Test on Dev
- Verify your feature works with other recent changes
- Run test suite: `make test` or `npm test`
- Check for any integration issues

### 6. Merge Dev to Main (Deploy to Production)
```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

### 7. Clean Up
```bash
# Delete local feature branch
git branch -d feature/my-feature-name

# Delete remote feature branch
git push origin --delete feature/my-feature-name
```

---

## Quick Reference Commands

### Daily Workflow
```bash
# Morning: Start fresh
git checkout dev && git pull origin dev
git checkout -b feature/todays-work

# Throughout day: Commit often
git add . && git commit -m "Description of changes"

# End of day: Push work
git push -u origin feature/todays-work
```

### Merging Complete Feature
```bash
# Feature → Dev → Main
git checkout dev && git pull origin dev
git merge feature/my-feature
git push origin dev

# After testing dev:
git checkout main && git pull origin main
git merge dev
git push origin main

# Cleanup
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

### Emergency Hotfix
```bash
# For critical production bugs only
git checkout main && git pull origin main
git checkout -b hotfix/critical-bug
# Make fix
git commit -m "Hotfix: Fix critical payment bug"
git checkout main && git merge hotfix/critical-bug
git push origin main

# Also merge to dev to keep in sync
git checkout dev && git merge main
git push origin dev
```

---

## Visual Workflow

```
Feature Development:
────────────────────

  dev ────●────●────●────●────●────●──── (integration)
           \                    /
            \──●──●──●──●──●──/          feature/calendar-sync
                    (merge)

Production Release:
───────────────────

  main ────●────────────────●──── (production)
                           /
  dev ────●────●────●────●/       (merge when stable)
```

---

## Rules & Best Practices

### Do:
- Create a feature branch for any work taking > 30 minutes
- Commit frequently with clear messages
- Pull dev before starting new work
- Test locally before merging to dev
- Delete branches after merging

### Don't:
- Commit directly to `main` (except hotfixes)
- Leave feature branches open for weeks
- Force push to `main` or `dev`
- Merge untested code to `main`

---

## Handling Merge Conflicts

```bash
# When merging causes conflicts:
git merge dev
# Git will show: CONFLICT in file.tsx

# 1. Open conflicting files
# 2. Look for conflict markers:
#    <<<<<<< HEAD
#    (your changes)
#    =======
#    (incoming changes)
#    >>>>>>> dev

# 3. Edit to keep what you want, remove markers
# 4. Stage and commit
git add .
git commit -m "Resolve merge conflicts with dev"
```

---

## Branch Lifespan Guidelines

| Branch Type | Ideal Lifespan | Maximum |
|-------------|----------------|---------|
| `feature/*` | 1-3 days | 1 week |
| `fix/*` | Hours | 1-2 days |
| `hotfix/*` | Minutes to hours | Same day |

Long-lived feature branches cause painful merges. If a feature is large, break it into smaller incremental features.
