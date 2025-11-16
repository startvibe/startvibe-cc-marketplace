# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### 必要合规检查

- [ ] **市场标准合规性**: 插件使用标准 `.claude-plugin/plugin.json` 格式并遵循 Claude Code 市场规范
- [ ] **插件架构卓越性**: 设计模块化、单一用途、自包含，依赖最小化
- [ ] **MCP 集成策略**: 如需外部集成，包含适当的 MCP 服务器配置
- [ ] **中文优先文档**: 计划包含全面的中文 README.md 和 API 文档（除代码和专业术语外）
- [ ] **测试与质量**: 为核心功能定义自动化测试覆盖策略
- [ ] **安全要求**: 设计输入验证、安全凭证管理和隐私保护
- [ ] **性能标准**: 计划初始化时间 < 2 秒，命令响应时间 < 5 秒
- [ ] **开发工具规范**: 配置 ESLint+Prettier 代码规范，Husky Git hooks，pnpm 包管理器

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# 选项 1: Claude Code 插件 (默认)
plugin-name/
├── .claude-plugin/
│   └── plugin.json              # 插件元数据 (必需)
├── commands/                    # 斜杠命令 (可选)
│   └── command-name.md
├── agents/                      # 专门代理 (可选)
│   └── agent-name.md
├── skills/                      # 技能实现 (可选)
│   └── skill-name/
├── hooks/                       # 插件钩子 (可选)
│   └── pre-tool-use.js
├── tests/
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── contract/                # 契约测试
├── docs/                        # 附加文档 (可选)
│   ├── zh-CN/                   # 中文文档 (推荐)
│   └── en/                      # 英文文档 (可选)
├── .eslintrc.js                 # ESLint 配置 (必需)
├── .prettierrc                  # Prettier 配置 (必需)
├── package.json                 # 项目配置和依赖 (必需)
├── pnpm-lock.yaml              # pnpm 锁定文件 (必需)
├── .husky/                      # Husky Git hooks (必需)
│   ├── pre-commit              # 提交前检查
│   └── pre-push                # 推送前检查
└── README.md                    # 插件文档 (必需，优先中文)

# 选项 2: 带 MCP 服务器集成的插件
plugin-name/
├── .claude-plugin/
│   └── plugin.json              # 包含 MCP 服务器配置
├── mcp-server/                  # MCP 服务器实现
│   ├── src/
│   ├── package.json             # MCP 服务器包配置
│   ├── .eslintrc.js            # ESLint 配置
│   ├── .prettierrc             # Prettier 配置
│   └── README.md
├── commands/
├── agents/
├── tests/
├── docs/
│   └── zh-CN/                   # 中文文档
├── .eslintrc.js                 # 根 ESLint 配置
├── .prettierrc                  # 根 Prettier 配置
├── package.json                 # 根包配置
├── pnpm-workspace.yaml         # pnpm 工作空间配置
├── .husky/                      # Git hooks
└── README.md                    # 优先中文

# 选项 3: 多技能插件套件
plugin-suite/
├── .claude-plugin/
│   └── plugin.json              # 套件元数据
├── skill-1/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── package.json
│   ├── .eslintrc.js
│   ├── .prettierrc
│   └── [技能结构]
├── skill-2/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── package.json
│   ├── .eslintrc.js
│   ├── .prettierrc
│   └── [技能结构]
├── shared/                      # 共享工具
│   ├── package.json
│   ├── .eslintrc.js
│   └── .prettierrc
├── tests/
├── docs/
│   └── zh-CN/                   # 中文文档目录
├── package.json                 # 根包配置
├── pnpm-workspace.yaml         # 工作空间配置
├── .eslintrc.js                 # 根 ESLint 配置
├── .prettierrc                  # 根 Prettier 配置
├── .husky/                      # Git hooks
└── README.md                    # 套件文档 (中文优先)
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
