# GitHub Workflows Documentation

Complete guide to the automated workflows set up for soroban-trace.

---

## Workflows Overview

### 1. CI (Continuous Integration)
**File:** `.github/workflows/ci.yml`  
**Triggers:** Push to main/develop, Pull Requests  
**Purpose:** Test code quality and build

**What it does:**
- Tests on Node.js 18, 20, and 21
- Runs linter
- Builds the project
- Runs all tests
- Tests CLI functionality
- Uploads code coverage

**Badge for README:**
```markdown
[![CI](https://github.com/daveylupes/soroban-trace/actions/workflows/ci.yml/badge.svg)](https://github.com/daveylupes/soroban-trace/actions/workflows/ci.yml)
```

---

### 2. Release (Automated Releases)
**File:** `.github/workflows/release.yml`  
**Triggers:** New version tags (v*)  
**Purpose:** Automated releases to GitHub and npm

**What it does:**
- Creates GitHub Release
- Builds the project
- Publishes to npm (if NPM_TOKEN is set)
- Generates release notes

**How to trigger:**
```bash
# Create and push a new version tag
npm version patch  # or minor, or major
git push && git push --tags
```

---

### 3. CodeQL Security Scan
**File:** `.github/workflows/codeql.yml`  
**Triggers:** Push to main, PRs, Weekly schedule  
**Purpose:** Automated security scanning

**What it does:**
- Scans code for security vulnerabilities
- Analyzes JavaScript/TypeScript
- Reports security issues
- Runs weekly

**Badge for README:**
```markdown
[![CodeQL](https://github.com/daveylupes/soroban-trace/actions/workflows/codeql.yml/badge.svg)](https://github.com/daveylupes/soroban-trace/actions/workflows/codeql.yml)
```

---

### 4. Dependency Review
**File:** `.github/workflows/dependency-review.yml`  
**Triggers:** Pull Requests to main  
**Purpose:** Check dependencies for security issues

**What it does:**
- Reviews new dependencies in PRs
- Checks for known vulnerabilities
- Fails on moderate+ severity issues
- Prevents vulnerable deps from being merged

---

## Setup Required

### NPM Token (for automated publishing)

1. **Get npm token:**
   ```bash
   npm login
   npm token create
   ```

2. **Add to GitHub:**
   - Go to: https://github.com/daveylupes/soroban-trace/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: [paste your npm token]
   - Click "Add secret"

**Without this:** Release workflow will skip npm publishing (GitHub release still works)

---

## Issue Templates

### Bug Report
**File:** `.github/ISSUE_TEMPLATE/bug_report.md`

**What it includes:**
- Bug description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Transaction hash field
- Command output

**Users see this when they click "New Issue" → "Bug report"**

---

### Feature Request
**File:** `.github/ISSUE_TEMPLATE/feature_request.md`

**What it includes:**
- Problem statement
- Proposed solution
- Use case
- Alternatives considered
- Implementation willingness

**Users see this when they click "New Issue" → "Feature request"**

---

## Pull Request Template

**File:** `.github/PULL_REQUEST_TEMPLATE.md`

**What it includes:**
- Description and linked issues
- Type of change checkboxes
- Testing details
- Checklist for contributors
- Screenshot section

**Automatically populates when creating a PR**

---

## Security Policy

**File:** `.github/SECURITY.md`

**What it includes:**
- Supported versions
- How to report vulnerabilities
- Response time commitments
- Disclosure policy
- Security best practices

**Visible at:** https://github.com/daveylupes/soroban-trace/security

---

## Funding (Optional)

**File:** `.github/FUNDING.yml`

**Purpose:** Add "Sponsor" button to your repo

**To enable:**
1. Uncomment a platform in FUNDING.yml
2. Add your username
3. Push changes

**Options:**
- GitHub Sponsors
- Patreon
- Ko-fi
- Open Collective
- Custom URLs

---

## Usage Examples

### When you push code:
```bash
git push origin main
# ✓ CI workflow runs automatically
# ✓ Tests are run
# ✓ Build is verified
# ✓ CodeQL scan runs
```

### When someone creates a PR:
```bash
# ✓ CI workflow runs
# ✓ Dependency review runs
# ✓ All tests must pass
# ✓ Build must succeed
```

### When you release a new version:
```bash
npm version patch
git push && git push --tags
# ✓ Release workflow triggers
# ✓ GitHub Release created
# ✓ npm package published
```

---

## Workflow Status

Check workflow runs at:
https://github.com/daveylupes/soroban-trace/actions

**You'll see:**
- ✅ Passing builds (green checkmark)
- ❌ Failing builds (red X)
- 🟡 In progress (yellow dot)

---

## Recommended Badges for README

Add these to the top of your README.md:

```markdown
[![npm version](https://img.shields.io/npm/v/soroban-trace.svg)](https://www.npmjs.com/package/soroban-trace)
[![CI](https://github.com/daveylupes/soroban-trace/actions/workflows/ci.yml/badge.svg)](https://github.com/daveylupes/soroban-trace/actions/workflows/ci.yml)
[![CodeQL](https://github.com/daveylupes/soroban-trace/actions/workflows/codeql.yml/badge.svg)](https://github.com/daveylupes/soroban-trace/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
```

---

## Customization

### Modify Node.js versions tested:
Edit `.github/workflows/ci.yml`:
```yaml
matrix:
  node-version: [18.x, 20.x, 21.x]  # Add or remove versions
```

### Change when workflows run:
Edit the `on:` section:
```yaml
on:
  push:
    branches: [ main, develop, feature/* ]  # Add more branches
```

### Add more test steps:
Add to `.github/workflows/ci.yml`:
```yaml
- name: Run integration tests
  run: npm run test:integration
```

---

## Complete File Structure

```
.github/
├── workflows/
│   ├── ci.yml                  # CI tests
│   ├── release.yml             # Automated releases
│   ├── codeql.yml              # Security scanning
│   └── dependency-review.yml   # Dependency checks
├── ISSUE_TEMPLATE/
│   ├── bug_report.md           # Bug report template
│   └── feature_request.md      # Feature request template
├── PULL_REQUEST_TEMPLATE.md    # PR template
├── SECURITY.md                 # Security policy
├── FUNDING.yml                 # Sponsorship (optional)
└── WORKFLOWS.md                # This file
```

---

## What's Automated Now

- **Testing:** Every push and PR
- **Building:** Verified on every change
- **Security:** Weekly scans + PR checks
- **Releases:** Tag → GitHub Release + npm
- **Dependencies:** Reviewed on PRs
- **Issues:** Structured templates
- **PRs:** Guided contribution process

---

## Troubleshooting

### Workflows not running?
- Check: https://github.com/daveylupes/soroban-trace/actions
- Verify: Workflows are in `.github/workflows/`
- Ensure: Files are committed and pushed

### Release workflow fails?
- Check: NPM_TOKEN secret is set
- Verify: Tag format is `v*` (e.g., v0.1.1)
- Ensure: Tests pass before tagging

### Tests failing?
- Run locally: `npm test`
- Check: All dependencies installed
- Verify: Node version matches

---

Your project now has professional CI/CD automation! 🚀

