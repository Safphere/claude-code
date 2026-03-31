# Claude Code v2.1.88 - Source Restored

> 从 `@anthropic-ai/claude-code@2.1.88` 的 Source Map 完整还原的 TypeScript 源码，可独立构建运行。

## 项目简介

Claude Code 是 Anthropic 推出的 AI 编程助手命令行工具。本项目通过解析 npm 发布包中的 `.js.map` 文件，从 `sources` 和 `sourcesContent` 字段提取并还原了完整的 TypeScript 源码树。

- **原始版本**: `2.1.88`
- **源文件数量**: 2,100+ 个 `.ts/.tsx` 文件
- **构建工具**: Bun (bundler)
- **运行时**: Node.js >= 18
- **UI 框架**: React 19 + Ink (终端 UI)

## 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| [Bun](https://bun.sh/) | >= 1.0 | 构建时依赖（不需要作为运行时） |
| [Node.js](https://nodejs.org/) | >= 18 | 运行时 |
| Git | any | 克隆源码 |

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/MrCatAI/claude-code.git
cd claude-code
```

公开仓库: https://github.com/Safphere/claude-code

### 2. 安装依赖

```bash
bun install
```

### 3. 构建

```bash
bun run build
```

构建产物: `dist/cli.js` (~29MB，自包含，无外部依赖)

### 4. 配置 API Key

```bash
# 方式一: 环境变量
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# 方式二: 使用配置文件 (~/.claude/settings.json)
mkdir -p ~/.claude
cat > ~/.claude/settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-your-key-here"
  }
}
EOF
```

也支持自定义 API 端点（代理/兼容 API）：

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "your-key",
    "ANTHROPIC_BASE_URL": "https://your-proxy.example.com/api/anthropic"
  }
}
```

### 5. 运行

```bash
# 直接运行
node dist/cli.js -p "hello"

# 查看版本
node dist/cli.js --version
# 输出: 2.1.88 (Claude Code)
```

## 全局安装

安装后可直接使用 `claude` 命令：

```bash
# 在项目目录内执行
npm link

# 现在可以在任意位置使用
claude -p "你好"
claude --version
claude --help

# 取消全局安装
npm unlink -g @anthropic-ai/claude-code
```

## 使用方式

```bash
# 非交互模式 (单次问答)
claude -p "你的问题"
echo "你的问题" | claude -p

# 交互模式 (进入 REPL)
claude

# 指定模型
claude -p "hello" --model sonnet

# 继续上次对话
claude -c

# 查看帮助
claude --help
```

## 项目结构

```
claude-code/
├── src/
│   ├── entrypoints/cli.tsx    # CLI 主入口
│   ├── tools/                 # 内置工具集 (50+)
│   ├── services/              # 核心服务 (API, Auth, MCP...)
│   ├── components/            # React 终端 UI
│   ├── ink/                   # Ink 框架 (React 终端渲染)
│   ├── shims/                 # Bun/React API 兼容层
│   ├── stubs/                 # Anthropic 内部包 stub
│   └── ...
├── scripts/build.ts           # 构建脚本
├── package.json
├── tsconfig.json
└── dist/                      # 构建输出 (gitignored)
    └── cli.js
```

## 构建系统说明

构建过程 (`bun run build`) 执行以下步骤：

1. 复制 `src/` → `build-src/` 作为工作副本
2. 将 `feature('FLAG')` 调用替换为 `true`/`false` 字面量
3. 移除 `bun:bundle` 导入
4. 为缺失的内部 Anthropic 模块创建 stub 文件
5. 将 `src/...` 绝对导入改为相对路径
6. 使用 `bun build --target node` 打包为单文件
7. 修补 `useEffectEvent` polyfill（Ink reconciler 兼容）
8. 添加 `#!/usr/bin/env node` shebang

## 多 Provider 支持

```bash
# AWS Bedrock
export CLAUDE_CODE_USE_BEDROCK=1

# Google Vertex AI
export CLAUDE_CODE_USE_VERTEX=1
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_API_KEY` | API 密钥 |
| `ANTHROPIC_BASE_URL` | 自定义 API 端点 |
| `ANTHROPIC_MODEL` | 覆盖默认模型 |
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Vertex |

## 还原说明

本项目从 `@anthropic-ai/claude-code@2.1.88` 的 57MB Source Map 文件还原：

1. 解析 `.js.map` 中的 `sources` 和 `sourcesContent`
2. 按原始目录结构写入文件系统
3. 通过分析 import 语句逆向还原 `package.json` 依赖列表
4. 创建 Bun API polyfill 和 Anthropic 内部包 stub

## 已知限制

- Anthropic 内部包 (`@ant/*`, `@anthropic-ai/sandbox-runtime` 等) 仅有 stub
- 原生 N-API 模块以 TypeScript 纯实现替代
- 部分被 Feature Flag 保护的功能未激活
- 交互模式 (无 `-p`) 需要 TTY 终端环境

## License

本项目仅用于学习和研究目的。Claude Code 的原始代码版权归 Anthropic 所有。
