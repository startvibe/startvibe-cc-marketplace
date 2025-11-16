#!/bin/bash

echo "🔍 Validating Claude Code plugin..."

# Check required files
if [ ! -f ".claude-plugin/plugin.json" ]; then
  echo "❌ Missing plugin.json"
  exit 1
fi

# Validate JSON syntax
if ! python3 -m json.tool .claude-plugin/plugin.json > /dev/null; then
  echo "❌ Invalid JSON syntax in plugin.json"
  exit 1
fi

# Check required fields
if ! jq -e '.name' .claude-plugin/plugin.json > /dev/null; then
  echo "❌ Missing required field: name"
  exit 1
fi

if ! jq -e '.version' .claude-plugin/plugin.json > /dev/null; then
  echo "❌ Missing required field: version"
  exit 1
fi

if ! jq -e '.description' .claude-plugin/plugin.json > /dev/null; then
  echo "❌ Missing required field: description"
  exit 1
fi

# Extract and display plugin info
PLUGIN_NAME=$(jq -r '.name' .claude-plugin/plugin.json)
PLUGIN_VERSION=$(jq -r '.version' .claude-plugin/plugin.json)
PLUGIN_DESC=$(jq -r '.description' .claude-plugin/plugin.json)

echo "✅ Plugin validation passed!"
echo "📦 Plugin Name: $PLUGIN_NAME"
echo "🔖 Plugin Version: $PLUGIN_VERSION"
echo "📝 Description: $PLUGIN_DESC"

exit 0