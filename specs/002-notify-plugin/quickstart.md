# 快速开始指南：通知插件 (Notify Plugin)

## 概述

快速开始指南帮助您在 5 分钟内安装和配置 Claude Code 通知插件。本插件使用原生平台通知工具实现零依赖、即装即用的系统通知功能，在 Claude 完成响应或需要用户交互时发送通知。

## 系统要求

### 最低要求
- **操作系统**: macOS 10.12+, Windows 8+, 或 Ubuntu 16.04+
- **Claude Code**: 版本 1.0.0 或更高
- **Shell 环境**: Bash 4.0+, PowerShell 5.0+, 或等效环境

### 平台通知工具要求
- **macOS**: osascript (系统内置，无需安装)
- **Windows**: PowerShell (系统内置，无需安装)
- **Linux**: notify-send (需安装: `sudo apt-get install libnotify-bin`)

### 推荐配置
- **内存**: 至少 2GB 可用内存
- **存储**: 10MB 可用磁盘空间
- **权限**: 脚本执行权限

## 快速安装

### 方法一：Claude Code Marketplace 安装（推荐）

1. **打开 Claude Code**
   ```bash
   # 在 Claude Code 中运行市场安装命令
   /marketplace install notify-plugin
   ```

2. **验证安装**
   ```bash
   # 检查插件是否已安装
   /marketplace list
   ```

3. **测试通知**
   ```bash
   # 运行测试命令验证通知功能
   /marketplace test notify-plugin
   ```

### 方法二：手动安装（推荐）

1. **克隆项目**
   ```bash
   # 克隆到 Claude Code 插件目录
   cd ~/.claude
   git clone https://github.com/startvibe/startvibe-cc-marketplace marketplace
   ```

2. **验证插件结构**
   ```bash
   # 检查插件文件结构（注意：插件没有独立的package.json）
   ls -la plugins/notify-plugin/
   ```

3. **设置执行权限**
   ```bash
   # 确保脚本文件有执行权限
   chmod +x plugins/notify-plugin/scripts/*.sh
   ```

4. **启动 Claude Code（即时可用）**
   ```bash
   # 启动 Claude Code，插件立即可用
   claude-code
   # 零依赖，无需安装任何额外组件
   ```

> **注意**：notify-plugin 使用原生平台通知工具，实现零依赖、即装即用体验，无需任何手动安装步骤。

## 初始配置

### 自动配置（推荐）

插件首次运行时会自动创建默认配置：

```bash
# 触发自动配置
echo "Test" | claude-code
```

系统会自动创建配置文件：`~/.claude-code/notify-plugin/config.json`

### 手动配置

1. **创建配置目录**
   ```bash
   mkdir -p ~/.claude-code/notify-plugin
   ```

2. **创建基础配置文件**
   ```json
   {
     "version": "1.0.0",
     "enabled": true,
     "defaultSound": true,
     "events": {
       "stop": {
         "enabled": true,
         "sound": true,
         "urgency": "normal"
       },
       "notification": {
         "enabled": true,
         "sound": true,
         "urgency": "critical"
       }
     },
     "display": {
       "title": "Claude Code",
       "message": "{{title}}: {{message}}",
       "duration": 8
     }
   }
   ```

## 验证安装

### 功能测试

1. **测试 Stop 事件通知**
   ```bash
   # 发送简单请求给 Claude，等待完成
   claude-code "Hello, please respond with 'Test complete'"
   # 应该收到通知标题："Claude Response Complete"
   ```

2. **测试 Notification 事件通知**
   ```bash
   # 执行需要权限的操作
   claude-code "Please access a file that needs permission"
   # 应该收到通知标题："Claude Requires Attention"
   ```

### 状态检查

```bash
# 检查插件是否正确加载
/ marketplace status notify-plugin

# 查看当前配置
cat ~/.claude-code/notify-plugin/config.json

# 检查日志
tail -f ~/.claude-code/notify-plugin/logs/notifications.log
```

## 平台特定设置

### macOS 优化

1. **检查系统通知权限**
   - 系统偏好设置 → 安全性与隐私 → 通知
   - 确保 Claude Code 有通知权限

2. **测试原生通知功能**
   ```bash
   # 测试 osascript 通知
   osascript -e 'display notification "测试通知" with title "Claude Code"'
   ```

3. **自定义通知声音**
   ```json
   {
     "platformSettings": {
       "macos": {
         "sound": "Glass",
         "subtitle": "Claude Assistant"
       }
     }
   }
   ```

### Windows 优化

1. **检查 PowerShell 执行策略**
   ```powershell
   # 检查当前执行策略
   Get-ExecutionPolicy
   # 如果需要，设置为 RemoteSigned
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **确认 Windows 通知设置**
   - 设置 → 系统 → 通知和操作
   - 确保通知已启用

3. **自定义 App ID**
   ```json
   {
     "platformSettings": {
       "windows": {
         "appID": "ClaudeCode.Notify",
         "toastStyle": "modern"
       }
     }
   }
   ```

### Linux 优化

1. **安装通知工具（必需）**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libnotify-bin

   # Fedora/CentOS
   sudo dnf install libnotify

   # 可选：安装 zenity 作为备选
   sudo apt-get install zenity
   ```

2. **检查桌面环境通知设置**
   ```bash
   # 测试 notify-send
   notify-send --urgency=normal "测试" "这是一个测试通知"

   # 测试 zenity 备选
   zenity --info --title="测试" --text="测试通知" --timeout=3
   ```

3. **自定义通知设置**
   ```json
   {
     "platformSettings": {
       "linux": {
         "urgency": "normal",
         "category": "im.received",
         "timeout": 8
       }
     }
   }
   ```

## 常用配置

### 启用/禁用特定事件

```json
{
  "events": {
    "stop": {
      "enabled": true,     // 启用响应完成通知
      "sound": false,      // 禁用声音
      "urgency": "low"     // 设置低紧急程度
    },
    "notification": {
      "enabled": false     // 禁用权限请求通知
    }
  }
}
```

### 自定义通知模板

```json
{
  "events": {
    "stop": {
      "customTemplate": {
        "title": "✅ Claude 完成",
        "message": "会话 {{sessionId}} 处理完成"
      }
    }
  }
}
```

### 静默工作时间

```json
{
  "display": {
    "title": "Claude Code",
    "message": "{{title}}: {{message}}",
    "duration": 3,
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00",
      "weekdaysOnly": false
    }
  }
}
```

## 故障排除

### 通知不显示

1. **检查插件状态**
   ```bash
   /marketplace status notify-plugin
   ```

2. **验证配置文件**
   ```bash
   # 验证 JSON 格式
   cat ~/.claude-code/notify-plugin/config.json | python3 -m json.tool
   ```

3. **检查系统权限**
   - macOS: 系统偏好设置 → 通知
   - Windows: 设置 → 系统 → 通知
   - Linux: 桌面环境通知设置

4. **查看错误日志**
   ```bash
   tail -f ~/.claude-code/notify-plugin/logs/errors.log
   ```

### 性能问题

1. **检查通知延迟**
   ```bash
   # 运行性能测试
   time /marketplace test notify-plugin
   ```

2. **重置配置**
   ```bash
   # 备份当前配置
   cp ~/.claude-code/notify-plugin/config.json ~/.claude-code/notify-plugin/config.json.backup

   # 使用默认配置
   rm ~/.claude-code/notify-plugin/config.json
   ```

### 平台特定问题

#### macOS
```bash
# 测试原生 osascript 通知
osascript -e 'display notification "测试通知" with title "Claude Code 测试"'

# 检查通知权限
osascript -e 'display notification "权限检查" with title "通知权限正常"'
```

#### Windows
```powershell
# 测试原生 PowerShell 通知
Add-Type -AssemblyName System.Windows.Forms
$notification = New-Object System.Windows.Forms.NotifyIcon
$notification.BalloonTipTitle = "Claude Code 测试"
$notification.BalloonTipText = "测试通知"
$notification.Visible = $true
$notification.ShowBalloonTip(3000)
```

#### Linux
```bash
# 测试原生 notify-send
notify-send --urgency=normal "Claude Code 测试" "测试通知"

# 测试 zenity 备选
zenity --info --title="Claude Code 测试" --text="测试通知" --timeout=3
```

## 升级和维护

### 升级插件

```bash
# 从 marketplace 升级
/marketplace upgrade notify-plugin

# 手动升级
cd ~/.claude/marketplace
git pull origin main

# 原生通知工具无需任何依赖更新
```

### 备份配置

```bash
# 创建配置备份
cp ~/.claude-code/notify-plugin/config.json ~/.claude-code/notify-plugin/config.json.backup.$(date +%Y%m%d)

# 查看所有备份
ls -la ~/.claude-code/notify-plugin/config.json.backup*
```

### 清理日志

```bash
# 清理旧日志（保留最近 7 天）
find ~/.claude-code/notify-plugin/logs -name "*.log" -mtime +7 -delete

# 压缩大日志文件
gzip ~/.claude-code/notify-plugin/logs/*.log
```

## 下一步

现在您已经成功安装和配置了通知插件，可以：

1. **自定义配置**：编辑 `~/.claude-code/notify-plugin/config.json`
2. **查看完整文档**：阅读 `README.md` 了解所有功能
3. **报告问题**：在 GitHub 上提交 issue
4. **贡献代码**：提交 pull request 改进插件

## 获取帮助

- **文档**: `plugins/notify-plugin/README.md`
- **配置示例**: `plugins/notify-plugin/config/default-config.json`
- **故障排除**: `plugins/notify-plugin/docs/troubleshooting.md`
- **GitHub**: https://github.com/startvibe/startvibe-cc-marketplace

享受您的 Claude Code 通知体验！ 🎉