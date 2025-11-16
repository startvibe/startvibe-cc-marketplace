#!/bin/bash
# Claude Code 通知插件 - 平台检测脚本
# 版本: 1.0.0
# 描述: 检测操作系统平台和通知工具可用性
# 作者: StartVibe 团队
# 许可证: MIT

set -euo pipefail

# 脚本常量
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"

# 错误处理函数
handle_error() {
  local exit_code=$?
  local line_number=$1
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"error\",\"script\":\"$SCRIPT_NAME\",\"line\":$line_number,\"exitCode\":$exit_code,\"message\":\"平台检测脚本执行失败\"}" >&2
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

# 检查平台支持
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

# 获取系统详细信息
get_system_info() {
  local platform="$1"

  case "$platform" in
    "macos")
      echo "macOS $(sw_vers -productVersion) ($(uname -m))"
      ;;
    "linux")
      if [[ -f /etc/os-release ]]; then
        local distro
        distro=$(grep "^PRETTY_NAME=" /etc/os-release | cut -d'"' -f2)
        echo "$distro ($(uname -m))"
      else
        echo "Linux ($(uname -m))"
      fi
      ;;
    "windows")
      echo "Windows ($(uname -m))"
      ;;
    *)
      echo "Unknown System ($(uname -m))"
      ;;
  esac
}

# 检查通知工具可用性
check_notification_tools() {
  local platform="$1"
  local tools_available=()
  local tools_missing=()

  case "$platform" in
    "macos")
      # macOS 使用内置的 osascript
      if command -v osascript >/dev/null 2>&1; then
        tools_available+=("osascript (内置)")
        log_info "✓ macOS osascript 可用"
      else
        tools_missing+=("osascript")
        log_error "❌ macOS osascript 不可用（异常情况）"
      fi
      ;;
    "linux")
      # 检查 notify-send
      if command -v notify-send >/dev/null 2>&1; then
        tools_available+=("notify-send")
        log_info "✓ Linux notify-send 可用"
      else
        tools_missing+=("notify-send")
        log_error "❌ Linux notify-send 未安装，建议运行: sudo apt-get install libnotify-bin"
      fi

      # 检查 zenity 作为备选
      if command -v zenity >/dev/null 2>&1; then
        tools_available+=("zenity (备选)")
        log_info "✓ Linux zenity 可用（备选方案）"
      else
        log_info "ℹ Linux zenity 未安装，可选备选方案: sudo apt-get install zenity"
      fi
      ;;
    "windows")
      # 检查 PowerShell
      if command -v powershell >/dev/null 2>&1; then
        tools_available+=("PowerShell")
        log_info "✓ Windows PowerShell 可用"
      else
        tools_missing+=("PowerShell")
        log_error "❌ Windows PowerShell 不可用（异常情况）"
      fi

      # 检查 PowerShell Core (pwsh)
      if command -v pwsh >/dev/null 2>&1; then
        tools_available+=("PowerShell Core")
        log_info "✓ Windows PowerShell Core 可用"
      fi
      ;;
    *)
      log_error "❌ 不支持的平台: $platform"
      tools_missing+=("支持的平台: macOS, Linux, Windows")
      ;;
  esac

  # 输出检测结果
  if [[ ${#tools_available[@]} -gt 0 ]]; then
    echo
    echo "可用的通知工具:"
    for tool in "${tools_available[@]}"; do
      echo "  ✓ $tool"
    done
  fi

  if [[ ${#tools_missing[@]} -gt 0 ]]; then
    echo
    echo "缺失的工具:"
    for tool in "${tools_missing[@]}"; do
      echo "  ❌ $tool"
    done
  fi

  # 返回检测结果
  if [[ ${#tools_available[@]} -gt 0 ]]; then
    return 0
  else
    return 1
  fi
}

# 测试通知功能
test_notification() {
  local platform="$1"

  echo
  echo "正在测试通知功能..."

  # 调用原生通知脚本进行测试
  local notifier_script="$PLUGIN_ROOT/scripts/native-notifier.sh"

  if [[ -f "$notifier_script" ]]; then
    if "$notifier_script" "平台检测完成" "通知功能测试成功" "normal" "true"; then
      log_info "✓ 通知功能测试成功"
      return 0
    else
      log_error "❌ 通知功能测试失败"
      return 1
    fi
  else
    log_error "❌ 原生通知脚本不存在: $notifier_script"
    return 1
  fi
}

# 生成平台报告
generate_report() {
  local platform="$1"
  local system_info="$2"
  local tools_status="$3"

  echo
  echo "=== Claude Code 通知插件平台检测报告 ==="
  echo "检测时间: $(date)"
  echo "插件根目录: $PLUGIN_ROOT"
  echo
  echo "平台信息:"
  echo "  操作系统: $system_info"
  echo "  平台标识: $platform"
  echo

  if [[ $tools_status -eq 0 ]]; then
    echo "总体状态: ✓ 支持"
    echo "通知插件在此平台上可以正常工作。"
  else
    echo "总体状态: ❌ 不支持"
    echo "通知插件在此平台上缺少必要的工具支持。"
  fi

  echo
  echo "建议:"
  case "$platform" in
    "macos")
      echo "  - macOS 支持开箱即用的系统通知"
      echo "  - 确保在系统偏好设置中为 Claude Code 启用通知权限"
      ;;
    "linux")
      echo "  - 安装 libnotify-bin: sudo apt-get install libnotify-bin"
      echo "  - 可选安装 zenity: sudo apt-get install zenity"
      echo "  - 确保桌面环境支持通知"
      ;;
    "windows")
      echo "  - Windows 支持开箱即用的系统通知"
      echo "  - 确保在系统设置中为 Claude Code 启用通知"
      ;;
    *)
      echo "  - 当前平台不受支持"
      ;;
  esac
}

# 显示使用说明
show_usage() {
  cat << EOF
使用方法: $0 [选项]

选项:
  -h, --help     显示此帮助信息
  -v, --verbose  显示详细输出
  -t, --test     运行通知功能测试
  -r, --report   生成详细报告

环境变量:
  DEBUG=true     启用调试输出
EOF
}

# 主函数
main() {
  local verbose=false
  local run_test=false
  local generate_report_flag=false

  # 解析命令行参数
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_usage
        exit 0
        ;;
      -v|--verbose)
        verbose=true
        shift
        ;;
      -t|--test)
        run_test=true
        shift
        ;;
      -r|--report)
        generate_report_flag=true
        shift
        ;;
      *)
        echo "错误: 未知选项 $1" >&2
        show_usage
        exit 1
        ;;
    esac
  done

  # 检测平台
  local platform
  platform=$(detect_platform)

  if [[ "$verbose" == true ]]; then
    echo "检测到平台: $platform"
  fi

  # 检查平台支持
  if ! check_platform_support "$platform"; then
    log_error "不支持的平台: $platform"
    exit 1
  fi

  # 获取系统信息
  local system_info
  system_info=$(get_system_info "$platform")

  if [[ "$verbose" == true || "$generate_report_flag" == true ]]; then
    echo "系统信息: $system_info"
  fi

  # 检查通知工具
  local tools_status=0
  if ! check_notification_tools "$platform"; then
    tools_status=1
  fi

  # 运行通知测试
  if [[ "$run_test" == true ]]; then
    if ! test_notification "$platform"; then
      tools_status=1
    fi
  fi

  # 生成报告
  if [[ "$generate_report_flag" == true || "$verbose" == true ]]; then
    generate_report "$platform" "$system_info" "$tools_status"
  fi

  # 返回适当的状态码
  if [[ $tools_status -eq 0 ]]; then
    echo
    echo "✓ 平台检测完成 - 支持通知功能"
    exit 0
  else
    echo
    echo "❌ 平台检测完成 - 不支持通知功能"
    exit 1
  fi
}

# 如果直接执行脚本（而非被 source），则运行主函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi