# Publishing Guide

Quick guide for releasing new versions of Servios.

## Semantic Versioning

- **PATCH** (`1.0.0 → 1.0.1`) - Bug fixes, docs, types
- **MINOR** (`1.0.0 → 1.1.0`) - New features (backward compatible)
- **MAJOR** (`1.0.0 → 2.0.0`) - Breaking changes

## Release Steps

1. **Make changes** and test

2. **Update CHANGELOG.md**
   ```markdown
   ## [Unreleased]

   ### Added
   - New feature description

   ### Fixed
   - Bug fix description
   ```

3. **Bump version**
   ```bash
   npm version patch   # Bug fix
   npm version minor   # New feature
   npm version major   # Breaking change
   ```

4. **Publish**
   ```bash
   npm publish --access public
   ```

5. **Update changelog** - Move `[Unreleased]` to new version with date

## Quick Reference

| Change | Command | Example |
|--------|---------|---------|
| Bug fix | `npm version patch` | 1.0.0 → 1.0.1 |
| New feature | `npm version minor` | 1.0.0 → 1.1.0 |
| Breaking change | `npm version major` | 1.0.0 → 2.0.0 |

---

That's it! Keep it simple, ship fast 🚀
