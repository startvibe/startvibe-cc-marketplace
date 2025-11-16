# 插件 API 合约

## 概述

本合约定义了 Claude Code 与通知插件之间的接口，用于市场集成。

## 插件元数据合约

### 文件：`.claude-plugin/plugin.json`

```json
{
  "name": "notify-plugin",
  "version": "1.0.0",
  "description": "Cross-platform system notifications for Claude Code events",
  "author": "StartVibe Team",
  "license": "MIT",
  "keywords": ["notification", "system", "cross-platform", "desktop"],
  "engines": {
    "claude-code": ">=1.0.0"
  },
  "marketplace": {
    "category": "productivity",
    "tags": ["notification", "system", "utility"],
    "repository": "https://github.com/startvibe/startvibe-cc-marketplace"
  }
}
```

### 必需字段

- `name`：插件标识符（在市场内必须唯一）
- `version`：遵循 SemVer 的语义版本
- `description`：人类可读的描述
- `author`：插件作者名称
- `license`：许可证标识符

### 可选字段

- `keywords`：可搜索关键词数组
- `engines`：Claude Code 版本要求
- `marketplace`：市场特定的元数据

## Hooks 配置合约

### 文件：`hooks/hooks.json`

```json
{
  "description": "Cross-platform system notifications for Claude Code events",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/stop-handler.sh",
            "timeout": 15
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/notification-handler.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Hook Event Contract

#### Stop Event

- **Trigger**: When Claude Code stops processing
- **Environment Variables**:
  - `CLAUDE_PLUGIN_ROOT`: Plugin root directory
  - `HOOK_EVENT_NAME`: "Stop"
  - `HOOK_EVENT_TIMESTAMP`: Unix timestamp
  - `HOOK_EVENT_DATA`: JSON string with event data
- **Timeout**: 15 seconds
- **Urgency**: Normal

#### Notification Event

- **Trigger**: When Claude Code needs user interaction
- **Environment Variables**:
  - `CLAUDE_PLUGIN_ROOT`: Plugin root directory
  - `HOOK_EVENT_NAME`: "Notification"
  - `HOOK_EVENT_TIMESTAMP`: Unix timestamp
  - `HOOK_EVENT_DATA`: JSON string with event data
- **Timeout**: 30 seconds
- **Urgency**: Critical

### Command Hook Contract

#### Hook Script Requirements

1. **Executable**: Must have execute permissions
2. **Shebang**: Must specify interpreter (`#!/bin/bash` or `#!/usr/bin/env bash`)
3. **Location**: Must be relative to `${CLAUDE_PLUGIN_ROOT}`
4. **Error Handling**: Must return appropriate exit codes
5. **Timeout**: Must complete within specified timeout

#### Exit Code Contract

- `0`: Success
- `1`: General error
- `2`: Configuration error
- `3`: Platform not supported
- `4`: Permission denied
- `5`: Invalid input

#### Standard Output Contract

- Success: JSON object with notification details
- Error: Human-readable error message

```json
// Success output
{
  "success": true,
  "platform": "macos",
  "method": "osascript",
  "title": "Claude Response Complete",
  "message": "Task processing completed",
  "duration": 500
}

// Error output
{
  "success": false,
  "error": "Platform not supported",
  "code": "PLATFORM_ERROR"
}
```

## Marketplace Integration Contract

### File: `.claude-plugin/marketplace.json` (Root marketplace)

```json
{
  "name": "StartVibe Claude Code Marketplace",
  "description": "Official marketplace for StartVibe Claude Code plugins",
  "version": "1.0.0",
  "plugins": [
    "./plugins/notify-plugin"
  ],
  "author": "StartVibe Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/startvibe/startvibe-cc-marketplace"
  }
}
```

### Plugin Discovery Contract

1. **Directory Structure**: Plugin must be in `plugins/` subdirectory
2. **Metadata**: Must have valid `.claude-plugin/plugin.json`
3. **Hooks**: Must have valid `hooks/hooks.json` (if using hooks)
4. **Validation**: Must pass marketplace validation

## Shell Script API Contract

### Platform Detection Contract

```bash
# Function signature
detect_platform() -> string

# Return values
"macos"    - macOS platform
"windows"  - Windows platform
"linux"    - Linux platform
"unknown"  - Unsupported platform
```

### Notification Contract

#### macOS Notification

```bash
# Function signature
send_macos_notification(title, message, urgency, sound?) -> exit_code

# Implementation requirements
- Use osascript with display notification
- Support urgency mapping (low->normal, normal->normal, critical->critical)
- Handle sound parameter appropriately
- Return 0 on success, non-zero on failure
```

#### Windows Notification

```bash
# Function signature
send_windows_notification(title, message, urgency, sound?) -> exit_code

# Implementation requirements
- Use PowerShell Add-Type and ShowNotification
- Support toast notifications
- Map urgency appropriately
- Return 0 on success, non-zero on failure
```

#### Linux Notification

```bash
# Function signature
send_linux_notification(title, message, urgency, sound?) -> exit_code

# Implementation requirements
- Use notify-send if available
- Support urgency levels
- Fallback to zenity if notify-send unavailable
- Return 0 on success, non-zero on failure
```

### Configuration Contract

#### Configuration File Location

```bash
# Priority order
1. $CLAUDE_PLUGIN_ROOT/config/user-config.json
2. $HOME/.claude-code/notify-plugin/config.json
3. $CLAUDE_PLUGIN_ROOT/config/default-config.json
```

#### Configuration Schema Contract

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

## Template Variable Contract

### Available Variables

| Variable | Type | Source | Availability |
|----------|------|--------|--------------|
| `{{title}}` | string | Event template | All events |
| `{{message}}` | string | Event template | All events |
| `{{sessionId}}` | string | Hook environment | Stop event |
| `{{hookEventName}}` | string | Hook environment | All events |
| `{{timestamp}}` | number | Hook environment | All events |
| `{{cwd}}` | string | Hook environment | All events |
| `{{permissionMode}}` | string | Hook environment | All events |

### Template Processing Contract

1. **Variable Replacement**: Replace `{{variable}}` with actual values
2. **Missing Variables**: Replace with empty string
3. **HTML Escaping**: Escape HTML special characters in content
4. **Length Limits**: Enforce platform-specific length restrictions

## Error Handling Contract

### Error Categories

1. **Platform Errors**: Platform not supported or tools unavailable
2. **Configuration Errors**: Invalid or missing configuration
3. **Execution Errors**: Script execution failures
4. **Permission Errors**: Insufficient permissions
5. **System Errors**: System-level failures

### Error Reporting Contract

```bash
# Standard error format
log_error(category, message, details?) {
  # Log to stderr with structured JSON format
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"category\":\"$category\",\"message\":\"$message\"}" >&2
}
```

### Graceful Degradation Contract

1. **Notification Failure**: Fall back to console output
2. **Platform Unavailable**: Use alternative notification methods
3. **Configuration Error**: Use default configuration
4. **Timeout**: Exit gracefully with appropriate status

## Performance Contract

### Response Time Requirements

- **Platform Detection**: < 100ms
- **Configuration Loading**: < 50ms
- **Notification Sending**: < 500ms
- **Total Hook Execution**: < timeout value

### Resource Limits

- **Memory Usage**: < 10MB per hook execution
- **CPU Usage**: < 5% during notification
- **Disk I/O**: Minimal, only for configuration
- **Network**: No network access required

### Logging Contract

```bash
# Log levels
DEBUG: Detailed debugging information
INFO:  General information messages
WARN:  Warning messages
ERROR: Error messages

# Log format
{"timestamp":"ISO8601","level":"LEVEL","component":"script_name","message":"content"}
```

## Testing Contract

### Unit Testing Requirements

1. **Platform Detection**: Test on all supported platforms
2. **Configuration Validation**: Test with valid/invalid configs
3. **Template Processing**: Test variable replacement
4. **Error Handling**: Test error scenarios

### Integration Testing Requirements

1. **Hook Execution**: Test with Claude Code hooks
2. **Notification Sending**: Test actual notifications
3. **Cross-Platform**: Test on macOS, Windows, Linux
4. **Performance**: Test response time requirements

### Contract Validation

1. **Schema Validation**: Validate all JSON schemas
2. **API Compatibility**: Verify API contract compliance
3. **Error Scenarios**: Test error handling paths
4. **Edge Cases**: Test boundary conditions