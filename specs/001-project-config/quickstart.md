# 项目配置快速开始指南

**目的**: 为开发者提供项目配置的快速上手指南
**目标受众**: 新加入项目的开发者
**时间**: 预计 5-10 分钟完成环境设置

## 前置要求

### 必需软件

1. **Node.js** - 版本 18.0.0 或更高

   ```bash
   node --version  # 应显示 v18.x.x 或更高
   ```

2. **pnpm** - 包管理器

   ```bash
   npm install -g pnpm
   pnpm --version  # 确认安装成功
   ```

3. **Git** - 版本控制
   ```bash
   git --version
   ```

### 推荐工具

1. **VS Code** - 代码编辑器
2. **Claude Code** - AI 开发助手

## 项目初始化

### 1. 克隆项目

```bash
git clone <repository-url>
cd startvibe-cc-marketplace
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 初始化开发环境

```bash
# 安装 Git hooks
pnpm run prepare

# 验证环境设置
pnpm run validate
```

## 开发工作流

### 代码质量检查

```bash
# 运行 ESLint 检查
pnpm run lint

# 自动修复可修复的问题
pnpm run lint:fix

# 代码格式化
pnpm run format

# 检查格式是否符合规范
pnpm run format:check
```

### Git 提交流程

1. **添加文件到暂存区**

   ```bash
   git add .
   ```

2. **提交代码**（会自动运行 pre-commit hooks）

   ```bash
   git commit -m "feat: 添加新功能描述"
   ```

3. **推送到远程仓库**（会自动运行 pre-push hooks）
   ```bash
   git push
   ```

## 配置文件说明

### 核心配置文件

| 文件路径                          | 用途                   | 必需 |
| --------------------------------- | ---------------------- | ---- |
| `.claude-plugin/plugin.json`      | Claude Code 插件元数据 | ✅   |
| `.claude-plugin/marketplace.json` | 市场配置文件           | ✅   |
| `.eslintrc.js`                    | ESLint 代码检查规则    | ✅   |
| `.prettierrc`                     | Prettier 格式化规则    | ✅   |
| `pnpm-workspace.yaml`             | pnpm 工作空间配置      | ✅   |
| `.husky/pre-commit`               | Git pre-commit 钩子    | ✅   |

### 可选配置文件

| 文件路径            | 用途              | 说明       |
| ------------------- | ----------------- | ---------- |
| `.husky/pre-push`   | Git pre-push 钩子 | 推送前检查 |
| `.husky/commit-msg` | 提交信息验证      | 可选       |

## 环境变量配置

创建 `.env.local` 文件（不要提交到版本控制）：

```bash
# 开发环境配置
NODE_ENV=development

# Claude Code 配置
CLAUDE_CONFIG_PATH=./.claude-plugin/

# pnpm 配置
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
```

## 常见问题

### Q: pnpm install 失败

**A**: 尝试以下解决方案：

```bash
# 清理缓存
pnpm store prune

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Q: ESLint 检查失败

**A**: 运行自动修复：

```bash
pnpm run lint:fix
```

### Q: Git hooks 不工作

**A**: 重新安装：

```bash
pnpm run prepare
```

### Q: Prettier 格式化不生效

**A**: 检查编辑器配置是否与项目 Prettier 配置冲突

## 验证配置

运行完整的环境验证：

```bash
# 验证所有配置
pnpm run validate

# 或分别运行
pnpm run lint && pnpm run format:check
```

预期输出：

- ESLint 检查通过，无错误
- Prettier 格式检查通过
- 所有 Git hooks 正常工作

## 中文文档

项目遵循中文优先的文档原则：

- 主要文档使用中文编写
- 代码注释建议使用中文
- 技术术语和专有名词保持原文
- 错误信息和用户反馈提供中文说明

## 下一步

1. 阅读 [README.md](../README.md) 了解项目概述
2. 查看 [开发指南](docs/zh-CN/development.md) 了解详细开发流程
3. 了解 [插件开发规范](docs/zh-CN/plugin-development.md)

## 获取帮助

如果遇到问题：

1. 检查本文档的常见问题部分
2. 查看项目的 Issues 页面
3. 联系项目维护者

## 性能要求

- 初始化时间： < 2 秒
- 代码检查时间： < 5 秒
- 格式化时间： < 3 秒
- 总体开发环境设置： < 5 分钟

## 安全注意事项

1. 不要将 `.env.local` 文件提交到版本控制
2. 定期更新依赖包版本
3. 使用 HTTPS 克隆代码仓库
4. 遵循最小权限原则配置开发环境
