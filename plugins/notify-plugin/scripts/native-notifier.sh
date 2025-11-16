#!/bin/bash
# Claude Code 通知插件 - 原生通知封装脚本
# 版本: 1.0.0
# 描述: 跨平台原生通知工具封装
# 作者: StartVibe 团队
# 许可证: MIT

set -euo pipefail

# 脚本常量
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
readonly CONFIG_DIR="$PLUGIN_ROOT/config"

# 错误处理函数
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

# 平台检测
detect_platform() {
  case "$(uname -s)" in
    Darwin*)
      echo "macos"
      ;;
    CYGWIN*|MINGW*|MSYS*)
      echo "windows"
      ;;
    Linux*)
      echo "linux"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

# 发送 macOS 通知
send_macos_notification() {
  local title="$1"
  local message="$2"
  local urgency="${3:-normal}"
  local sound="${4:-true}"

  log_debug "发送 macOS 通知: title='$title', message='$message', urgency=$urgency, sound=$sound"

  # 构建声音选项
  local sound_option=""
  if [[ "$sound" == "true" ]]; then
    sound_option='sound name "Glass"'
  fi

  # 构建 osascript 命令
  local osascript_cmd="display notification \"$message\" with title \"$title\" $sound_option"

  # 执行通知
  if osascript -e "$osascript_cmd" 2>/dev/null; then
    log_debug "macOS 通知发送成功"
    return 0
  else
    log_error "macOS 通知发送失败"
    return 1
  fi
}

# 发送 Linux 通知
send_linux_notification() {
  local title="$1"
  local message="$2"
  local urgency="${3:-normal}"
  local sound="${4:-true}"

  log_debug "发送 Linux 通知: title='$title', message='$message', urgency=$urgency, sound=$sound"

  # 设置紧急程度选项
  local urgency_option="--urgency=normal"
  case "$urgency" in
    critical) urgency_option="--urgency=critical" ;;
    low) urgency_option="--urgency=low" ;;
    normal) urgency_option="--urgency=normal" ;;
  esac

  # 首先尝试 notify-send
  if command -v notify-send >/dev/null 2>&1; then
    if notify-send $urgency_option "$title" "$message" 2>/dev/null; then
      log_debug "Linux 通知通过 notify-send 发送成功"
      return 0
    else
      log_error "Linux 通知通过 notify-send 发送失败"
    fi
  else
    log_error "notify-send 未安装"
  fi

  # 回退到 zenity
  if command -v zenity >/dev/null 2>&1; then
    if zenity --info --title="$title" --text="$message" --timeout=8 2>/dev/null; then
      log_debug "Linux 通知通过 zenity 发送成功"
      return 0
    else
      log_error "Linux 通知通过 zenity 发送失败"
    fi
  fi

  # 最后回退到控制台输出
  echo "[$(date)] $title: $message"
  log_error "Linux 通知发送失败，无可用的通知方法"
  return 1
}

# 发送 Windows 通知
send_windows_notification() {
  local title="$1"
  local message="$2"
  local urgency="${3:-normal}"
  local sound="${4:-true}"

  log_debug "发送 Windows 通知: title='$title', message='$message', urgency=$urgency, sound=$sound"

  # PowerShell 通知脚本
  local powershell_script="
    Add-Type -AssemblyName System.Windows.Forms;
    \$notification = New-Object System.Windows.Forms.NotifyIcon;
    \$notification.Icon = [System.Drawing.SystemIcons]::Information;
    \$notification.BalloonTipTitle = '$title';
    \$notification.BalloonTipText = '$message';
    \$notification.Visible = \$true;
    \$notification.ShowBalloonTip(5000);
    Start-Sleep -Milliseconds 5100;
    \$notification.Dispose();
  "

  # 执行 PowerShell 脚本
  if powershell.exe -Command "$powershell_script" 2>/dev/null; then
    log_debug "Windows 通知发送成功"
    return 0
  else
    log_error "Windows 通知发送失败"
    return 1
  fi
}

# 主通知发送函数
send_notification() {
  local title="$1"
  local message="$2"
  local urgency="${3:-normal}"
  local sound="${4:-true}"

  if [[ -z "$title" || -z "$message" ]]; then
    log_error "标题和消息不能为空"
    return 1
  fi

  local platform
  platform=$(detect_platform)

  log_info "在 $platform 平台上发送通知: title='$title', urgency=$urgency"

  case "$platform" in
    "macos")
      send_macos_notification "$title" "$message" "$urgency" "$sound"
      ;;
    "windows")
      send_windows_notification "$title" "$message" "$urgency" "$sound"
      ;;
    "linux")
      send_linux_notification "$title" "$message" "$urgency" "$sound"
      ;;
    *)
      log_error "不支持的平台: $platform"
      # 回退到控制台输出
      echo "[$(date)] $title: $message"
      return 1
      ;;
  esac
}

# 检查原生工具可用性
check_native_tools() {
  local platform="$1"

  case "$platform" in
    "macos")
      # osascript 内置，总是可用
      return 0
      ;;
    "linux")
      # 检查 notify-send 是否安装
      if command -v notify-send >/dev/null 2>&1; then
        return 0
      elif command -v zenity >/dev/null 2>&1; then
        return 0
      else
        return 1
      fi
      ;;
    "windows")
      # 检查 PowerShell 是否可用
      if command -v powershell >/dev/null 2>&1; then
        return 0
      else
        return 1
      fi
      ;;
    *)
      return 1
      ;;
  esac
}

# 显示使用说明
show_usage() {
  cat << EOF
使用方法: $0 <title> <message> [urgency] [sound]

参数:
  title     通知标题 (必需)
  message   通知内容 (必需)
  urgency   紧急程度 (可选): low, normal, critical (默认: normal)
  sound     是否播放声音 (可选): true, false (默认: true)

示例:
  $0 "Claude 完成" "任务处理完成"
  $0 "需要权限" "Claude 需要您的确认" critical true
  $0 "信息提示" "这是一个提示消息" low false

环境变量:
  DEBUG=true  启用调试输出
EOF
}

# 主函数
main() {
  # 检查参数
  if [[ $# -lt 2 ]]; then
    echo "错误: 缺少必需参数" >&2
    echo
    show_usage
    exit 1
  fi

  local title="$1"
  local message="$2"
  local urgency="${3:-normal}"
  local sound="${4:-true}"

  # 验证紧急程度参数
  case "$urgency" in
    low|normal|critical) ;;
    *)
      echo "错误: 无效的紧急程度 '$urgency'" >&2
      echo "有效的值: low, normal, critical" >&2
      exit 1
      ;;
  esac

  # 验证声音参数
  case "$sound" in
    true|false) ;;
    *)
      echo "错误: 无效的声音参数 '$sound'" >&2
      echo "有效的值: true, false" >&2
      exit 1
      ;;
  esac

  # 发送通知
  if send_notification "$title" "$message" "$urgency" "$sound"; then
    log_info "通知发送成功"
    exit 0
  else
    log_error "通知发送失败"
    exit 1
  fi
}

# 如果直接执行脚本（而非被 source），则运行主函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi