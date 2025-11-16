# StartVibe Claude Code 插件 - 快速入门指南

## 🚀 5分钟快速开始

本指南将帮助您在5分钟内完成 StartVibe Claude Code 插件市场的安装和配置。

### 前置要求

- **Node.js** 18.0.0 或更高版本
- **pnpm** 8.0.0 或更高版本
- **Git** 最新版本
- **Claude Code** 支持插件的版本

### 一键安装

```bash
# 1. 克隆项目
git clone https://github.com/startvibe/startvibe-cc-marketplace.git
cd startvibe-cc-marketplace

# 2. 安装依赖
pnpm install

# 3. 验证安装
pnpm run validate
```

## ⚙️ 快速配置

### 1. 开发环境设置

```bash
# 安装 Git hooks
pnpm run prepare

# 设置开发环境
pnpm run dev-setup
```

### 2. 代码格式化配置

项目已预配置 ESLint + Prettier，验证配置：

```bash
# 检查代码规范
npm run lint

# 自动修复代码格式问题
npm run lint:fix

# 格式化所有代码
npm run format
```

### 3. Git 提交配置

Husky 已配置自动检查：

- **pre-commit**: 代码规范和格式检查
- **pre-push**: 完整测试套件

## 🔧 常用命令

### 开发命令

```bash
# 开发环境设置
pnpm run dev-setup

# 安装依赖
pnpm install

# 验证配置
pnpm run validate
```

### 代码质量

```bash
# 代码规范检查
npm run lint

# 自动修复问题
npm run lint:fix

# 格式检查
npm run format:check

# 格式化代码
npm run format
```

### 验证和测试

```bash
# 完整验证
npm run validate

# CI 环境检查
npm run ci:lint
npm run ci:format
```

## 📁 项目结构速览

```
startvibe-cc-marketplace/
├── .claude-plugin/           # Claude Code 插件配置
│   ├── plugin.json          # 插件元数据
│   └── marketplace.json     # 市场配置
├── docs/                    # 文档目录
│   └── zh-CN/              # 中文文档
│       └── README.md       # 详细中文文档
├── scripts/                # 脚本文件
└── README.md               # 项目主页（中文）
```

## 🛠️ 配置文件说明

### ESLint 配置 (.eslintrc.js)

- 代码规范检查
- 与 Prettier 兼容
- Node.js 环境支持

### Prettier 配置 (.prettierrc)

- 代码格式化规则
- 统一代码风格
- 编辑器集成支持

### Git Hooks (.husky/)

- pre-commit: 自动代码检查
- pre-push: 完整验证流程
- 确保代码质量

## ✅ 验证安装成功

### 1. 环境验证

```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18.0.0

# 检查 pnpm 版本
pnpm --version  # 应该 >= 8.0.0

# 验证项目配置
npm run validate
```

### 2. 功能验证

```bash
# 测试代码格式化
echo "console.log('Hello World');" > test.js
npm run format
rm test.js

# 测试 Git hooks
git add .
git commit -m "测试提交: 验证 hooks 正常工作"
```

### 3. 插件验证

```bash
# 验证插件配置
ls .claude-plugin/
# 应该看到: plugin.json  marketplace.json

# 验证 JSON 语法
jsonlint .claude-plugin/plugin.json
jsonlint .claude-plugin/marketplace.json
```

## 🔍 故障排除

### 常见问题快速解决

#### 1. 依赖安装失败

```bash
# 清理缓存重新安装
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 2. ESLint 错误

```bash
# 检查配置文件
cat .eslintrc.js

# 重新安装依赖
npm install eslint --save-dev
```

#### 3. Prettier 格式化问题

```bash
# 检查配置文件
cat .prettierrc

# 手动格式化
npm run format
```

#### 4. Git Hooks 不工作

```bash
# 重新安装 hooks
pnpm run prepare

# 检查文件权限
ls -la .husky/
chmod +x .husky/*
```

## 📚 下一步

安装完成后，您可以：

1. **查看详细文档**: [docs/zh-CN/README.md](../zh-CN/README.md)
2. **了解配置详情**: 查看各配置文件的详细说明
3. **开始开发**: 使用 `pnpm run dev-setup` 开始开发
4. **贡献代码**: 遵循项目的代码规范和提交规范

## 🆘 获取帮助

- **项目文档**: [docs/zh-CN/README.md](../zh-CN/README.md)
- **问题反馈**: [GitHub Issues](https://github.com/startvibe/startvibe-cc-marketplace/issues)
- **功能建议**: [GitHub Discussions](https://github.com/startvibe/startvibe-cc-marketplace/discussions)

---

🎉 **恭喜！** 您已成功配置 StartVibe Claude Code 插件市场开发环境。现在可以开始高质量的开发工作了！
