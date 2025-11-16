# Claude Code 通知插件

使用原生平台通知工具的跨平台系统通知插件，为 Claude Code 提供即时的桌面通知功能。

## ✨ 特性

- 🚀 **零依赖即装即用** - 无需安装额外依赖，使用系统原生通知工具
- 🌍 **跨平台支持** - 完整支持 macOS、Windows、Linux 三大操作系统
- ⚡ **高性能** - Hook 响应时间 < 5秒，通知发送 < 200ms
- 🔧 **高度可配置** - 支持自定义通知标题、内容、声音、紧急程度等
- 🎯 **智能事件监听** - 自动监听 Claude Code 的 Stop 和 Notification 事件
- 📱 **原生集成** - 完美集成系统通知中心，支持原生功能

## 🏗️ 系统架构

### 技术栈
- **主要语言**: Shell 脚本（实现核心功能）
- **配置管理**: 轻量级 JavaScript（JSON 配置处理）
- **通知工具**: 原生平台通知工具

### 支持平台和工具

| 操作系统 | 通知工具 | 状态 | 要求 |
|----------|----------|------|------|
| macOS | osascript | ✅ 内置 | 无需额外安装 |
| Linux | notify-send | ✅ 需安装 | `sudo apt-get install libnotify-bin` |
| Windows | PowerShell | ✅ 内置 | 无需额外安装 |

## 📦 安装说明

### 方法一：Claude Code Marketplace 安装（推荐）

```bash
# 在 Claude Code 中运行
/marketplace install notify-plugin

# 验证安装
/marketplace list

# 测试功能
/marketplace test notify-plugin
```

### 方法二：手动安装

```bash
# 1. 克隆到 Claude Code 插件目录
cd ~/.claude
git clone https://github.com/startvibe/startvibe-cc-marketplace marketplace

# 2. 设置执行权限
chmod +x plugins/notify-plugin/scripts/*.sh

# 3. 启动 Claude Code（即时可用）
claude-code
```

## 🚀 快速开始

### 基础使用

安装后，插件将自动工作：

1. **Claude 完成响应时** - 收到 "Claude 响应完成" 通知
2. **需要用户交互时** - 收到 "Claude 需要您的注意" 通知

### 手动测试

```bash
# 测试平台检测
./plugins/notify-plugin/scripts/platform-check.sh --report

# 测试通知功能
./plugins/notify-plugin/scripts/native-notifier.sh "测试标题" "测试消息" normal true

# 测试 Stop 事件处理器
HOOK_EVENT_NAME=Stop ./plugins/notify-plugin/scripts/stop-handler.sh

# 测试 Notification 事件处理器
HOOK_EVENT_NAME=Notification ./plugins/notify-plugin/scripts/notification-handler.sh
```

## ⚙️ 配置管理

### 配置文件位置

配置文件按以下优先级加载：

1. `plugins/notify-plugin/config/user-config.json` - 用户自定义配置
2. `~/.claude-code/notify-plugin/config.json` - 用户配置
3. `plugins/notify-plugin/config/default-config.json` - 默认配置

### 基础配置示例

```json
{
  "version": "1.0.0",
  "enabled": true,
  "defaultSound": true,
  "events": {
    "stop": {
      "enabled": true,
      "sound": true,
      "urgency": "normal",
      "customTemplate": {
        "title": "Claude 响应完成",
        "message": "Claude 已完成您的请求处理"
      }
    },
    "notification": {
      "enabled": true,
      "sound": true,
      "urgency": "critical",
      "customTemplate": {
        "title": "Claude 需要您的注意",
        "message": "Claude 需要您的确认或输入"
      }
    }
  },
  "display": {
    "title": "Claude Code",
    "message": "{{title}}: {{message}}",
    "duration": 8
  }
}
```

### 模板变量

支持以下模板变量：

- `{{sessionId}}` - Claude 会话 ID
- `{{hookEventName}}` - Hook 事件名称
- `{{timestamp}}` - 事件时间戳
- `{{cwd}}` - 当前工作目录
- `{{permissionMode}}` - 权限模式
- `{{title}}` - 事件标题
- `{{message}}` - 事件消息
- `{{operationType}}` - 操作类型
- `{{operationTarget}}` - 操作目标

## 🔧 高级配置

### 平台特定设置

#### macOS 配置
```json
{
  "platformSettings": {
    "macos": {
      "subtitle": "Claude Assistant",
      "sound": "Glass",
      "contentImage": "",
      "actions": ["查看", "忽略"],
      "reply": false
    }
  }
}
```

#### Windows 配置
```json
{
  "platformSettings": {
    "windows": {
      "appID": "ClaudeCode.Notify",
      "toastStyle": "modern",
      "icon": "",
      "install": "start-menu"
    }
  }
}
```

#### Linux 配置
```json
{
  "platformSettings": {
    "linux": {
      "urgency": "normal",
      "category": "im.received",
      "app_name": "Claude Code",
      "timeout": 8
    }
  }
}
```

### 静默时间设置

```json
{
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00",
    "weekdaysOnly": false
  }
}
```

### 性能调优

```json
{
  "performance": {
    "maxNotificationRetries": 3,
    "notificationTimeout": 5000,
    "hookTimeout": 5000
  }
}
```

## 🧪 测试和验证

### 自动化测试

插件包含完整的测试框架：

```bash
# 运行所有测试
./plugins/notify-plugin/tests/run-all-tests.sh

# 平台兼容性测试
./plugins/notify-plugin/tests/platform/test-compatibility.sh

# 性能基准测试
./plugins/notify-plugin/tests/performance/benchmark.sh
```

### 功能验证

1. **Stop 事件测试**
   ```bash
   # 触发 Claude 完成响应
   claude-code "请回复'测试完成'"
   # 应该收到通知：Claude 响应完成
   ```

2. **Notification 事件测试**
   ```bash
   # 触发需要权限的操作
   claude-code "请访问一个需要权限的文件"
   # 应该收到通知：Claude 需要您的注意
   ```

3. **跨平台验证**
   - macOS: 测试 osascript 通知功能
   - Linux: 验证 notify-send 和 zenity
   - Windows: 验证 PowerShell 通知

## 🐛 故障排除

### 常见问题

#### 通知不显示

1. **检查插件状态**
   ```bash
   /marketplace status notify-plugin
   ```

2. **验证配置文件**
   ```bash
   cat ~/.claude-code/notify-plugin/config.json | python3 -m json.tool
   ```

3. **检查系统权限**
   - macOS: 系统偏好设置 → 安全性与隐私 → 通知
   - Windows: 设置 → 系统 → 通知
   - Linux: 桌面环境通知设置

4. **查看错误日志**
   ```bash
   tail -f ~/.claude-code/notify-plugin/logs/errors.log
   ```

#### 性能问题

```bash
# 测试通知延迟
time /marketplace test notify-plugin

# 重置配置
cp ~/.claude-code/notify-plugin/config.json ~/.claude-code/notify-plugin/config.json.backup
rm ~/.claude-code/notify-plugin/config.json
```

#### 平台特定问题

**macOS**
```bash
# 测试原生 osascript 通知
osascript -e 'display notification "测试通知" with title "Claude Code"'

# 检查通知权限
osascript -e 'display notification "权限检查" with title "通知权限正常"'
```

**Windows**
```powershell
# 测试 PowerShell 通知
Add-Type -AssemblyName System.Windows.Forms
$notification = New-Object System.Windows.Forms.NotifyIcon
$notification.BalloonTipTitle = "Claude Code 测试"
$notification.BalloonTipText = "测试通知"
$notification.Visible = $true
$notification.ShowBalloonTip(3000)
```

**Linux**
```bash
# 测试 notify-send
notify-send --urgency=normal "Claude Code 测试" "测试通知"

# 测试 zenity 备选
zenity --info --title="Claude Code 测试" --text="测试通知" --timeout=3
```

## 📋 开发指南

### 目录结构

```
plugins/notify-plugin/
├── .claude-plugin/
│   └── plugin.json          # 插件元数据
├── hooks/
│   └── hooks.json           # Hook 配置
├── scripts/                 # Shell 脚本实现
│   ├── native-notifier.sh   # 原生通知封装
│   ├── platform-check.sh    # 平台检测
│   ├── stop-handler.sh      # Stop 事件处理
│   └── notification-handler.sh # Notification 事件处理
├── src/                     # JavaScript 模块
│   ├── index.js            # 主入口
│   └── config.js           # 配置管理
├── config/                  # 配置文件
│   └── default-config.json  # 默认配置
├── tests/                   # 测试文件
└── README.md               # 本文档
```

### Hook 事件处理

插件监听以下 Claude Code Hook 事件：

1. **SessionStart** - 初始化时检测平台和工具可用性
2. **Stop** - Claude 完成响应时发送通知
3. **Notification** - 需要用户交互时发送通知

### API 接口

```javascript
const NotifyPlugin = require('./src/index.js');

const plugin = new NotifyPlugin();

// 初始化插件
await plugin.initialize();

// 发送通知
await plugin.sendNotification('标题', '消息', {
  urgency: 'normal',
  sound: true,
  eventType: 'stop'
});

// 获取状态
const status = plugin.getStatus();
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- Claude Code 团队提供优秀的 Hook 系统
- 所有原生平台通知工具的开发者
- 开源社区的宝贵反馈和建议

## 📞 支持

- **问题报告**: [GitHub Issues](https://github.com/startvibe/startvibe-cc-marketplace/issues)
- **功能请求**: [GitHub Discussions](https://github.com/startvibe/startvibe-cc-marketplace/discussions)
- **文档**: [完整文档](docs/)

---

**享受您的 Claude Code 通知体验！** 🎉