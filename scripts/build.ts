#!/usr/bin/env bun
// Build script for restored Claude Code source
// Strategy: replace feature() → literals, then create stubs for ALL missing modules
// so bun's static require() resolution succeeds.

import {
  cpSync, mkdirSync, writeFileSync, readFileSync,
  existsSync, rmSync, readdirSync
} from 'fs'
import { execSync } from 'child_process'
import { join, relative, dirname, resolve } from 'path'

const ROOT = resolve(import.meta.dir, '..')
const BUILD_DIR = join(ROOT, 'build-src')
const SRC_DIR = join(ROOT, 'src')

// Only enable features whose modules actually exist in our source
const ENABLED_FLAGS = new Set([
  'TRANSCRIPT_CLASSIFIER', 'BASH_CLASSIFIER', 'TREE_SITTER_BASH_SHADOW',
  'TEAMMEM', 'MCP_SKILLS', 'CACHED_MICROCOMPACT', 'AUTO_THEME',
  'CONNECTOR_TEXT', 'TOKEN_BUDGET', 'AGENT_MEMORY_SNAPSHOT',
  'VERIFICATION_AGENT', 'UPLOAD_USER_SETTINGS', 'CCR_MIRROR',
  'MCP_TOOLS', 'PLUGINS', 'SKILLS', 'AUTO_MODE', 'PLAN_MODE',
  'TEAMS', 'WORKTREES', 'DAEMON_BG', 'CHUNKED_MCP',
  'CODE_EDITOR_TOOLS', 'CODE_EDITOR_PERMISSIONS', 'SCHEDULED_TASKS',
  'BRIEF_MODE', 'PROGRESS_SUMMARIES', 'BUDGET_CONTINUATION',
  'ABLATION_BASELINE', 'DUMP_SYSTEM_PROMPT', 'CHICAGO_MCP',
  'DAEMON', 'TEMPLATES', 'BYOC_ENVIRONMENT_RUNNER',
  'SELF_HOSTED_RUNNER', 'COORDINATOR_MODE',
  'MEMORY_SHAPE_TELEMETRY',
  'BUDDY',
])

// ── Helpers ──
function readdirRecursive(dir: string): string[] {
  const result: string[] = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const d of entries) {
      const full = join(dir, d.name)
      if (d.isDirectory() && d.name !== 'node_modules' && d.name !== '_vendored') {
        result.push(...readdirRecursive(full))
      } else if (d.name.endsWith('.ts') || d.name.endsWith('.tsx')) {
        result.push(full)
      }
    }
  } catch {}
  return result
}

function moduleFileExists(fileDir: string, reqPath: string): string | null {
  const resolved = resolve(fileDir, reqPath)
  // Check exact path first
  if (existsSync(resolved)) return resolved
  // Check with extensions (handles .js → .ts resolution)
  const base = resolved.replace(/\.js$/, '')
  for (const ext of ['.ts', '.tsx', '.js', '.json']) {
    if (existsSync(base + ext)) return base + ext
  }
  // Check index files
  for (const ext of ['/index.ts', '/index.tsx', '/index.js']) {
    if (existsSync(base + ext)) return base + ext
  }
  return null
}

// ── Step 1: Clean and copy ──
console.log('Step 1: Copying src/ to build-src/...')
if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true })
cpSync(SRC_DIR, BUILD_DIR, { recursive: true })

const files = readdirRecursive(BUILD_DIR)
console.log(`Found ${files.length} source files`)

// ── Step 2: Replace feature() calls and remove bun:bundle imports ──
console.log('\nStep 2: Replacing feature() calls...')
let featureCallCount = 0
for (const file of files) {
  let content = readFileSync(file, 'utf-8')

  // Remove import { feature } from 'bun:bundle'
  content = content.replace(
    /import\s*\{[^}]*\bfeature\b[^}]*\}\s*from\s*['"]bun:bundle['"]\s*;?\n?/g,
    (match) => {
      const allImports = match.match(/\{([^}]*)\}/)?.[1] || ''
      const remaining = allImports
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== 'feature')
        .join(', ')
      if (remaining) return `import { ${remaining} } from 'bun:bundle'\n`
      return ''
    }
  )

  // Replace feature('FLAG') with true/false
  const prev = content
  content = content.replace(/feature\s*\(\s*['"]([A-Z_]+)['"]\s*\)/g, (_match, flag) => {
    featureCallCount++
    return ENABLED_FLAGS.has(flag) ? 'true' : 'false'
  })

  if (content !== prev) writeFileSync(file, content)
}
console.log(`Replaced ${featureCallCount} feature() calls`)

// ── Step 2b: Replace useEffectEvent with polyfill ──
console.log('\nStep 2b: Polyfilling useEffectEvent...')
let useEffectEventCount = 0
for (const file of files) {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue
  let content = readFileSync(file, 'utf-8')
  let modified = false

  // Check if file uses useEffectEvent
  if (!content.includes('useEffectEvent')) continue

  // Replace import of useEffectEvent from 'react' with import from our polyfill
  // Also compute relative path to polyfill
  const fileDir = dirname(file)
  const polyfillPath = relative(fileDir, join(BUILD_DIR, 'shims/react-polyfill.js'))
  const polyfillImport = polyfillPath.startsWith('.') ? polyfillPath : './' + polyfillPath

  // Pattern: import { ..., useEffectEvent, ... } from 'react'
  content = content.replace(
    /import\s+(\w+)\s*,?\s*\{([^}]*)\}\s*from\s*['"]react['"]/g,
    (match, defaultImport, namedImports) => {
      if (!namedImports.includes('useEffectEvent')) return match
      const remaining = namedImports
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== 'useEffectEvent')
        .join(', ')
      modified = true
      useEffectEventCount++
      let result = `import { useEffectEvent } from '${polyfillImport}'\n`
      if (defaultImport) {
        result += `import ${defaultImport}${remaining ? `, { ${remaining} }` : ''} from 'react'`
      } else if (remaining) {
        result += `import { ${remaining} } from 'react'`
      }
      return result
    }
  )

  // Pattern: import { ..., useEffectEvent, ... } from 'react' (no default import)
  content = content.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]react['"]/g,
    (match, namedImports) => {
      if (!namedImports.includes('useEffectEvent')) return match
      // Check if already replaced (has polyfill import)
      if (content.includes(`from '${polyfillImport}'`)) return match
      const remaining = namedImports
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== 'useEffectEvent')
        .join(', ')
      modified = true
      useEffectEventCount++
      let result = `import { useEffectEvent } from '${polyfillImport}'\n`
      if (remaining) {
        result += `import { ${remaining} } from 'react'`
      }
      return result
    }
  )

  if (modified) writeFileSync(file, content)
}
console.log(`Polyfilled useEffectEvent in ${useEffectEventCount} files`)

// ── Step 3: Collect ALL missing require() targets ──
console.log('\nStep 3: Finding missing modules...')
const missingModules = new Map<string, string[]>() // normalized path → [source files]

for (const file of files) {
  const fileDir = dirname(file)
  const content = readFileSync(file, 'utf-8')
  const reqRegex = /require\s*\(\s*'([^']+)'\s*\)/g
  let match
  while ((match = reqRegex.exec(content)) !== null) {
    const reqPath = match[1]
    if (!reqPath.startsWith('.')) continue
    if (moduleFileExists(fileDir, reqPath)) continue
    const resolved = resolve(fileDir, reqPath)
    if (!missingModules.has(resolved)) missingModules.set(resolved, [])
    missingModules.get(resolved)!.push(file)
  }
}
console.log(`Found ${missingModules.size} missing modules`)

// ── Step 4: Create stub files for ALL missing modules ──
console.log('\nStep 4: Creating stubs...')
let stubCount = 0
for (const resolvedPath of missingModules.keys()) {
  // Check if a .ts/.tsx version exists (avoid shadowing real source files)
  const base = resolvedPath.replace(/\.js$/, '')
  const tsExists = ['.ts', '.tsx', '.js'].some(ext => existsSync(base + ext))
  if (tsExists) continue

  // Determine the stub file path
  let stubPath = resolvedPath.endsWith('.js') ? resolvedPath : resolvedPath + '.js'
  const stubDir = dirname(stubPath)
  mkdirSync(stubDir, { recursive: true })

  writeFileSync(stubPath, `// Auto-generated stub for missing module
export default {}
export const _stub = true
`)
  stubCount++
}
console.log(`Created ${stubCount} stub files`)

// ── Step 5: Fix 'src/' absolute imports → relative paths ──
console.log('\nStep 5: Fixing src/ absolute imports...')
let importFixCount = 0
for (const file of files) {
  const fileDir = dirname(file)
  let content = readFileSync(file, 'utf-8')

  const prev = content
  content = content.replace(/from\s*['"]src\/([^'"]+)['"]/g, (_match, importPath) => {
    const targetPath = join(BUILD_DIR, importPath)
    let relPath = relative(fileDir, targetPath)
    if (!relPath.startsWith('.')) relPath = './' + relPath
    if (!relPath.endsWith('.js') && !relPath.endsWith('.tsx') && !relPath.endsWith('.ts')) {
      relPath = relPath + '.js'
    }
    return `from '${relPath}'`
  })
  content = content.replace(/require\s*\(\s*['"]src\/([^'"]+)['"]\s*\)/g, (_match, importPath) => {
    const targetPath = join(BUILD_DIR, importPath)
    let relPath = relative(fileDir, targetPath)
    if (!relPath.startsWith('.')) relPath = './' + relPath
    return `require('${relPath}')`
  })

  if (content !== prev) {
    writeFileSync(file, content)
    importFixCount++
  }
}
console.log(`Fixed ${importFixCount} files with src/ imports`)

// ── Step 6: Fix known issues ──
console.log('\nStep 6: Fixing known issues...')

const stateFile = join(BUILD_DIR, 'bootstrap/state.ts')
if (existsSync(stateFile)) {
  let sc = readFileSync(stateFile, 'utf-8')
  if (!sc.includes('isReplBridgeActive')) {
    sc += `\nexport function isReplBridgeActive(): boolean { return false }\n`
    writeFileSync(stateFile, sc)
    console.log('  Added isReplBridgeActive')
  }
}

// ── Step 7: Build ──
console.log('\nStep 7: Building...')
const tsconfigPath = join(ROOT, 'tsconfig.json')
const originalTsconfig = readFileSync(tsconfigPath, 'utf-8')

const buildTsconfig = JSON.parse(originalTsconfig)
buildTsconfig.compilerOptions.paths = {
  "bun:bundle": ["./build-src/shims/bun-bundle.ts"],
  "src/*": ["./build-src/*"],
  "react/compiler-runtime": ["./src/stubs/react-compiler-runtime.ts"],
  "@ant/computer-use-mcp": ["./src/stubs/ant-computer-use-mcp.ts"],
  "@ant/computer-use-mcp/*": ["./src/stubs/ant-computer-use-mcp.ts"],
  "@ant/claude-for-chrome-mcp": ["./src/stubs/ant-claude-for-chrome-mcp.ts"],
  "@ant/claude-for-chrome-mcp/*": ["./src/stubs/ant-claude-for-chrome-mcp.ts"],
  "@ant/computer-use-input": ["./src/stubs/ant-computer-use-input.ts"],
  "@ant/computer-use-swift": ["./src/stubs/ant-computer-use-swift.ts"],
  "@anthropic-ai/claude-agent-sdk": ["./src/stubs/anthropic-claude-agent-sdk.ts"],
  "@anthropic-ai/mcpb": ["./src/stubs/anthropic-mcpb.ts"],
  "@anthropic-ai/mcpb/*": ["./src/stubs/anthropic-mcpb.ts"],
  "@anthropic-ai/sandbox-runtime": ["./src/stubs/anthropic-sandbox-runtime.ts"],
  "@anthropic-ai/sandbox-runtime/*": ["./src/stubs/anthropic-sandbox-runtime.ts"],
  "color-diff-napi": ["./src/native-ts/color-diff/index.ts"],
  "modifiers-napi": ["./src/stubs/modifiers-napi.ts"],
  "audio-capture-napi": ["./src/stubs/audio-capture-napi.ts"],
  "image-processor-napi": ["./src/stubs/image-processor-napi.ts"],
  "url-handler-napi": ["./src/stubs/url-handler-napi.ts"],
  "bun:ffi": ["./src/stubs/bun-ffi.ts"],
}
writeFileSync(tsconfigPath, JSON.stringify(buildTsconfig, null, 2))

try {
  execSync(
    'bun build ./build-src/entrypoints/cli.tsx --outdir ./dist --target node 2>&1',
    { cwd: ROOT, stdio: 'pipe', encoding: 'utf-8' }
  )
  console.log('Build succeeded!')
} catch (e: any) {
  const output = (e.stdout || '') + (e.stderr || '')
  console.error('Build failed!')
  // Print first errors
  const lines = output.split('\n').filter(l => l.trim())
  for (const line of lines.slice(0, 30)) {
    console.error(line)
  }
  writeFileSync(tsconfigPath, originalTsconfig)
  process.exit(1)
}

writeFileSync(tsconfigPath, originalTsconfig)

// ── Step 8: Patch useEffectEvent in dist ──
const distFile = join(ROOT, 'dist/cli.js')

console.log('\nStep 8: Patching useEffectEvent...')
if (existsSync(distFile)) {
  let dc = readFileSync(distFile, 'utf-8')

  // Replace React's useEffectEvent export that goes through resolveDispatcher
  // with a useRef-based polyfill that works with Ink's custom reconciler
  dc = dc.replace(
    /exports\.useEffectEvent\s*=\s*function\s*\(\s*callback\s*\)\s*\{\s*\n?\s*return\s+resolveDispatcher\s*\(\s*\)\.useEffectEvent\s*\(\s*callback\s*\)\s*;?\s*\n?\s*\}/,
    `exports.useEffectEvent = function(callback) {
      var ref = { current: callback };
      return function() {
        var args = Array.prototype.slice.call(arguments);
        return ref.current.apply(null, args);
      };
    }`
  )

  // Also patch any internal ReactDispatcher.useEffectEvent calls
  dc = dc.replace(
    /resolveDispatcher\s*\(\s*\)\s*\.\s*useEffectEvent\s*\(\s*callback\s*\)/g,
    `(function(cb) { var r = {current: cb}; return function() { var a = Array.prototype.slice.call(arguments); return r.current.apply(null, a); }; })(callback)`
  )

  writeFileSync(distFile, dc)
  console.log('  Patched useEffectEvent')
}

// ── Step 9: Add shebang ──
if (existsSync(distFile)) {
  let dc = readFileSync(distFile, 'utf-8')
  if (!dc.startsWith('#!')) {
    dc = '#!/usr/bin/env node\n' + dc
    writeFileSync(distFile, dc)
  }
  try { execSync('chmod +x dist/cli.js', { cwd: ROOT }) } catch {}
}

console.log(`\nDone! Output: ${distFile}`)
