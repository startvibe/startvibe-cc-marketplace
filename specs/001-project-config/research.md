# Research Findings: 项目配置初始化

**Date**: 2025-11-16
**Purpose**: Phase 0 research for project configuration and Claude Code Marketplace compliance
**Research Topics**: ESLint + Prettier 配置、Husky Git hooks、pnpm 包管理器、Marketplace 规范

## 开发工具最佳实践

### ESLint + Prettier 集成

**研究发现**:

1. **配置方法**:
   - 推荐使用 `eslint-config-prettier` 禁用与 Prettier 冲突的 ESLint 规则
   - 支持 Flat Config (ESLint 8.21+) 和传统 .eslintrc 格式
   - 应该将 `eslint-config-prettier` 放在配置数组的最后

2. **TypeScript 支持**:

   ```javascript
   import typescriptEslint from '@typescript-eslint/eslint-plugin';
   import eslintConfigPrettier from 'eslint-config-prettier/flat';

   export default [
     {
       plugins: {
         '@typescript-eslint': typescriptEslint,
       },
       rules: {
         '@typescript-eslint/semi': 'off',
       },
     },
     eslintConfigPrettier,
   ];
   ```

3. **验证工具**:
   - 使用 `npx eslint-config-prettier` 检查配置冲突
   - 可以通过环境变量 `ESLINT_USE_FLAT_CONFIG=true` 强制使用 Flat Config

### Husky Git Hooks 配置

**关键发现**:

1. **初始化方法**:

   ```bash
   pnpm add -D husky
   npx husky init
   ```

2. **package.json 脚本配置**:

   ```json
   {
     "scripts": {
       "prepare": "husky"
     }
   }
   ```

3. **Hooks 脚本示例**:

   ```bash
   # .husky/pre-commit
   npm run lint
   npm run test
   ```

4. **环境变量控制**:
   - `HUSKY=0` 临时禁用 hooks
   - 在 CI/CD 中设置 `env: HUSKY: 0` 持续禁用

### pnpm 包管理器配置

**重要发现**:

1. **Workspace 配置** (`pnpm-workspace.yaml`):

   ```yaml
   packages:
     - '**'
   ```

2. **锁文件管理**:
   - 优先使用 `shared-workspace-lockfile=true` 统一锁文件
   - 支持分支特定锁文件: `gitBranchLockfile: true`

3. **开发配置**:

   ```ini
   # .npmrc
   link-workspace-packages = true
   prefer-workspace-packages = true
   save-workspace-protocol = true
   ```

4. **安装命令**:
   ```bash
   pnpm install --frozen-lockfile  # 生产环境
   pnpm install --lockfile-only     # 仅更新锁文件
   ```

## Claude Code Marketplace 规范

### 核心要求

1. **插件结构**:
   - 必须使用 `.claude-plugin/plugin.json` 元数据文件
   - 支持 Marketplace 配置文件 `.claude-plugin/marketplace.json`
   - 目录结构必须符合标准格式

2. **配置文件要求**:

   ```json
   {
     "name": "plugin-name",
     "version": "1.0.0",
     "description": "插件描述",
     "author": "作者信息"
   }
   ```

3. **性能标准**:
   - 初始化时间 < 2 秒
   - 命令响应时间 < 5 秒
   - 内存占用 < 100MB

4. **中文文档优先**:
   - README.md 应以中文为主（代码和专业术语除外）
   - 推荐使用 `docs/zh-CN/` 目录结构

## 需要澄清的技术项

### 已识别的 NEEDS CLARIFICATION

1. **测试框架选择**: 需要确定使用 Jest、Vitest 还是其他测试框架
2. **TypeScript 配置**: 是否需要 TypeScript 支持及具体配置要求
3. **CI/CD 集成**: 需要明确持续集成环境的具体要求
4. **插件功能**: 当前项目是纯配置还是包含特定插件功能

### 推荐的解决方案

1. **测试框架**: 建议使用 Vitest（与现代前端工具链兼容性更好）
2. **TypeScript**: 建议启用基础 TypeScript 支持
3. **CI/CD**: 推荐使用 GitHub Actions 基础配置

## 下一步行动

1. 创建项目基础结构
2. 配置 ESLint + Prettier 集成
3. 设置 Husky Git hooks
4. 初始化 pnpm workspace
5. 创建 Claude Code 插件元数据文件
6. 设置中文文档结构

## 技术栈选择

- **包管理器**: pnpm（已确认）
- **代码质量**: ESLint + Prettier + eslint-config-prettier
- **Git hooks**: Husky v9
- **文档**: 中文优先，使用 Markdown
- **配置格式**: 支持现代 Flat Config 和传统格式
