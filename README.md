# StartVibe Claude Code 插件市场

> 为 StartVibe 提供的 Claude Code 插件开发和分发平台

## 📖 项目简介

本项目是一个完整的 Claude Code 插件市场，提供经过验证的高质量插件和开发工具，专注于提升开发效率和用户体验。

### ✨ 主要功能

- **插件分发**：提供经过测试的 Claude Code 插件
- **通知系统**：上下文感知的跨平台通知插件
- **开发规范**：符合 Claude Code 官方插件规范
- **中文支持**：完整的中文文档和技术支持

## 🚀 快速开始

### 前置要求

- Claude Code 已安装并运行
- 基本的 Git 知识

### 安装插件市场

1. **添加市场到 Claude Code**

   ```bash
   # 在 Claude Code 中运行
   /plugin marketplace add startvibe/startvibe-cc-marketplace
   ```

2. **安装可用插件**

   ```bash
   # 安装通知插件
   /plugin install notify@startvibe-cc-marketplace

   # 查看所有可用插件
   /plugin
   ```

3. **验证安装**

   ```bash
   # 检查已安装插件
   /plugin list

   # 测试插件功能
   /plugin status notify
   ```

### 可用插件

#### 🔔 Notify 插件

- **功能**：上下文感知的系统通知
- **特性**：
  - 自动识别项目名称
  - 支持 Stop 和 Notification 事件
  - 跨平台兼容（macOS、Windows、Linux）
  - 完全可配置的通知内容

详细说明：[plugins/notify/README.md](plugins/notify/README.md)

## 📁 项目结构

```
startvibe-cc-marketplace/
├── .claude-plugin/               # Claude Code 市场配置
│   ├── marketplace.json         # 市场配置文件
├── plugins/                     # 插件目录
│   └── notify/                  # 通知插件
│       ├── .claude-plugin/
│       │   └── plugin.json     # 插件元数据
│       ├── hooks/
│       │   └── hooks.json      # Hook 配置
│       ├── scripts/
│       │   └── notify-hook.js  # 通知脚本
│       ├── config/
│       │   └── notify-config.json # 配置文件
│       └── README.md            # 插件文档
├── docs/                        # 文档目录
│   └── claude-code-docs/        # Claude Code 中文文档
└── README.md                    # 本文档
```

## 🔧 插件开发

### Claude Code 插件规范

本项目完全符合 Claude Code 官方插件规范：

- **插件元数据**：符合 plugin.json 规范
- **市场配置**：符合 marketplace.json 规范
- **Hook 事件**：支持所有官方 Hook 事件
- **跨平台兼容**：支持 Windows、macOS、Linux

### 开发新插件

1. 创建插件目录结构
2. 编写 `.claude-plugin/plugin.json`
3. 实现 Hook 功能
4. 添加到 marketplace.json
5. 测试和验证

### 详细的中文文档

项目包含完整的 Claude Code 中文技术文档：

- [插件市场指南](docs/claude-code-docs/claude-code-marketplace.md)
- [插件开发指南](docs/claude-code-docs/claude-code-plugin.md)
- [Hook 系统指南](docs/claude-code-docs/claude-code-hooks.md)
- [Hook 参考文档](docs/claude-code-docs/claude-code-hooks-reference.md)

## 🧪 验证和测试

### 插件验证

```bash
# 验证 JSON 语法
python3 -m json.tool .claude-plugin/marketplace.json
python3 -m json.tool plugins/notify/.claude-plugin/plugin.json
```

### 市场测试

```bash
# 测试市场配置
cat .claude-plugin/marketplace.json
```

## 📄 许可证

本项目采用 [Apache License 2.0](LICENSE)。

## 📞 联系方式

- **项目维护者**：Jianan
- **邮箱**：startvibe@linlaoshi.top
- **网址**：https://startvibe.linlaoshi.top

## 🙏 致谢

感谢 Claude Code 团队提供优秀的插件生态系统，以及所有为开源社区做出贡献的开发者。

---

**StartVibe Claude Code 插件市场** - 让开发更高效，让插件更简单。
