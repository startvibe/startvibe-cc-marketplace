#!/bin/bash
# Claude Code 通知插件 - Notification 事件处理器
# 版本: 1.0.0
# 描述: 处理 Claude Code Notification Hook 事件，发送权限请求通知
# 作者: StartVibe 团队
# 许可证: MIT

set -euo pipefail

# 脚本常量
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
readonly CONFIG_DIR="$PLUGIN_ROOT/config"
readonly LOG_DIR="${CLAUDE_CODE_LOGS:-$HOME/.claude-code/notify-plugin/logs}"

# 错误处理函数
handle_error() {
  local exit_code=$?
  local line_number=$1
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"error\",\"script\":\"$SCRIPT_NAME\",\"line\":$line_number,\"exitCode\":$exit_code,\"message\":\"Notification 事件处理失败\"}" >&2
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

# 确保 log 目录存在
ensure_log_directory() {
  if [[ ! -d "$LOG_DIR" ]]; then
    mkdir -p "$LOG_DIR" 2>/dev/null || {
      log_error "创建日志目录失败: $LOG_DIR"
      return 1
    }
  fi
}

# 加载配置
load_config() {
  local config_file
  local config_content
  local node_cmd

  # 优先查找 Node.js 命令
  if command -v node >/dev/null 2>&1; then
    node_cmd="node"
  elif command -v nodejs >/dev/null 2>&1; then
    node_cmd="nodejs"
  else
    log_error "Node.js 未安装，无法加载配置"
    return 1
  fi

  # 配置文件优先级
  for config_file in \
    "$CONFIG_DIR/user-config.json" \
    "$HOME/.claude-code/notify-plugin/config.json" \
    "$CONFIG_DIR/default-config.json"
  do
    if [[ -f "$config_file" && -r "$config_file" ]]; then
      config_content=$(cat "$config_file")
      if "$node_cmd" -e "JSON.parse('$config_content')" 2>/dev/null; then
        echo "$config_content"
        return 0
      else
        log_error "配置文件格式无效: $config_file"
      fi
    fi
  done

  # 返回空配置
  echo '{"version":"1.0.0","enabled":true,"events":{"notification":{"enabled":true,"sound":true,"urgency":"critical"}}}'
}

# 获取配置值
get_config_value() {
  local config="$1"
  local key="$2"
  local value

  # 使用 Node.js 解析 JSON
  if command -v node >/dev/null 2>&1; then
    value=$(echo "$config" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).$key || ''" 2>/dev/null || echo "")
  elif command -v jq >/dev/null 2>&1; then
    value=$(echo "$config" | jq -r ".$key // empty" 2>/dev/null || echo "")
  else
    # 简单的键值提取（仅适用于简单 JSON）
    value=$(echo "$config" | grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed 's/.*"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
  fi

  echo "$value"
}

# 处理模板变量
process_template() {
  local template="$1"
  local result="$template"

  # 提取环境变量
  local session_id="${sessionId:-}"
  local event_name="${HOOK_EVENT_NAME:-}"
  local event_timestamp="${HOOK_EVENT_TIMESTAMP:-}"
  local cwd_val="${cwd:-}"
  local permission_mode="${permissionMode:-}"

  # 替换常用变量
  result="${result//\{\{sessionId\}\}/$session_id}"
  result="${result//\{\{hookEventName\}\}/$event_name}"
  result="${result//\{\{timestamp\}\}/$event_timestamp}"
  result="${result//\{\{cwd\}\}/$cwd_val}"
  result="${result//\{\{permissionMode\}\}/$permission_mode}"

  # 如果有 Hook 数据，尝试解析
  if [[ -n "${HOOK_EVENT_DATA:-}" ]]; then
    local hook_title
    local hook_message
    local hook_operation_type
    local hook_operation_target

    hook_title=$(echo "$HOOK_EVENT_DATA" 2>/dev/null | command -v jq >/dev/null 2>&1 && echo "$HOOK_EVENT_DATA" | jq -r '.title // empty' || echo "")
    hook_message=$(echo "$HOOK_EVENT_DATA" 2>/dev/null | command -v jq >/dev/null 2>&1 && echo "$HOOK_EVENT_DATA" | jq -r '.message // empty' || echo "")
    hook_operation_type=$(echo "$HOOK_EVENT_DATA" 2>/dev/null | command -v jq >/dev/null 2>&1 && echo "$HOOK_EVENT_DATA" | jq -r '.operationType // empty' || echo "")
    hook_operation_target=$(echo "$HOOK_EVENT_DATA" 2>/dev/null | command -v jq >/dev/null 2>&1 && echo "$HOOK_EVENT_DATA" | jq -r '.operationTarget // empty' || echo "")

    if [[ -n "$hook_title" ]]; then
      result="${result//\{\{title\}\}/$hook_title}"
    fi
    if [[ -n "$hook_message" ]]; then
      result="${result//\{\{message\}\}/$hook_message}"
    fi
    if [[ -n "$hook_operation_type" ]]; then
      result="${result//\{\{operationType\}\}/$hook_operation_type}"
    fi
    if [[ -n "$hook_operation_target" ]]; then
      result="${result//\{\{operationTarget\}\}/$hook_operation_target}"
    fi
  fi

  echo "$result"
}

# 验证配置
validate_config() {
  local config="$1"

  # 基本格式验证
  if ! echo "$config" | command -v jq >/dev/null 2>&1 && echo "$config" | jq empty 2>/dev/null; then
    log_error "配置 JSON 格式无效"
    return 1
  fi

  # 检查必需字段
  local version
  version=$(get_config_value "$config" "version")
  if [[ -z "$version" ]]; then
    log_error "配置缺少版本字段"
    return 1
  fi

  # 检查 Notification 事件配置
  local notification_enabled
  notification_enabled=$(get_config_value "$config" "events.notification.enabled")
  if [[ "$notification_enabled" != "true" ]]; then
    log_debug "Notification 事件已禁用"
    return 1
  fi

  return 0
}

# 处理 Notification 事件
handle_notification_event() {
  local config="$1"

  log_info "开始处理 Notification 事件"

  # 获取事件配置
  local custom_title
  local custom_message
  local urgency
  local sound

  custom_title=$(get_config_value "$config" "events.notification.customTemplate.title")
  custom_message=$(get_config_value "$config" "events.notification.customTemplate.message")
  urgency=$(get_config_value "$config" "events.notification.urgency" || echo "critical")
  sound=$(get_config_value "$config" "events.notification.sound" || echo "true")

  # 设置默认标题和消息
  local title="$custom_title"
  local message="$custom_message"

  if [[ -z "$title" ]]; then
    title="Claude Requires Attention"
  fi

  if [[ -z "$message" ]]; then
    message="Claude needs your input to continue"
  fi

  # 处理模板变量
  title=$(process_template "$title")
  message=$(process_template "$message")

  log_info "准备发送通知: title='$title', urgency=$urgency, sound=$sound"

  # 调用原生通知脚本
  local notifier_script="$PLUGIN_ROOT/scripts/native-notifier.sh"

  if [[ -f "$notifier_script" ]]; then
    if "$notifier_script" "$title" "$message" "$urgency" "$sound"; then
      log_info "Notification 事件通知发送成功"
      return 0
    else
      log_error "Notification 事件通知发送失败"
      return 1
    fi
  else
    log_error "原生通知脚本不存在: $notifier_script"
    return 1
  fi
}

# 解析 Hook 事件数据
parse_hook_data() {
  local hook_data="${HOOK_EVENT_DATA:-}"

  if [[ -n "$hook_data" ]]; then
    log_debug "Hook 事件数据: $hook_data"

    # 尝试解析 JSON 数据
    if command -v jq >/dev/null 2>&1; then
      local operation_type
      local operation_target
      operation_type=$(echo "$hook_data" | jq -r '.operationType // empty' 2>/dev/null || echo "")
      operation_target=$(echo "$hook_data" | jq -r '.operationTarget // empty' 2>/dev/null || echo "")

      if [[ -n "$operation_type" ]]; then
        log_info "检测到操作类型: $operation_type"
        case "$operation_type" in
          "file_write"|"file_read")
            log_info "文件操作需要用户权限: $operation_target"
            ;;
          "bash_command")
            log_info "命令执行需要用户权限: $operation_target"
            ;;
          "tool_use")
            log_info "工具使用需要用户权限"
            ;;
          *)
            log_info "未知操作类型需要用户权限: $operation_type"
            ;;
        esac
      fi
    fi
  else
    log_debug "没有 Hook 事件数据"
  fi
}

# 主函数
main() {
  local event_name="${HOOK_EVENT_NAME:-unknown}"

  # 确保 log 目录存在
  ensure_log_directory

  log_info "收到 Hook 事件: $event_name"

  # 检查事件类型
  if [[ "$event_name" != "Notification" ]]; then
    log_error "不支持的 Hook 事件类型: $event_name"
    exit 1
  fi

  # 解析 Hook 事件数据
  parse_hook_data

  # 加载配置
  local config
  config=$(load_config)

  # 验证配置
  if ! validate_config "$config"; then
    log_error "配置验证失败"
    exit 1
  fi

  # 处理 Notification 事件
  if handle_notification_event "$config"; then
    log_info "Notification 事件处理完成"
    exit 0
  else
    log_error "Notification 事件处理失败"
    exit 1
  fi
}

# 记录性能指标
PERFORMANCE_START=$(date +%s%N 2>/dev/null || date +%s)

# 执行主函数
main "$@"; exit_code=$?

# 记录性能指标
PERFORMANCE_END=$(date +%s%N 2>/dev/null || date +%s)
if command -v bc >/dev/null 2>&1; then
  DURATION=$(echo "scale=3; ($PERFORMANCE_END - $PERFORMANCE_START) / 1000000" | bc)
  log_info "脚本执行时间: ${DURATION}ms"
fi

exit $exit_code