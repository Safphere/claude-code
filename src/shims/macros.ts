// MACRO globals polyfill - injected at build time by Bun's bundler
;(globalThis as any).MACRO = {
  VERSION: '2.1.89',
  BUILD_TIME: new Date().toISOString(),
  FEEDBACK_CHANNEL: 'https://github.com/anthropics/claude-code/issues',
  ISSUES_EXPLAINER: 'report the issue at https://github.com/anthropics/claude-code/issues',
  PACKAGE_URL: '@anthropic-ai/claude-code',
  README_URL: 'https://code.claude.com/docs/en/overview',
  VERSION_CHANGELOG: '',
}
