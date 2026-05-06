# EAZE BINARY DEPLOYMENT - IMPLEMENTATION CHECKLIST

Use this document to track progress through all phases.

---

## PHASE 1: DEPENDENCY REMOVAL ✂️

### Task 1.1: Remove Chalk (Terminal Colors)
- [ ] Create `cli/colors.js` with ANSI color functions
- [ ] Test color rendering in terminal
- [ ] Test color rendering on Windows 10+
- [ ] Update `cli/index.js`: import colors
- [ ] Replace all `chalk.rgb()` calls with `colors.primary()`, etc.
- [ ] Replace all `chalk.white()` calls with `colors.primary()` or `chalk.white()`
- [ ] Test REPL colors visually
- [ ] Test file execution colors visually

### Task 1.2: Remove Figures (Unicode Icons)
- [ ] Update `cli/index.js`: remove `import figures from "figures"`
- [ ] Create `cli/colors.js` export: `figures` object with Unicode characters
- [ ] Replace `figures.tick` → `✓`
- [ ] Replace `figures.cross` → `✖`
- [ ] Replace `figures.line` → `|`
- [ ] Replace `figures.lineVertical` → `║`
- [ ] Test all box-drawing characters render correctly
- [ ] Test all icons display in REPL

### Task 1.3: Update Package.json
- [ ] Remove `"chalk": "^5.3.0"` from dependencies
- [ ] Remove `"figures": "^6.0.0"` from dependencies
- [ ] Verify `"dependencies": {}` is empty
- [ ] Verify `"type": "module"` is still present
- [ ] Add `"devDependencies": { "pkg": "^5.8.1" }`
- [ ] Add build scripts to `"scripts"`
- [ ] Add `"pkg"` config object
- [ ] Run `npm ci` to verify install works

### Task 1.4: Testing
- [ ] Run `npm start` - REPL starts and looks good
- [ ] Run `npm start examples/calculator.eaze` - executes correctly
- [ ] Verify all colors display properly
- [ ] Verify all Unicode characters display properly
- [ ] Check for any console errors
- [ ] Test on Windows (if available)
- [ ] Test on macOS (if available)
- [ ] Test on Linux (if available)

**Completion Criteria:**
- ✅ No external dependencies
- ✅ REPL works identically
- ✅ Colors and icons display correctly
- ✅ All tests pass

---

## PHASE 2: BINARY CREATION 📦

### Task 2.1: Install and Configure pkg
- [ ] Install pkg globally: `npm install -g pkg`
- [ ] Verify installation: `pkg --version`
- [ ] Verify Node version is 22: `node --version`

### Task 2.2: Build Configuration
- [ ] Verify `package.json` has `"pkg"` config (from Phase 1)
- [ ] Verify targets include all platforms:
  - `"node22-win-x64"` ✓
  - `"node22-macos-x64"` ✓
  - `"node22-macos-arm64"` ✓
  - `"node22-linux-x64"` ✓
- [ ] Verify output path is `"bin/eaze"`
- [ ] Verify compression is `"Brotli"`

### Task 2.3: Build All Platforms
- [ ] Create `bin/` directory: `mkdir -p bin`
- [ ] Build Windows: `npm run build:binary:win`
  - [ ] Verify `bin/eaze.exe` exists
  - [ ] Check file size (should be ~50-80MB)
- [ ] Build macOS: `npm run build:binary:mac`
  - [ ] Verify `bin/eaze-macos-x64` exists
  - [ ] Verify `bin/eaze-macos-arm64` exists
  - [ ] Check file sizes
- [ ] Build Linux: `npm run build:binary:linux`
  - [ ] Verify `bin/eaze-linux-x64` exists
  - [ ] Check file size

### Task 2.4: Test Binaries (Windows)
- [ ] `bin/eaze.exe` - starts REPL
- [ ] `bin/eaze.exe examples/calculator.eaze` - runs file
- [ ] Type `help` in REPL - shows help menu
- [ ] Type `vars` in REPL - shows variables
- [ ] Type `exit` in REPL - exits cleanly
- [ ] Colors display correctly
- [ ] Icons display correctly

### Task 2.5: Test Binaries (macOS x64)
- [ ] Make executable: `chmod +x bin/eaze-macos-x64`
- [ ] `./bin/eaze-macos-x64` - starts REPL
- [ ] `./bin/eaze-macos-x64 examples/calculator.eaze` - runs file
- [ ] Colors display correctly
- [ ] Icons display correctly
- [ ] No errors in output

### Task 2.6: Test Binaries (macOS ARM64)
- [ ] Make executable: `chmod +x bin/eaze-macos-arm64`
- [ ] `./bin/eaze-macos-arm64` - starts REPL (if on M1/M2 Mac)
- [ ] `./bin/eaze-macos-arm64 examples/calculator.eaze` - runs file
- [ ] Colors display correctly
- [ ] Icons display correctly

### Task 2.7: Test Binaries (Linux)
- [ ] Make executable: `chmod +x bin/eaze-linux-x64`
- [ ] `./bin/eaze-linux-x64` - starts REPL
- [ ] `./bin/eaze-linux-x64 examples/calculator.eaze` - runs file
- [ ] Colors display correctly
- [ ] Icons display correctly
- [ ] No errors in output

### Task 2.8: Cross-Platform Compatibility
- [ ] Test all example files with all binaries:
  - [ ] `examples/calculator.eaze`
  - [ ] `examples/fibonacci.eaze`
  - [ ] `examples/guessing_game.eaze`
- [ ] Verify identical output on all platforms
- [ ] Test error handling works correctly
- [ ] Test multi-line input (loops, conditionals)

**Completion Criteria:**
- ✅ Binaries exist for all 4 targets
- ✅ All binaries are executable
- ✅ All binaries run REPL and files correctly
- ✅ All platforms produce identical results
- ✅ No Node.js required to run binaries

---

## PHASE 3: AI SERVER SEPARATION 🤖

### Task 3.1: Decide on Server Distribution
- [ ] Confirm: Keep AI server separate (not in main binary)
- [ ] Document: AI server is optional addon
- [ ] Document: OpenAI API key requirement

### Task 3.2: Create Server Installation Instructions
- [ ] Document how to install server separately (if desired)
- [ ] Document how to get OpenAI API key
- [ ] Document server startup command
- [ ] Document server endpoints
- [ ] Note: Server is NOT included in main eaze binary

### Task 3.3: Optional: Build Server Binary (Future)
- [ ] Can be done later if server adoption is high
- [ ] Would require separating server/package.json
- [ ] Would need to handle environment variables

**Completion Criteria:**
- ✅ Clear documentation on server separation
- ✅ Instructions for optional server setup
- ✅ Main binary remains free of AI dependencies

---

## PHASE 4: GITHUB RELEASES & DISTRIBUTION 🚀

### Task 4.1: Create GitHub Actions Workflow
- [ ] Create `.github/workflows/` directory
- [ ] Create `build-binary.yml` workflow file
- [ ] Configure workflow to trigger on version tags (`v*`)
- [ ] Configure matrix for all platforms
- [ ] Test workflow syntax

### Task 4.2: Set Up Repository
- [ ] Ensure repository is on GitHub
- [ ] Verify `.gitignore` excludes `node_modules/` and `bin/`
- [ ] Add `bin/` to `.gitignore`
- [ ] Commit and push all changes

### Task 4.3: Create First Release
- [ ] Tag commit: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Wait for GitHub Actions to complete
- [ ] Verify binaries appear in GitHub Releases:
  - [ ] `eaze.exe` (Windows)
  - [ ] `eaze-macos-x64` (macOS Intel)
  - [ ] `eaze-macos-arm64` (macOS ARM)
  - [ ] `eaze-linux-x64` (Linux)

### Task 4.4: Create Release Notes
- [ ] Add title: "Eaze v1.0.0 - Standalone Binary Release"
- [ ] Add description: What's included
- [ ] Add installation instructions for each platform
- [ ] Add links to documentation
- [ ] Add example usage
- [ ] Publish release

### Task 4.5: Document Installation
- [ ] Create `INSTALLATION.md` in repo root
- [ ] Document Windows installation
  - [ ] Download link
  - [ ] PATH setup
  - [ ] How to run
- [ ] Document macOS installation
  - [ ] curl command
  - [ ] chmod command
  - [ ] PATH location
- [ ] Document Linux installation
  - [ ] curl command
  - [ ] chmod command
  - [ ] PATH location
- [ ] Document uninstallation for each platform

### Task 4.6: Test Installation Process
- [ ] Download Windows binary and test
- [ ] Download macOS binary and test
- [ ] Download Linux binary and test
- [ ] Verify no Node.js required
- [ ] Verify no npm install needed
- [ ] Verify commands work immediately after download

**Completion Criteria:**
- ✅ GitHub Actions workflow is active
- ✅ v1.0.0 release published with all binaries
- ✅ Installation instructions are clear
- ✅ All binaries downloaded and tested

---

## PHASE 5: POLISH & DOCUMENTATION 📚

### Task 5.1: Main README Update
- [ ] Add binary download link to README
- [ ] Add installation section
- [ ] Add quick start examples
- [ ] Update requirements (remove Node.js mention)
- [ ] Add badges (version, downloads, etc.)

### Task 5.2: Create Quick Start Guide
- [ ] Windows quick start
- [ ] macOS quick start
- [ ] Linux quick start
- [ ] Example programs
- [ ] REPL walkthrough

### Task 5.3: Create Troubleshooting Guide
- [ ] "Binary won't run" - common solutions
- [ ] "Colors look wrong" - terminal settings
- [ ] "Command not found" - PATH setup
- [ ] "Permission denied" - chmod issues
- [ ] Platform-specific issues

### Task 5.4: Update Documentation
- [ ] Verify all docs link to binary release
- [ ] Remove any Node.js/npm installation steps
- [ ] Update ARCHITECTURE.md if needed
- [ ] Update FEATURES.md for binary users
- [ ] Add binary usage examples

### Task 5.5: Test Documentation
- [ ] Follow Windows install guide → works
- [ ] Follow macOS install guide → works
- [ ] Follow Linux install guide → works
- [ ] Follow quick start guide → works
- [ ] Find answer in troubleshooting guide

**Completion Criteria:**
- ✅ Clear, comprehensive documentation
- ✅ All install guides tested and verified
- ✅ Troubleshooting covers common issues
- ✅ Ready for public release

---

## OPTIONAL PHASE 5+: FUTURE ENHANCEMENTS 🌟

### For Later (Not Required for v1.0.0)
- [ ] Rust rewrite (5+ weeks)
- [ ] Windows .msi installer
- [ ] macOS .dmg installer
- [ ] Homebrew formula
- [ ] Chocolatey package
- [ ] apt package (Linux)
- [ ] Auto-update mechanism
- [ ] Code signing (security)
- [ ] Telemetry (optional)

---

## SIGN-OFF CHECKLIST

### All Phases Complete?
- [ ] Phase 1: Dependencies removed
- [ ] Phase 2: Binaries build and tested
- [ ] Phase 3: Server separated
- [ ] Phase 4: GitHub releases published
- [ ] Phase 5: Documentation complete

### Quality Checklist
- [ ] No external dependencies in main binary
- [ ] All platforms tested on actual hardware (or CI)
- [ ] All example programs work correctly
- [ ] No console errors or warnings
- [ ] REPL fully functional
- [ ] File execution works
- [ ] Error handling works
- [ ] User experience is smooth

### Ready to Ship?
- [ ] ✅ All tests passed
- [ ] ✅ Documentation complete
- [ ] ✅ Release notes published
- [ ] ✅ Installation verified
- [ ] ✅ No known issues

---

## NOTES & OBSERVATIONS

Use this section to track decisions and findings during implementation:

```
[Date] [Task] [Note]
---
```

---

**Last Updated:** [Today's date]
**Status:** Ready to begin Phase 1
**Next Action:** Create `cli/colors.js` and test
