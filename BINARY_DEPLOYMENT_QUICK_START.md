# EAZE BINARY DEPLOYMENT - QUICK START SUMMARY

## What We're Shipping
A **standalone executable** for Windows, macOS, and Linux that runs Eaze without requiring Node.js or npm.

## Current State
- ✅ JavaScript/Node.js based interpreter (working perfectly)
- ✅ CLI REPL with rich UI (chalk, figures libraries)
- ✅ `.eaze` file execution
- ❌ Requires Node.js to run
- ❌ Has external npm dependencies

## End Goal
```
User downloads: eaze.exe (Windows) or eaze (macOS/Linux)
User runs:      eaze hello.eaze  OR  eaze (for REPL)
No installation, no Node.js, no npm needed ✨
```

---

## The 4-Phase Plan

### PHASE 1: Remove Dependencies (2-3 days)
**Action**: Replace external libraries with native code
- `chalk` → Native ANSI color codes
- `figures` → Unicode characters directly
- Result: Zero npm dependencies, pure JavaScript

**Files to create:**
- `cli/colors.js` - ANSI color utilities

**Files to modify:**
- `cli/index.js` - Update imports and color calls
- `package.json` - Remove chalk/figures dependencies

### PHASE 2: Build Binaries (3-4 days)
**Action**: Use `pkg` tool to bundle Node.js + code into executable
- Single executable per platform (Windows x64, macOS x64/ARM64, Linux x64)
- Binary size: ~50-80MB (compressed)
- No Node.js required to run

**Commands:**
```bash
npm install pkg
npm run build:binary:win      # Windows
npm run build:binary:mac      # macOS (both architectures)
npm run build:binary:linux    # Linux
```

**Result**: Binaries in `bin/` folder

### PHASE 3: Handle AI Server (1 day)
**Action**: Keep server separate (optional addon)
- Main binary stays lightweight
- Users who want AI can install separately
- No OpenAI API key in main binary

**For now**: Exclude from main binary, document separate installation

### PHASE 4: Publish & Distribute (2-3 days)
**Action**: Set up GitHub Actions to auto-build & release
- Create `.github/workflows/build-binary.yml`
- Tag releases (v1.0.0, etc.) 
- GitHub Actions automatically builds all platforms
- Publish to GitHub Releases

**Installation for users:**
```bash
# Windows: Download eaze.exe from releases
# macOS: curl -L [...] -o /usr/local/bin/eaze && chmod +x /usr/local/bin/eaze
# Linux: Same as macOS
```

---

## Implementation Order (Week by Week)

| Week | Phase | Tasks | Deliverable |
|------|-------|-------|-------------|
| 1 | 1-2 | Remove chalk/figures, build binaries | Working Windows/macOS/Linux executables |
| 2 | 3-4 | Separate server, set up CI/CD, publish | First release on GitHub |
| - | - | Testing & polish | Full documentation |

---

## What Needs to Change

### 1. Create `cli/colors.js`
Simple ANSI color functions (no external library)

### 2. Modify `cli/index.js`
Replace `chalk` with `colors`, replace `figures` with Unicode strings

### 3. Update `package.json`
```json
{
  "dependencies": {},  // NOW EMPTY!
  "devDependencies": {
    "pkg": "^5.8.1"
  },
  "pkg": {
    "targets": ["node22-win-x64", "node22-macos-x64", "node22-macos-arm64", "node22-linux-x64"],
    "output": "bin/eaze"
  },
  "scripts": {
    "build:binary": "pkg . --compress Brotli",
    "build:binary:win": "pkg . --targets node22-win-x64 --compress Brotli",
    "build:binary:mac": "pkg . --targets node22-macos-x64,node22-macos-arm64 --compress Brotli",
    "build:binary:linux": "pkg . --targets node22-linux-x64 --compress Brotli"
  }
}
```

### 4. Create `.github/workflows/build-binary.yml`
GitHub Actions to auto-build on tag push

---

## Key Design Decisions

✅ **Keep it JavaScript/Node.js for now**
- Faster delivery (2 weeks vs 4+ weeks)
- Easier maintenance
- Can upgrade to Rust later

✅ **Use `pkg` for bundling**
- Most reliable for Node.js apps
- ~50-80MB binaries (reasonable)
- Supports all major platforms

✅ **Separate AI server**
- Reduces complexity
- No API keys in binary
- Users opt-in if they want AI features

✅ **GitHub Releases for distribution**
- Free hosting
- Automatic via CI/CD
- Easy for users to download

---

## Success Criteria

- [ ] Single executable per platform (no Node.js required)
- [ ] REPL works identically to `node cli/index.js`
- [ ] File execution works: `eaze script.eaze`
- [ ] All colors/formatting preserved
- [ ] Cross-platform tested
- [ ] Installation guide complete

---

## Optional: Rust Rewrite (Future)

If we want even smaller binaries and better performance:
- Complete port to Rust (~4 weeks)
- Binary size: 15-30MB
- No Node.js at all
- Phase 5 in full plan

For now, let's go with Phase 1-4 (pkg approach) ⚡

---

## Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Start Phase 1** - Remove dependencies from CLI
3. **Test Phase 2** - Build first test binary
4. **Setup Phase 4** - Create GitHub Actions workflow
5. **Publish v1.0.0** - First public release

**Estimated effort: 10-14 days of work** (can be parallelized)

---

## Files & Docs Reference

- **Full plan**: `BINARY_DEPLOYMENT_PLAN.md` (detailed, 591 lines)
- **This file**: Quick reference (you are here!)
- **Implementation guide**: Each phase has code examples

Questions? Check BINARY_DEPLOYMENT_PLAN.md for full technical details.
