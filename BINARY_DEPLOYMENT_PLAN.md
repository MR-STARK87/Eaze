# Eaze Language - Binary Deployment Plan
## Shipping an Installable, Standalone Executable with Zero Dependencies

---

## Executive Summary

Eaze is a beginner-friendly custom programming language with:
- **CLI REPL** for interactive code execution
- **Standalone interpreter** for running `.eaze` files
- **Optional AI Server** for explanation, debugging, and code conversion features
- **Current dependencies**: `chalk` (colors), `figures` (icons), `express`, `cors`, `dotenv`, `openai`

**Goal**: Create a single, universally installable binary that runs without Node.js or any external dependencies.

---

## Project Structure Analysis

```
eaze/
├── cli/
│   └── index.js                 # Main REPL interface
├── engine/
│   ├── lexer.js                 # Tokenization
│   ├── parser.js                # AST generation
│   ├── interpreter.js           # Execution engine
│   ├── runtime.js               # Environment/scope management
│   └── errors.js                # Error definitions
├── server/
│   ├── index.js                 # AI Assistant server (optional)
│   └── package.json             # Server dependencies
├── examples/
│   ├── calculator.eaze
│   ├── fibonacci.eaze
│   └── guessing_game.eaze
├── documentation/
├── package.json                 # Main project metadata
└── package-lock.json
```

### Current Dependencies

**Main CLI:**
- `chalk@^5.3.0` - Terminal colors
- `figures@^6.0.0` - Unicode symbols

**Optional Server:**
- `express@^4.19.2` - Web framework
- `cors@^2.8.5` - CORS middleware
- `dotenv@^16.4.5` - Environment variables
- `openai@^4.38.2` - AI API client

---

## Phase 1: Eliminate External Dependencies

### 1.1 Remove Chalk (Terminal Colors)

**Current Usage**: Color output in CLI
**Solution**: Implement native ANSI color codes

**Action Items:**
- [ ] Create `cli/colors.js` - Pure JavaScript ANSI color utilities
- [ ] Replace all `chalk.rgb()`, `chalk.white()` calls with ANSI equivalents
- [ ] Test color output on Windows, macOS, and Linux

**Code Template:**
```javascript
// cli/colors.js
export const colors = {
  primary: (text) => `\x1b[38;5;75m${text}\x1b[0m`,      // Blue
  secondary: (text) => `\x1b[38;5;208m${text}\x1b[0m`,    // Orange
  success: (text) => `\x1b[38;2;76;175;80m${text}\x1b[0m`, // Green
  error: (text) => `\x1b[38;2;244;67;54m${text}\x1b[0m`,   // Red
  warning: (text) => `\x1b[38;2;255;193;7m${text}\x1b[0m`, // Yellow
  accent: (text) => `\x1b[38;2;156;39;176m${text}\x1b[0m`, // Purple
  muted: (text) => `\x1b[38;5;244m${text}\x1b[0m`,         // Gray
};
```

### 1.2 Remove Figures (Unicode Icons)

**Current Usage**: Decorative icons in UI (✨, ✖, →, ║, etc.)

**Solution**: Use built-in Unicode characters or simpler ASCII fallbacks

**Action Items:**
- [ ] Replace `figures` library calls with direct Unicode strings
- [ ] Test Unicode rendering on all platforms (fallback to ASCII if needed)
- [ ] Update all UI elements in `cli/index.js`

**Mapping:**
- `figures.tick` → `✓`
- `figures.cross` → `✖`
- `figures.line` → `|`
- `figures.lineVertical` → `║`

---

## Phase 2: Create a Standalone CLI Binary

### 2.1 Use `pkg` (Node.js Bundler to Binary)

**Tool Selection**: `pkg` by Zeit
- Bundles Node.js + code into a single executable
- Supports Windows, macOS, Linux
- ~50-80MB final binary size
- Most reliable for Node.js projects

**Alternative Tools:**
- **`nexe`**: Similar to `pkg`, slightly smaller binaries
- **`vercel/ncc`**: Code bundler (doesn't remove Node.js dependency)
- **`esbuild`**: Code bundler with tree-shaking
- **Rewrite in Go/Rust**: Complete rewrite (time-intensive)

**Recommendation**: Use `pkg` for Phase 2, consider Rust rewrite for Phase 4.

### 2.2 Build Configuration

**Install pkg:**
```bash
npm install -g pkg
```

**Create `pkg.json` (package.json config addition):**
```json
{
  "pkg": {
    "targets": [
      "node22-win-x64",
      "node22-macos-x64",
      "node22-macos-arm64",
      "node22-linux-x64"
    ],
    "output": "bin/eaze",
    "scripts": ["cli/index.js", "engine/**/*.js"],
    "assets": [],
    "compress": "Brotli"
  }
}
```

**Build Command:**
```bash
npm run build:binary
```

**Add to package.json:**
```json
{
  "scripts": {
    "build:binary": "pkg . --compress Brotli",
    "build:binary:win": "pkg . --targets node22-win-x64 --compress Brotli",
    "build:binary:mac": "pkg . --targets node22-macos-x64,node22-macos-arm64 --compress Brotli",
    "build:binary:linux": "pkg . --targets node22-linux-x64 --compress Brotli"
  }
}
```

### 2.3 Modifications for `pkg` Compatibility

**Action Items:**
- [ ] Update file paths to use `__dirname` (ESM compatibility)
- [ ] Ensure all imports are static (no dynamic requires)
- [ ] Test binary with sample `.eaze` files
- [ ] Create installer scripts

---

## Phase 3: Optional AI Server (Modular)

### 3.1 Keep Server as Separate Component

**Rationale:**
- Server requires OpenAI API key (security concern)
- AI features are optional, not core functionality
- Reduces main binary size significantly
- Can be installed separately if needed

**Options:**
1. **Exclude from main binary**: Users can install server separately if desired
2. **Optional plugin architecture**: Detect and use if available locally
3. **Deferred installation**: Offer optional install after first run

**Recommendation**: Exclude from main binary, provide separate installation instructions.

### 3.2 Server as Separate Installable

```bash
# Users who want AI features can install separately
npm install -g eaze-ai-server
eaze-ai-server --port 3001 --api-key YOUR_KEY
```

Or package server separately:
```bash
pkg server/index.js --targets node22-win-x64,node22-macos-x64,node22-linux-x64 --output bin/eaze-ai-server
```

---

## Phase 4: Distribution & Installation

### 4.1 GitHub Releases

**Action Items:**
- [ ] Create GitHub Actions workflow for automatic binary building
- [ ] Publish binaries to GitHub Releases on version tags
- [ ] Create release notes with installation instructions
- [ ] Sign binaries (optional for security)

**Supported Platforms:**
- Windows (x64)
- macOS (x64, ARM64 for M1/M2)
- Linux (x64)

### 4.2 Platform-Specific Installation

#### Windows Installation
```bash
# Via direct download (recommended)
1. Download eaze.exe from GitHub Releases
2. Add to PATH or run directly: eaze.exe script.eaze

# Via installer (advanced)
1. Create .msi installer using WiX Toolset
2. Installs to Program Files
3. Auto-adds to PATH
```

#### macOS Installation
```bash
# Via curl
curl -L https://github.com/eaze/releases/download/v1.0.0/eaze-macos-x64 > /usr/local/bin/eaze
chmod +x /usr/local/bin/eaze

# Via Homebrew (requires brew formula)
brew tap eaze/eaze
brew install eaze
```

#### Linux Installation
```bash
# Via curl
curl -L https://github.com/eaze/releases/download/v1.0.0/eaze-linux-x64 > /usr/local/bin/eaze
chmod +x /usr/local/bin/eaze

# Via package managers (apt, yum, etc.) - requires packaging
```

### 4.3 GitHub Actions Workflow

**Create `.github/workflows/build-binary.yml`:**
```yaml
name: Build Binary

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build:binary:${{ matrix.os == 'ubuntu-latest' && 'linux' || matrix.os == 'windows-latest' && 'win' || 'mac' }}
      - uses: softprops/action-gh-release@v1
        with:
          files: bin/eaze*
```

---

## Phase 5: Advanced - Rust Rewrite (Optional, Long-term)

### 5.1 Why Rewrite in Rust?

**Pros:**
- Single binary, truly zero dependencies
- Smaller binary size (~15-30MB vs 50-80MB)
- Faster execution
- Native compilation per OS
- Better long-term maintainability

**Cons:**
- Complete rewrite required
- Steeper learning curve
- More development time (2-4 weeks)
- Different debugging experience

### 5.2 Implementation Plan (if pursued)

1. **Port lexer**: Rust String parsing
2. **Port parser**: AST generation in Rust
3. **Port interpreter**: Evaluation engine
4. **Port runtime**: Environment/scope management
5. **Create CLI**: Using `clap` for argument parsing
6. **Test parity**: Ensure identical behavior to JavaScript version

**Tools:**
- **clap** - CLI argument parsing
- **colored** - Terminal colors (native)
- **serde** - Serialization (for AST output)

---

## Implementation Roadmap

### Week 1: Dependency Removal
- [ ] Create `cli/colors.js` with ANSI codes
- [ ] Replace `chalk` usage throughout CLI
- [ ] Replace `figures` with Unicode strings
- [ ] Remove dependencies from package.json
- [ ] Test CLI locally
- [ ] **Deliverable**: Zero-dependency CLI

### Week 2: Binary Creation & Testing
- [ ] Install and configure `pkg`
- [ ] Create `pkg.json` configuration
- [ ] Build test binaries for all platforms
- [ ] Test binaries with sample `.eaze` files
- [ ] Verify REPL functionality
- [ ] Document any platform-specific issues
- [ ] **Deliverable**: Working binary builds for all platforms

### Week 3: Distribution Setup
- [ ] Create GitHub Actions workflow
- [ ] Set up repository for releases
- [ ] Create installation documentation
- [ ] Build and publish v1.0.0 release
- [ ] Test installation on each platform
- [ ] **Deliverable**: Published binaries with instructions

### Week 4: Polish & Documentation
- [ ] Create installation guide (Windows/macOS/Linux)
- [ ] Add quick-start examples
- [ ] Create troubleshooting guide
- [ ] Update main README
- [ ] Add uninstall instructions
- [ ] **Deliverable**: Complete user documentation

---

## Technical Implementation Details

### File Changes Required

#### 1. `cli/index.js` Modifications

**Current:**
```javascript
import chalk from "chalk";
import figures from "figures";
```

**New:**
```javascript
import { colors } from "./colors.js";
```

**Replace all color calls:**
```javascript
// Old
chalk.rgb(106, 153, 255)("text")

// New
colors.primary("text")
```

#### 2. Create `cli/colors.js`

```javascript
export const colors = {
  primary: (text) => `\x1b[38;5;75m${text}\x1b[0m`,
  secondary: (text) => `\x1b[38;5;208m${text}\x1b[0m`,
  success: (text) => `\x1b[38;2;76;175;80m${text}\x1b[0m`,
  error: (text) => `\x1b[38;2;244;67;54m${text}\x1b[0m`,
  warning: (text) => `\x1b[38;2;255;193;7m${text}\x1b[0m`,
  accent: (text) => `\x1b[38;2;156;39;172m${text}\x1b[0m`,
  muted: (text) => `\x1b[38;5;244m${text}\x1b[0m`,
  highlight: (text) => `\x1b[38;2;255;87;34m${text}\x1b[0m`,
};

export const figures = {
  tick: "✓",
  cross: "✖",
  arrowRight: "→",
  lineVertical: "║",
  lineHorizontal: "═",
  topLeft: "╔",
  topRight: "╗",
  bottomLeft: "╚",
  bottomRight: "╝",
  cross: "╬",
  tee: "╠",
  teeRight: "╣",
  line: "|",
  ellipsis: "⋮",
  heart: "♥",
  star: "✨",
  info: "ℹ",
  warning: "⚠",
  squareFilled: "█",
  bullet: "•",
};
```

#### 3. Update `package.json`

Remove dependencies:
```json
{
  "name": "eaze",
  "version": "1.0.0",
  "description": "Eaze - A custom programming language with an AI assistant",
  "main": "engine/interpreter.js",
  "type": "module",
  "scripts": {
    "start": "node cli/index.js",
    "test": "node --test",
    "build:binary": "pkg . --compress Brotli",
    "build:binary:win": "pkg . --targets node22-win-x64 --compress Brotli",
    "build:binary:mac": "pkg . --targets node22-macos-x64,node22-macos-arm64 --compress Brotli",
    "build:binary:linux": "pkg . --targets node22-linux-x64 --compress Brotli"
  },
  "keywords": ["language", "interpreter", "ast"],
  "author": "",
  "license": "ISC",
  "dependencies": {},
  "devDependencies": {
    "pkg": "^5.8.1"
  },
  "pkg": {
    "targets": [
      "node22-win-x64",
      "node22-macos-x64",
      "node22-macos-arm64",
      "node22-linux-x64"
    ],
    "output": "bin/eaze",
    "scripts": ["cli/index.js", "engine/**/*.js"],
    "compress": "Brotli"
  }
}
```

#### 4. Create `.github/workflows/build-binary.yml`

```yaml
name: Build Binary

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: linux-x64
            output: eaze
          - os: windows-latest
            target: win-x64
            output: eaze.exe
          - os: macos-latest
            target: macos-x64
            output: eaze
          - os: macos-latest
            target: macos-arm64
            output: eaze-arm64

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - run: npm ci
      
      - run: npm run build:binary -- --targets node22-${{ matrix.target }}
        shell: bash
      
      - run: |
          mkdir -p build
          cp bin/eaze* build/
        shell: bash
      
      - uses: softprops/action-gh-release@v1
        with:
          files: build/eaze*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Installation Instructions Template

### For End Users

#### Windows
```
1. Download eaze-win-x64.exe from GitHub Releases
2. Place in a directory or add directory to PATH
3. Run: eaze.exe script.eaze
   or: eaze (for REPL)
```

#### macOS
```
curl -L https://github.com/yourusername/eaze/releases/download/v1.0.0/eaze-macos-x64 -o /usr/local/bin/eaze
chmod +x /usr/local/bin/eaze
eaze script.eaze
```

#### Linux
```
curl -L https://github.com/yourusername/eaze/releases/download/v1.0.0/eaze-linux-x64 -o /usr/local/bin/eaze
chmod +x /usr/local/bin/eaze
eaze script.eaze
```

---

## Success Metrics

✅ **Binary ships with NO external dependencies**
✅ **Single executable file per platform**
✅ **Works out-of-the-box (no Node.js required)**
✅ **REPL functionality fully preserved**
✅ **File execution works correctly**
✅ **All error handling preserved**
✅ **Installation <= 5 minutes**

---

## Risk Assessment & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| ANSI color codes not supported on Windows | Medium | Low | Fallback to basic colors or flag |
| Binary size too large (>100MB) | Medium | Medium | Use compression, consider Rust rewrite |
| Cross-platform binary issues | High | Medium | Comprehensive testing on all platforms |
| Users can't find binary in PATH | Low | Medium | Provide clear installation instructions |
| Unicode rendering issues | Low | Medium | Fallback to ASCII alternatives |

---

## Estimated Timeline

- **Phase 1 (Dependency Removal)**: 2-3 days
- **Phase 2 (Binary Creation)**: 3-4 days  
- **Phase 3 (Server Separation)**: 1 day
- **Phase 4 (Distribution)**: 2-3 days
- **Testing & Polish**: 2-3 days

**Total: ~2 weeks for complete implementation**

---

## Future Enhancements

1. **Automatic Updates**: Implement auto-update mechanism
2. **Package Managers**: Create packages for Homebrew, Chocolatey, apt
3. **Installer GUIs**: Create Windows .msi and macOS .dmg installers
4. **Rust Rewrite**: Eliminate Node.js entirely (~4 weeks)
5. **VSCode Extension**: With syntax highlighting and Eaze debugger
6. **Web IDE**: Hosted version for zero-install option

---

## Conclusion

This plan provides a clear path to ship Eaze as a standalone, dependency-free binary within 2-3 weeks. Phase 1-4 maintains the JavaScript/Node.js architecture using `pkg` for bundling, while Phase 5 offers a longer-term Rust rewrite option for even better performance and distribution.

The recommended immediate approach: **Complete Phase 1 & 2 this week, publish Phase 3-4 releases next week.**
