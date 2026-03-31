# Claude Code v2.1.88 - Source Restored

> 从 `@anthropic-ai/claude-code@2.1.88` 的 Source Map 完整还原的 TypeScript 源码

## 项目简介

Claude Code 是 Anthropic 推出的 AI 编程助手命令行工具。本项目通过解析 npm 发布包中的 `.js.map` 文件，从 `sources` 和 `sourcesContent` 字段提取并还原了完整的 TypeScript 源码树。

- **原始版本**: `2.1.88`
- **源文件数量**: 2,118 个 `.ts/.tsx` 文件
- **构建工具**: Bun (bundler)
- **运行时**: Node.js >= 18 或 Bun
- **UI 框架**: React 19 + Ink (终端 UI)

## 支持的模型

| 模型 | Model ID | 定价 (输入/输出) |
|------|----------|-----------------|
| Claude Opus 4.6 | `claude-opus-4-6` | $5 / $25 |
| Claude Opus 4.6 Fast | `claude-opus-4-6` (fast) | $30 / $150 |
| Claude Opus 4.5 | `claude-opus-4-5-20251101` | $5 / $25 |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | $3 / $15 |
| Claude Sonnet 4.5 | `claude-sonnet-4-5-20250929` | $3 / $15 |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | $1 / $5 |

支持 1M Context 的模型: Sonnet 4.x 全系列、Opus 4.6

## 项目结构

```
claude-code/
├── src/
│   ├── entrypoints/          # CLI 入口
│   │   └── cli.tsx           # 主入口，Commander.js CLI 定义
│   ├── tools/                # 内置工具集 (50+ 工具)
│   │   ├── BashTool/         # Shell 命令执行
│   │   ├── FileEditTool/     # 文件编辑
│   │   ├── FileReadTool/     # 文件读取
│   │   ├── FileWriteTool/    # 文件写入
│   │   ├── GlobTool/         # 文件搜索
│   │   ├── GrepTool/         # 内容搜索
│   │   ├── AgentTool/        # 子 Agent 管理
│   │   ├── WebSearchTool/    # Web 搜索
│   │   ├── WebFetchTool/     # Web 抓取
│   │   ├── NotebookEditTool/ # Jupyter 编辑
│   │   ├── MCPTool/          # MCP 协议工具
│   │   ├── TodoWriteTool/    # 任务管理
│   │   └── ...
│   ├── services/             # 核心服务
│   │   ├── api/              # Anthropic API 通信
│   │   ├── auth/             # 认证 (OAuth/API Key)
│   │   ├── mcp/              # MCP Server 管理
│   │   ├── analytics/        # 遥测与监控
│   │   ├── voice/            # 语音模式
│   │   └── ...
│   ├── utils/                # 工具函数
│   │   ├── model/            # 模型配置与选择
│   │   └── ...
│   ├── constants/            # 常量与系统提示词
│   │   └── prompts.ts        # 系统提示词 (含模型信息)
│   ├── components/           # React 终端 UI 组件
│   ├── ink/                  # Ink 框架 (React 终端渲染)
│   ├── shims/                # Bun API 兼容层
│   │   ├── bun-bundle.ts     # Feature Flags
│   │   ├── bun-polyfill.ts   # Bun API polyfill
│   │   └── macros.ts         # MACRO 全局常量
│   ├── stubs/                # 内部包 stub
│   ├── skills/               # 内置技能
│   ├── hooks/                # 生命周期钩子
│   ├── migrations/           # 模型迁移
│   ├── _vendored/            # 第三方打包模块
│   └── native-ts/            # 原生模块 TS 实现
├── package.json
├── tsconfig.json
└── dist/                     # 构建输出
    └── cli.js                # 打包产物 (~27MB)
```

## 快速开始

### 环境要求

- [Bun](https://bun.sh/) >= 1.0 (推荐，用于构建)
- Node.js >= 18 (运行时)
- Anthropic API Key

### 安装依赖

```bash
# 使用 bun (推荐)
bun install

# 或使用 npm
npm install
```

### 构建

```bash
bun build ./src/entrypoints/cli.tsx --outdir ./dist --target bun
```

构建产物: `dist/cli.js` (~27MB)

### 运行

```bash
# 设置 API Key
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# 交互模式
bun run dist/cli.js

# 非交互模式
bun run dist/cli.js -p "你的问题"

# 指定模型
bun run dist/cli.js --model opus

# 查看版本
bun run dist/cli.js --version
# 输出: 2.1.88 (Claude Code)

# 查看帮助
bun run dist/cli.js --help
```

### 开发模式 (不构建直接运行)

```bash
bun run src/entrypoints/cli.tsx --version
```

## 内置工具一览

Claude Code 内置了 50+ 个工具，核心工具包括:

| 工具 | 说明 |
|------|------|
| `Bash` | 执行 Shell 命令 |
| `Read` | 读取文件 |
| `Edit` | 编辑文件 (精确字符串替换) |
| `Write` | 写入文件 |
| `Glob` | 文件模式匹配搜索 |
| `Grep` | 文件内容搜索 (基于 ripgrep) |
| `Agent` | 启动子 Agent |
| `WebSearch` | Web 搜索 |
| `WebFetch` | 抓取网页内容 |
| `NotebookEdit` | 编辑 Jupyter Notebook |
| `TodoWrite` | 任务列表管理 |
| `AskUserQuestion` | 向用户提问 |
| `EnterPlanMode` | 进入计划模式 |
| `EnterWorktree` | 创建 Git Worktree |
| `MCPTool` | 调用 MCP 服务器工具 |
| `SkillTool` | 执行技能 |
| `TaskCreate/Update/List` | 任务管理 |
| `TeamCreate/Delete` | Agent 团队管理 |

## 多 Provider 支持

支持多种 API Provider:

- **First Party**: Anthropic API 直连
- **AWS Bedrock**: 通过 `@anthropic-ai/bedrock-sdk`
- **Google Vertex AI**: 通过 `@anthropic-ai/vertex-sdk`
- **Anthropic Foundry**: 通过 `@anthropic-ai/foundry-sdk`

```bash
# 使用 Bedrock
export CLAUDE_CODE_USE_BEDROCK=1

# 使用 Vertex
export CLAUDE_CODE_USE_VERTEX=1
```

## 配置

### 环境变量

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_API_KEY` | API 密钥 |
| `ANTHROPIC_MODEL` | 覆盖默认模型 |
| `ANTHROPIC_SMALL_FAST_MODEL` | 覆盖快速/小模型 |
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Vertex |
| `CLAUDE_CODE_DISABLE_FAST_MODE` | 禁用 Fast Mode |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` | 禁用 1M Context |

### TypeScript 类型检查

```bash
npx tsc --noEmit
```

> 注意: 由于内部包以 stub 代替，会存在约 2,000+ 类型错误，不影响运行。

## 还原说明

本项目从 `@anthropic-ai/claude-code@2.1.88` 的 57MB Source Map 文件还原:

1. 解析 `.js.map` 中的 `sources` (文件路径) 和 `sourcesContent` (源码内容)
2. 按原始目录结构写入文件系统
3. 通过分析全量 import 语句，逆向还原 `package.json` 依赖列表
4. 创建 Bun API polyfill (`bun:bundle`, `MACRO` 全局变量等)
5. 为 Anthropic 内部包创建 stub 模块

### 已知限制

- Anthropic 内部包 (`@ant/*`, `@anthropic-ai/sandbox-runtime` 等) 仅有 stub，无实际实现
- 原生 N-API 模块 (`color-diff-napi` 等) 以 TypeScript 纯实现替代
- 部分被 Feature Flag 保护的内部功能未激活
- 约 2,000+ TypeScript 类型错误 (来自 stub 模块)

## 技术栈

- **语言**: TypeScript
- **构建**: Bun Bundler
- **CLI**: Commander.js v12
- **UI**: React 19 + Ink (终端渲染) + React Compiler
- **API**: `@anthropic-ai/sdk` v0.74.0
- **协议**: MCP (Model Context Protocol)
- **可观测性**: OpenTelemetry
- **测试**: Vitest (原始项目)

## License

本项目仅用于学习和研究目的。Claude Code 的原始代码版权归 Anthropic 所有。
