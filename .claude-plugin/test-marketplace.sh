#!/bin/bash

echo "🧪 Testing marketplace plugin installation..."

# Check if marketplace.json exists and is valid
if [ ! -f ".claude-plugin/marketplace.json" ]; then
  echo "❌ marketplace.json not found"
  exit 1
fi

# Validate JSON syntax
if ! python3 -m json.tool .claude-plugin/marketplace.json > /dev/null; then
  echo "❌ Invalid JSON syntax in marketplace.json"
  exit 1
fi

# Check marketplace structure
MARKETPLACE_NAME=$(jq -r '.name' .claude-plugin/marketplace.json)
OWNER_NAME=$(jq -r '.owner.name' .claude-plugin/marketplace.json)
PLUGIN_COUNT=$(jq '.plugins | length' .claude-plugin/marketplace.json)

echo "📋 Marketplace Name: $MARKETPLACE_NAME"
echo "👤 Owner: $OWNER_NAME"
echo "📦 Plugin Count: $PLUGIN_COUNT"

# Verify plugin entries
for i in $(seq 0 $((PLUGIN_COUNT - 1))); do
  PLUGIN_NAME=$(jq -r ".plugins[$i].name" .claude-plugin/marketplace.json)
  PLUGIN_SOURCE=$(jq -r ".plugins[$i].source" .claude-plugin/marketplace.json)
  PLUGIN_VERSION=$(jq -r ".plugins[$i].version" .claude-plugin/marketplace.json)

  echo "✅ Plugin: $PLUGIN_NAME (v$PLUGIN_VERSION)"
  echo "   Source: $PLUGIN_SOURCE"

  # Check if plugin source exists
  if [ "$PLUGIN_SOURCE" = "./" ] || [ -d "$PLUGIN_SOURCE" ]; then
    echo "   ✅ Plugin source accessible"
  else
    echo "   ⚠️  Plugin source not accessible (external source)"
  fi
done

echo "🎉 Marketplace installation test completed successfully!"
exit 0