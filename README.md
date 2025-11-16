# StartVibe Claude Code 插件市场

> 为 StartVibe 提供的 Claude Code 插件市场配置项目

## 📖 项目简介

本项目建立了完整的开发环境配置和 Claude Code Marketplace 规范合规性，为开发者提供即用的代码质量工具和插件分发解决方案。

### ✨ 主要功能

- **开发环境配置**：预配置 ESLint、Prettier、Husky 和 pnpm
- **Marketplace 合规**：完全符合 Claude Code 官方规范要求
- **中文优先文档**：提供全面的中文技术文档
- **即用型配置**：开箱即用的开发环境设置

## 🚀 快速开始

### 前置要求

- Node.js 18.0.0 或更高版本
- pnpm 8.0.0 或更高版本
- Git 版本控制工具

### 安装和设置

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd startvibe-cc-marketplace
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **初始化开发环境**

   ```bash
   pnpm run dev-setup
   ```

4. **验证配置**
   ```bash
   npm run validate
   ```

## 📁 项目结构

```
startvibe-cc-marketplace/
├── .claude-plugin/               # Claude Code 插件配置
│   ├── plugin.json              # 插件元数据
│   ├── marketplace.json         # 市场配置文件
│   ├── commands/                # 斜杠命令目录
│   ├── agents/                  # 专门代理目录
│   ├── skills/                  # 技能实现目录
│   ├── hooks/                   # 插件钩子目录
│   ├── validate-plugin.sh       # 插件验证脚本
│   └── test-marketplace.sh     # 市场测试脚本
├── commands/                    # 项目命令
├── agents/                      # 项目代理
├── skills/                      # 项目技能
├── hooks/                       # 项目钩子
├── tests/                        # 测试文件
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── contract/                # 契约测试
├── docs/                        # 文档目录
│   ├── zh-CN/                   # 中文文档
│   │   ├── README.md
│   │   └── api.md
│   └── en/                      # 英文文档
├── .eslintrc.js                 # ESLint 配置
├── .prettierrc                  # Prettier 配置
├── .husky/                      # Git hooks
│   ├── pre-commit              # 提交前检查
│   └── pre-push                # 推送前检查
├── package.json                 # 项目配置
├── pnpm-workspace.yaml         # pnpm 工作空间
├── .npmrc                       # npm 配置
├── .gitignore                   # Git 忽略文件
├── .eslintignore                # ESLint 忽略文件
└── .prettierignore              # Prettier 忽略文件
```

## 🛠️ 开发工具

### 代码质量检查

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 检查代码格式化
npm run format:check

# 自动格式化代码
npm run format
```

### 完整验证

```bash
# 运行完整验证（包括 lint 和 format）
npm run validate
```

### Git Hooks

项目配置了以下 Git hooks：

- **pre-commit**：自动运行代码质量检查和格式化验证
- **pre-push**：运行完整测试套件和验证

## 📚 中文文档

详细的中文文档位于 `docs/zh-CN/` 目录：

- [快速入门指南](docs/zh-CN/README.md)
- [API 文档](docs/zh-CN/api.md)

## 🔧 配置详情

### ESLint 配置

项目使用 ESLint 进行代码质量检查，配置包括：

- JavaScript/ES2022 语法支持
- 推荐的代码规则
- 与 Prettier 的兼容性配置

### Prettier 配置

项目使用 Prettier 进行代码格式化，配置包括：

- 单引号优先
- 2 空格缩进
- 尾随逗号（ES5 标准）
- 行宽限制：80 字符

### Husky 配置

项目使用 Husky 管理 Git hooks：

- **pre-commit**：代码质量检查
- **pre-push**：完整验证流程

### pnpm 配置

项目使用 pnpm 作为包管理器：

- 工作空间支持
- 锁定文件管理
- 严格的依赖解析

## 🎯 Claude Code 插件配置

### 插件元数据

`.claude-plugin/plugin.json` 包含：

- 插件名称和版本
- 作者信息和许可证
- 支持的 Claude Code 版本
- 关键词和分类

### 市场配置

`.claude-plugin/marketplace.json` 包含：

- 市场名称和所有者信息
- 插件条目列表
- 版本和源地址配置

## 🧪 验证和测试

### 插件验证

```bash
# 验证插件配置
.claude-plugin/validate-plugin.sh
```

### 市场测试

```bash
# 测试市场配置
.claude-plugin/test-marketplace.sh
```

### 配置验证

```bash
# 验证 JSON 语法
python3 -m json.tool .claude-plugin/plugin.json
python3 -m json.tool .claude-plugin/marketplace.json
```

## 🤝 贡献指南

### 开发流程

1. Fork 项目仓库
2. 创建功能分支
3. 进行开发和测试
4. 提交 Pull Request

### 代码规范

- 所有代码必须通过 ESLint 检查
- 代码必须符合 Prettier 格式化标准
- 提交信息遵循 Conventional Commits 规范

### 文档要求

- 优先使用中文编写文档
- 代码和技术术语保持原文
- 提供清晰的使用示例

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 📞 联系方式

- **项目维护者**：Jianan
- **邮箱**：startvibe@linlaoshi.top
- **网址**：https://startvibe.linlaoshi.top

## 🙏 致谢

感谢 Claude Code 团队提供优秀的插件生态系统，以及所有为开源社区做出贡献的开发者。

---

**StartVibe Claude Code 插件市场** - 让开发更高效，让配置更简单。
