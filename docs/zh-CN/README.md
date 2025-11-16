# StartVibe Claude Code 插件市场 - 中文文档

这是 StartVibe Claude Code 插件市场项目的详细中文文档。

## 📋 目录

- [快速入门](#快速入门)
- [API 参考](#api-参考)
- [配置指南](#配置指南)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 🚀 快速入门

### 系统要求

- **Node.js**: 18.0.0 或更高版本
- **pnpm**: 8.0.0 或更高版本
- **Git**: 最新版本
- **Claude Code**: 支持插件的版本

### 安装步骤

1. **克隆项目**

   ```bash
   git clone https://github.com/startvibe/startvibe-cc-marketplace.git
   cd startvibe-cc-marketplace
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **验证安装**

   ```bash
   pnpm run validate
   ```

4. **配置开发环境**

   ```bash
   # 安装 Git hooks
   pnpm run prepare

   # 验证开发环境
   npm run lint
   npm run format:check
   ```

## 📚 API 参考

### 脚本命令

#### 开发相关

```bash
# 开发环境设置
pnpm run dev-setup

# 安装依赖
pnpm install

# 安装生产依赖
pnpm install --prod
```

#### 代码质量

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 检查代码格式
npm run format:check

# 自动格式化代码
npm run format
```

#### 验证测试

```bash
# 运行完整验证
npm run validate

# CI 环境安装
npm run ci:install

# CI 环境检查
npm run ci:lint
npm run ci:format
```

### 配置文件说明

#### .eslintrc.js

ESLint 配置文件，包含：

- 环境配置（Node.js、ES2022）
- 规则集（eslint:recommended、prettier）
- 解析器选项（ES2022、模块化）

#### .prettierrc

Prettier 配置文件，包含：

- 代码格式化规则
- 引号风格、缩进、行宽等
- 尾随逗号和括号间距

#### .husky/pre-commit

Git pre-commit hook，执行：

- ESLint 代码检查
- Prettier 格式化检查
- 验证失败时阻止提交

#### .husky/pre-push

Git pre-push hook，执行：

- 完整测试套件
- 最终验证流程
- 验证失败时阻止推送

## 🔧 配置指南

### 自定义 ESLint 规则

编辑 `.eslintrc.js` 文件：

```javascript
module.exports = {
  rules: {
    // 自定义规则
    'no-console': 'warn', // 警告 console 语句
    'prefer-const': 'error', // 强制使用 const
    // 添加更多规则...
  },
};
```

### 自定义 Prettier 规则

编辑 `.prettierrc` 文件：

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

### 添加新的 Git Hooks

编辑 `.husky/pre-commit` 或 `.husky/pre-push` 文件：

```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

# 添加自定义检查
echo "Running custom checks..."

# 运行标准检查
npm run lint
npm run format:check
```

## 💡 最佳实践

### 代码规范

1. **变量命名**
   - 使用 camelCase 命名变量和函数
   - 使用 PascalCase 命名类和构造函数
   - 使用 UPPER_SNAKE_CASE 命名常量

2. **函数设计**
   - 函数应该单一职责
   - 使用箭头函数进行简单操作
   - 为复杂函数添加 JSDoc 注释

3. **错误处理**
   - 使用 try-catch 处理异步操作
   - 提供有意义的错误消息
   - 避免全局错误处理

### 提交规范

遵循 Conventional Commits 规范：

```bash
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加或修改测试
chore: 构建或工具修改
```

### 文档维护

1. **中文优先**
   - 主要文档使用中文编写
   - 技术术语和代码保持原文
   - 提供双语对照（如需要）

2. **文档结构**
   - 使用清晰的目录结构
   - 提供导航和索引
   - 包含实际使用示例

3. **更新频率**
   - 代码变更时同步更新文档
   - 版本发布时更新版本信息
   - 定期审查文档准确性

## 🔍 故障排除

### 常见问题

#### ESLint 错误

**问题**: `ESLint couldn't find the config`

**解决方案**:

1. 检查 `.eslintrc.js` 文件语法
2. 确认依赖包已安装：`pnpm list eslint`
3. 重新安装依赖：`rm -rf node_modules && pnpm install`

#### Prettier 错误

**问题**: 代码格式不一致

**解决方案**:

1. 检查 `.prettierrc` 配置
2. 运行格式化：`npm run format`
3. 设置编辑器集成 Prettier

#### Husky 错误

**问题**: Git hooks 不执行

**解决方案**:

1. 重新安装 hooks：`pnpm run prepare`
2. 检查 hooks 文件权限：`chmod +x .husky/*`
3. 验证 Git 配置：`git config --list | grep core.hooksPath`

#### pnpm 错误

**问题**: 依赖安装失败

**解决方案**:

1. 清理缓存：`pnpm store prune`
2. 重新安装：`rm -rf node_modules pnpm-lock.yaml && pnpm install`
3. 检查网络连接和注册表配置

### 性能问题

#### 安装缓慢

**解决方法**:

```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com

# 启用并行安装
pnpm config set store-dir ~/.pnpm-store
```

#### 构建缓慢

**解决方法**:

- 使用增量构建
- 优化依赖管理
- 启用缓存机制

### 兼容性问题

#### Node.js 版本

**要求**: Node.js 18.0.0+

**检查版本**:

```bash
node --version
```

**升级建议**: 使用 nvm 管理 Node.js 版本

#### 操作系统兼容性

- **macOS**: 完全支持
- **Linux**: 完全支持
- **Windows**: 支持（使用 WSL2）

## 📞 获取帮助

### 项目支持

- **问题反馈**: [GitHub Issues](https://github.com/startvibe/startvibe-cc-marketplace/issues)
- **功能建议**: [Discussions](https://github.com/startvibe/startvibe-cc-marketplace/discussions)

### 社区资源

- **Claude Code 文档**: [官方文档](https://claude.ai/docs)
- **插件开发指南**: [插件开发教程](https://claude.ai/docs/plugins)
- **最佳实践**: [开发最佳实践](https://claude.ai/docs/best-practices)

---

如需更多帮助，请查看项目根目录的 README.md 文件或联系项目维护者。
