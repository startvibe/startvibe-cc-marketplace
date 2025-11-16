#!/bin/bash
# Marketplace 验证脚本
# 验证 Claude Code marketplace 配置和插件注册

set -euo pipefail

echo "🔍 验证 Claude Code Marketplace 配置"
echo "========================================"

# 验证 marketplace.json
if [[ ! -f ".claude-plugin/marketplace.json" ]]; then
    echo "❌ 错误: 未找到 marketplace.json"
    exit 1
fi

echo "✅ marketplace.json 存在"

# 验证 JSON 格式
if ! jq empty .claude-plugin/marketplace.json 2>/dev/null; then
    echo "❌ 错误: marketplace.json 格式无效"
    exit 1
fi

echo "✅ marketplace.json 格式有效"

# 验证插件路径
PLUGIN_PATH=$(jq -r '.plugins[0]' .claude-plugin/marketplace.json 2>/dev/null)
if [[ "$PLUGIN_PATH" == "null" || -z "$PLUGIN_PATH" ]]; then
    echo "❌ 错误: 未找到注册的插件"
    exit 1
fi

echo "✅ 插件路径已注册: $PLUGIN_PATH"

# 验证插件目录存在
if [[ ! -d "$PLUGIN_PATH" ]]; then
    echo "❌ 错误: 插件目录不存在: $PLUGIN_PATH"
    exit 1
fi

echo "✅ 插件目录存在"

# 验证插件元数据
if [[ ! -f "$PLUGIN_PATH/.claude-plugin/plugin.json" ]]; then
    echo "❌ 错误: 插件元数据不存在"
    exit 1
fi

echo "✅ 插件元数据存在"

# 验证 hooks 配置
if [[ ! -f "$PLUGIN_PATH/hooks/hooks.json" ]]; then
    echo "❌ 错误: hooks 配置不存在"
    exit 1
fi

echo "✅ hooks 配置存在"

# 验证脚本文件
SCRIPTS=("native-notifier.sh" "platform-check.sh" "stop-handler.sh" "notification-handler.sh")
for script in "${SCRIPTS[@]}"; do
    if [[ ! -f "$PLUGIN_PATH/scripts/$script" ]]; then
        echo "❌ 错误: 脚本文件不存在: $script"
        exit 1
    fi
    if [[ ! -x "$PLUGIN_PATH/scripts/$script" ]]; then
        echo "❌ 错误: 脚本文件无执行权限: $script"
        exit 1
    fi
done

echo "✅ 所有脚本文件存在且可执行"

# 验证 JavaScript 模块
if [[ ! -f "$PLUGIN_PATH/src/index.js" || ! -f "$PLUGIN_PATH/src/config.js" ]]; then
    echo "❌ 错误: JavaScript 模块缺失"
    exit 1
fi

echo "✅ JavaScript 模块存在"

# 验证配置文件
if [[ ! -f "$PLUGIN_PATH/config/default-config.json" ]]; then
    echo "❌ 错误: 默认配置文件不存在"
    exit 1
fi

echo "✅ 默认配置文件存在"

# 验证文档
if [[ ! -f "$PLUGIN_PATH/README.md" ]]; then
    echo "❌ 错误: README.md 文档不存在"
    exit 1
fi

echo "✅ README.md 文档存在"

# 显示插件信息
PLUGIN_NAME=$(jq -r '.name' "$PLUGIN_PATH/.claude-plugin/plugin.json" 2>/dev/null)
PLUGIN_VERSION=$(jq -r '.version' "$PLUGIN_PATH/.claude-plugin/plugin.json" 2>/dev/null)
PLUGIN_DESCRIPTION=$(jq -r '.description' "$PLUGIN_PATH/.claude-plugin/plugin.json" 2>/dev/null)

echo
echo "📦 插件信息"
echo "==========="
echo "名称: $PLUGIN_NAME"
echo "版本: $PLUGIN_VERSION"
echo "描述: $PLUGIN_DESCRIPTION"

# 测试平台检测
echo
echo "🧪 运行平台检测测试"
echo "=================="
cd "$PLUGIN_PATH" && CLAUDE_PLUGIN_ROOT="$(pwd)" ./scripts/platform-check.sh --report

echo
echo "🎉 Marketplace 验证完成！"
echo "=============================="
echo "✅ notify-plugin 已成功注册到 Claude Code Marketplace"
echo "✅ 所有必要文件和配置都已就位"
echo "✅ 插件可以立即使用"