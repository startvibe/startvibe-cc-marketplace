# Shell 脚本 API 合约

## 概述

本合约定义了通知插件中使用的 Shell 脚本的 API 和行为要求。

## 脚本结构要求

### 标准脚本头部

所有脚本必须包含以下头部：

```bash
#!/bin/bash
# Claude Code 通知插件 - 脚本名称
# 版本: 1.0.0
# 描述: 脚本目的的简要描述
# 作者: StartVibe 团队
# 许可证: Apache-2.0

set -euo pipefail  # 遇到错误、未定义变量、管道失败时退出

# 脚本常量
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
readonly CONFIG_DIR="$PLUGIN_ROOT/config"
readonly LOG_DIR="${CLAUDE_CODE_LOGS:-$HOME/.claude-code/notify-plugin/logs}"
```

### 错误处理标准

```bash
# 标准错误处理函数
handle_error() {
  local exit_code=$?
  local line_number=$1
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"error\",\"script\":\"$SCRIPT_NAME\",\"line\":$line_number,\"exitCode\":$exit_code,\"message\":\"脚本执行失败\"}" >&2
  exit $exit_code
}

# 设置错误陷阱
trap 'handle_error $LINENO' ERR

# 日志记录函数
log_info() {
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"info\",\"script\":\"$SCRIPT_NAME\",\"message\":\"$1\"}"
}

log_error() {
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"error\",\"script\":\"$SCRIPT_NAME\",\"message\":\"$1\"}" >&2
}

log_debug() {
  if [[ "${DEBUG:-false}" == "true" ]]; then
    echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"debug\",\"script\":\"$SCRIPT_NAME\",\"message\":\"$1\"}"
  fi
}
```

## 平台检测 API

### 函数：detect_platform

**签名**: `detect_platform() -> string`

**返回值**:

- `"macos"` - macOS 平台
- `"windows"` - Windows 平台
- `"linux"` - Linux 平台
- `"unknown"` - 不支持的平台

**实现**:

```bash
# Shell 脚本中的平台检测
detect_platform() {
  local platform
  case "$(uname -s)" in
    Darwin*)
      platform="macos"
      ;;
    CYGWIN*|MINGW*|MSYS*)
      platform="windows"
      ;;
    Linux*)
      platform="linux"
      ;;
    *)
      platform="unknown"
      ;;
  esac
  echo "$platform"
}
```

### 函数：check_platform_support

**签名**: `check_platform_support(platform) -> boolean`

**参数**:

- `platform`: 来自 detect_platform() 的平台标识符

**返回值**: 支持则返回退出码 0，不支持则返回 1

**实现**:

```bash
check_platform_support() {
  local platform="$1"
  case "$platform" in
    macos|windows|linux)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}
```

## 原生通知 API

### 函数：send_native_notification

**签名**: `send_native_notification(title, message, urgency) -> boolean`

**参数**:

- `title`: 通知标题
- `message`: 通知内容
- `urgency`: 紧急程度 (`low`|`normal`|`critical`)

**返回值**: 成功返回退出码 0，失败返回 1

**实现**:

```bash
send_native_notification() {
  local title="$1"
  local message="$2"
  local urgency="${3:-normal}"
  local platform=$(detect_platform)

  case "$platform" in
    "macos")
      # 使用 osascript 发送通知
      osascript -e "display notification \"$message\" with title \"$title\"" 2>/dev/null
      return $?
      ;;
    "linux")
      # 使用 notify-send 发送通知
      if command -v notify-send >/dev/null 2>&1; then
        notify-send --urgency="$urgency" "$title" "$message" 2>/dev/null
        return $?
      else
        echo "错误: notify-send 未安装" >&2
        return 1
      fi
      ;;
    "windows")
      # 使用 PowerShell 发送通知
      powershell -Command "
        Add-Type -AssemblyName System.Windows.Forms;
        \$notification = New-Object System.Windows.Forms.NotifyIcon;
        \$notification.BalloonTipTitle = '$title';
        \$notification.BalloonTipText = '$message';
        \$notification.Visible = \$true;
        \$notification.ShowBalloonTip(5000);
      " 2>/dev/null
      return $?
      ;;
    *)
      echo "错误: 不支持的平台 $platform" >&2
      return 1
      ;;
  esac
}
```

### 函数：check_native_tools

**签名**: `check_native_tools(platform) -> boolean`

**参数**:

- `platform`: 平台标识符

**返回值**: 工具可用返回 0，不可用返回 1

**实现**:

```bash
check_native_tools() {
  local platform="$1"

  case "$platform" in
    "macos")
      # osascript 内置，总是可用
      return 0
      ;;
    "linux")
      # 检查 notify-send 是否安装
      command -v notify-send >/dev/null 2>&1
      return $?
      ;;
    "windows")
      # 检查 PowerShell 是否可用
      command -v powershell >/dev/null 2>&1
      return $?
      ;;
    *)
      return 1
      ;;
  esac
}
```

## Configuration Management API

### Function: load_config

**Signature**: `load_config() -> JSON string`

**Returns**: Configuration as JSON string

**Implementation**:

```bash
load_config() {
  local config_file
  local config_content

  # Priority order for config files
  for config_file in \
    "$CONFIG_DIR/user-config.json" \
    "$HOME/.claude-code/notify-plugin/config.json" \
    "$CONFIG_DIR/default-config.json"
  do
    if [[ -f "$config_file" && -r "$config_file" ]]; then
      config_content=$(cat "$config_file")
      if validate_json "$config_content"; then
        echo "$config_content"
        return 0
      else
        log_error "Invalid JSON in config file: $config_file"
      fi
    fi
  done

  # Return empty config if no valid config found
  echo '{"version":"1.0.0","enabled":true,"defaultSound":true}'
}
```

### Function: get_config_value

**Signature**: `get_config_value(config, key) -> string`

**Parameters**:

- `config`: JSON configuration string
- `key`: JSON path to value (e.g., "events.stop.enabled")

**Returns**: Configuration value or empty string if not found

**Implementation**:

```bash
get_config_value() {
  local config="$1"
  local key="$2"

  # Use jq for JSON parsing if available, otherwise simple fallback
  if command -v jq >/dev/null 2>&1; then
    echo "$config" | jq -r ".$key // empty" 2>/dev/null || echo ""
  else
    # Simple key extraction for basic JSON (fallback)
    echo "$config" | grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed 's/.*" *: *" *\([^"]*\)".*/\1/' || echo ""
  fi
}
```

### Function: validate_config

**Signature**: `validate_config(config) -> boolean`

**Parameters**:

- `config`: JSON configuration string

**Returns**: Exit code 0 if valid, 1 if invalid

**Implementation**:

```bash
validate_config() {
  local config="$1"

  # Check if it's valid JSON
  if ! validate_json "$config"; then
    log_error "Invalid JSON configuration"
    return 1
  fi

  # Check required fields
  local version
  version=$(get_config_value "$config" "version")
  if [[ -z "$version" ]]; then
    log_error "Missing version in configuration"
    return 1
  fi

  # Validate semantic version
  if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Invalid version format: $version"
    return 1
  fi

  return 0
}
```

## Template Processing API

### Function: process_template

**Signature**: `process_template(template, variables) -> string`

**Parameters**:

- `template`: Template string with {{variables}}
- `variables`: JSON object with variable values

**Returns**: Processed string with variables replaced

**Implementation**:

```bash
process_template() {
  local template="$1"
  local variables="$2"
  local result="$template"

  # Extract variables from environment and hook data
  local session_id="${sessionId:-}"
  local event_name="${HOOK_EVENT_NAME:-}"
  local event_timestamp="${HOOK_EVENT_TIMESTAMP:-}"
  local cwd_val="${cwd:-}"
  local permission_mode="${permissionMode:-}"

  # Replace common variables
  result="${result//\{\{sessionId\}\}/$session_id}"
  result="${result//\{\{hookEventName\}\}/$event_name}"
  result="${result//\{\{timestamp\}\}/$event_timestamp}"
  result="${result//\{\{cwd\}\}/$cwd_val}"
  result="${result//\{\{permissionMode\}\}/$permission_mode}"

  # Escape HTML special characters
  result=$(echo "$result" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g; s/'"'"'/\&#39;/g')

  echo "$result"
}
```

### Function: validate_template

**Signature**: `validate_template(template) -> boolean`

**Parameters**:

- `template`: Template string to validate

**Returns**: Exit code 0 if valid, 1 if invalid

**Implementation**:

```bash
validate_template() {
  local template="$1"

  # Check for dangerous patterns
  if [[ "$template" =~ \$\(|\`|&&|\|\||>; ]]; then
    log_error "Template contains potentially dangerous characters"
    return 1
  fi

  # Check length limits
  if [[ ${#template} -gt 1000 ]]; then
    log_error "Template too long (max 1000 characters)"
    return 1
  fi

  return 0
}
```

## Notification API

### Function: send_notification

**Signature**: `send_notification(title, message, urgency, sound?) -> exit_code`

**Parameters**:

- `title`: Notification title
- `message`: Notification message
- `urgency`: "low", "normal", or "critical"
- `sound`: Optional boolean (default: true)

**Returns**: Exit code 0 on success, non-zero on failure

**Implementation**:

```bash
send_notification() {
  local title="$1"
  local message="$2"
  local urgency="${3:-normal}"
  local sound="${4:-true}"

  local platform
  platform=$(detect_platform)

  log_info "Sending notification on $platform: title='$title', urgency=$urgency"

  case "$platform" in
    macos)
      send_macos_notification "$title" "$message" "$urgency" "$sound"
      ;;
    windows)
      send_windows_notification "$title" "$message" "$urgency" "$sound"
      ;;
    linux)
      send_linux_notification "$title" "$message" "$urgency" "$sound"
      ;;
    *)
      log_error "Unsupported platform: $platform"
      # Fallback to console output
      echo "[$(date)] $title: $message"
      return 1
      ;;
  esac
}
```

### macOS Notification API

#### Function: send_macos_notification

**Signature**: `send_macos_notification(title, message, urgency, sound) -> exit_code`

**Implementation**:

```bash
send_macos_notification() {
  local title="$1"
  local message="$2"
  local urgency="$3"
  local sound="$4"

  # Map urgency to macOS notification levels
  local osascript_urgency="normal"
  case "$urgency" in
    critical) osascript_urgency="critical" ;;
    low|normal) osascript_urgency="normal" ;;
  esac

  # Build osascript command
  local sound_option=""
  if [[ "$sound" == "true" ]]; then
    sound_option='sound name "Glass"'
  fi

  local osascript_cmd="
    display notification \"$message\" with title \"$title\" $sound_option
  "

  # Execute notification
  if osascript -e "$osascript_cmd" 2>/dev/null; then
    log_debug "macOS notification sent successfully"
    return 0
  else
    log_error "Failed to send macOS notification"
    return 1
  fi
}
```

### Windows Notification API

#### Function: send_windows_notification

**Signature**: `send_windows_notification(title, message, urgency, sound) -> exit_code`

**Implementation**:

```bash
send_windows_notification() {
  local title="$1"
  local message="$2"
  local urgency="$3"
  local sound="$4"

  # PowerShell notification script
  local powershell_script="
    Add-Type -AssemblyName System.Windows.Forms
    $notification = New-Object System.Windows.Forms.NotifyIcon
    $notification.Icon = [System.Drawing.SystemIcons]::Information
    $notification.BalloonTipTitle = '$title'
    $notification.BalloonTipText = '$message'
    $notification.Visible = \$true
    $notification.ShowBalloonTip(3000)
    Start-Sleep -Milliseconds 3100
    \$notification.Dispose()
  "

  # Execute PowerShell script
  if powershell.exe -Command "$powershell_script" 2>/dev/null; then
    log_debug "Windows notification sent successfully"
    return 0
  else
    log_error "Failed to send Windows notification"
    return 1
  fi
}
```

### Linux Notification API

#### Function: send_linux_notification

**Signature**: `send_linux_notification(title, message, urgency, sound) -> exit_code`

**Implementation**:

```bash
send_linux_notification() {
  local title="$1"
  local message="$2"
  local urgency="$3"
  local sound="$4"

  # Try notify-send first
  if command -v notify-send >/dev/null 2>&1; then
    local urgency_option="--urgency=normal"
    case "$urgency" in
      critical) urgency_option="--urgency=critical" ;;
      low) urgency_option="--urgency=low" ;;
      normal) urgency_option="--urgency=normal" ;;
    esac

    if notify-send $urgency_option "$title" "$message" 2>/dev/null; then
      log_debug "Linux notification sent via notify-send"
      return 0
    else
      log_error "Failed to send notification via notify-send"
    fi
  fi

  # Fallback to zenity
  if command -v zenity >/dev/null 2>&1; then
    if zenity --info --title="$title" --text="$message" --timeout=5 2>/dev/null; then
      log_debug "Linux notification sent via zenity"
      return 0
    else
      log_error "Failed to send notification via zenity"
    fi
  fi

  # Final fallback to console
  echo "[$(date)] $title: $message"
  log_error "No notification method available on Linux"
  return 1
}
```

## Utility Functions API

### Function: validate_json

**Signature**: `validate_json(json_string) -> boolean`

**Implementation**:

```bash
validate_json() {
  local json_string="$1"

  # Try using jq if available
  if command -v jq >/dev/null 2>&1; then
    echo "$json_string" | jq empty 2>/dev/null
  else
    # Simple JSON validation fallback
    echo "$json_string" | python3 -m json.tool >/dev/null 2>&1 2>/dev/null || \
    echo "$json_string" | node -e "JSON.parse(require('fs').readFileSync(0, 'utf8'))" >/dev/null 2>&1 2>/dev/null
  fi
}
```

### Function: sanitize_input

**Signature**: `sanitize_input(input) -> string`

**Implementation**:

```bash
sanitize_input() {
  local input="$1"

  # Remove dangerous characters
  input=$(echo "$input" | sed 's/[^a-zA-Z0-9 _.,!?-]//g')

  # Limit length
  if [[ ${#input} -gt 500 ]]; then
    input="${input:0:500}"
  fi

  echo "$input"
}
```

### Function: ensure_log_directory

**Signature**: `ensure_log_directory() -> void`

**Implementation**:

```bash
ensure_log_directory() {
  if [[ ! -d "$LOG_DIR" ]]; then
    mkdir -p "$LOG_DIR" 2>/dev/null || {
      log_error "Failed to create log directory: $LOG_DIR"
      return 1
    }
  fi
}
```

## Hook Handler API

### Standard Hook Entry Point

All hook handlers must follow this structure:

```bash
#!/bin/bash
# Claude Code Notification Plugin - Hook Handler
# Event: $HOOK_EVENT_NAME
# Timestamp: $HOOK_EVENT_TIMESTAMP

# Include standard library
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Main function
main() {
  local event_name="${HOOK_EVENT_NAME:-unknown}"
  local config
  local event_enabled

  # Load configuration
  config=$(load_config)
  if ! validate_config "$config"; then
    log_error "Invalid configuration, using defaults"
    config='{"version":"1.0.0","enabled":true}'
  fi

  # Check if event is enabled
  event_enabled=$(get_config_value "$config" "events.${event_name,,}.enabled")
  if [[ "$event_enabled" != "true" ]]; then
    log_debug "Event $event_name is disabled in configuration"
    exit 0
  fi

  # Process the event
  case "$event_name" in
    "Stop")
      handle_stop_event "$config"
      ;;
    "Notification")
      handle_notification_event "$config"
      ;;
    *)
      log_error "Unknown event type: $event_name"
      exit 1
      ;;
  esac
}

# Event handler functions
handle_stop_event() {
  local config="$1"
  local title="Claude Response Complete"
  local message="Claude has finished processing your request"

  # Get custom template if configured
  local custom_title
  local custom_message
  custom_title=$(get_config_value "$config" "events.stop.customTemplate.title")
  custom_message=$(get_config_value "$config" "events.stop.customTemplate.message")

  if [[ -n "$custom_title" ]]; then
    title=$(process_template "$custom_title" "{}")
  fi
  if [[ -n "$custom_message" ]]; then
    message=$(process_template "$custom_message" "{}")
  fi

  local urgency
  urgency=$(get_config_value "$config" "events.stop.urgency" || echo "normal")
  local sound
  sound=$(get_config_value "$config" "events.stop.sound" || echo "true")

  send_notification "$title" "$message" "$urgency" "$sound"
}

handle_notification_event() {
  local config="$1"
  local title="Claude Requires Attention"
  local message="Claude needs your input to continue"

  # Parse hook data for specific notification content
  if [[ -n "${HOOK_EVENT_DATA:-}" ]]; then
    # Extract message from hook data if available
    local hook_message
    hook_message=$(echo "$HOOK_EVENT_DATA" | jq -r '.message // empty' 2>/dev/null || echo "")
    if [[ -n "$hook_message" ]]; then
      message="$hook_message"
    fi
  fi

  local urgency="critical"
  local sound="true"

  send_notification "$title" "$message" "$urgency" "$sound"
}

# Execute main function
main "$@"
```

## Exit Code Contract

### Standard Exit Codes

- `0`: Success
- `1`: General error
- `2`: Configuration error
- `3`: Platform not supported
- `4`: Permission denied
- `5`: Invalid input
- `6\*\*: Timeout exceeded
- `7\*\*: Required dependency missing

### Error Output Format

All error messages should be JSON format:

```json
{
  "timestamp": "2024-01-16T10:30:00Z",
  "level": "error",
  "script": "notification-handler.sh",
  "exitCode": 2,
  "message": "Configuration file not found",
  "details": {
    "configPath": "/path/to/config.json"
  }
}
```

## Performance Requirements

### Execution Time Limits

- **Platform Detection**: < 50ms
- **Configuration Loading**: < 100ms
- **Template Processing**: < 50ms
- **Notification Sending**: < 500ms
- **Total Execution**: < hook timeout

### Resource Limits

- **Memory Usage**: < 5MB per script execution
- **CPU Usage**: < 2% during normal operation
- **File I/O**: Only read configuration files
- **Network**: No network access required

### Optimization Requirements

1. **Caching**: Cache configuration values during execution
2. **Early Exit**: Exit early if configuration disables the event
3. **Error Fast-Fail**: Validate inputs before processing
4. **Minimal Dependencies**: Use only built-in system commands

This contract ensures consistent, reliable, and secure behavior across all shell scripts in the notification plugin.
