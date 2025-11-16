# Research Documentation: 通知插件 (Notify Plugin)

## Research Summary

Based on comprehensive analysis of Claude Code official documentation and existing marketplace structure, this document outlines the correct implementation approach for the notification plugin.

## Key Findings

### 1. **Plugin Structure Requirements**

**Decision**: Plugin must be located within marketplace structure, not as standalone project

- **Location**: `plugins/notify-plugin/` instead of `notify-plugin/`
- **Rationale**: Claude Code marketplace plugins follow specific directory structure for proper integration
- **Alternatives considered**: Standalone plugin structure (rejected due to marketplace integration requirements)

### 2. **Hook Implementation Approach**

**Decision**: Use command-based hooks with shell scripts instead of JavaScript classes

- **Method**: hooks/hooks.json with command type hooks calling shell scripts
- **Rationale**: Aligns with Claude Code official hook architecture and provides better cross-platform compatibility
- **Alternatives considered**: JavaScript-based hook handlers (rejected due to complexity and maintenance overhead)

### 3. **Cross-Platform Notification Strategy**

**Decision**: Use native platform notification tools via shell scripts

- **macOS**: osascript with display notification
- **Linux**: notify-send with zenity fallback
- **Windows**: PowerShell MessageBox commands
- **Rationale**: No external dependencies, reliable cross-platform support
- **Alternatives considered**: node-notifier library (rejected due to dependency complexity in plugin context)

### 4. **Marketplace Integration**

**Decision**: Follow StartVibe marketplace structure with proper plugin referencing

- **Configuration**: Update marketplace.json to reference `./plugins/notify-plugin`
- **Rationale**: Ensures proper plugin discovery and installation within marketplace
- **Alternatives considered**: Separate marketplace (rejected due to complexity)

## Technical Decisions

### Plugin Architecture

- **Structure**: Standard Claude Code plugin with hooks integration
- **Dependencies**: Native platform tools only (no npm packages)
- **Configuration**: JSON-based with shell script execution
- **Testing**: Marketplace integration testing with cross-platform validation

### Hook Configuration

- **Stop Event**: Command-based hook with 15s timeout, normal urgency
- **Notification Event**: Command-based hook with 30s timeout, critical urgency
- **Error Handling**: Graceful fallback to console output when notifications fail

### Cross-Platform Implementation

- **Detection**: Shell script for platform identification
- **Notification Handlers**: Platform-specific shell scripts
- **Fallback Mechanisms**: Alternative notification methods per platform

## Implementation Requirements

### Directory Structure

```
startvibe-cc-marketplace/
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── plugins/
│   └── notify-plugin/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── hooks/
│       │   └── hooks.json
│       ├── scripts/
│       │   ├── detect-platform.sh
│       │   ├── notification-handler.sh
│       │   └── stop-handler.sh
│       ├── src/
│       │   └── index.js
│       ├── config/
│       │   └── default-config.json
│       ├── tests/
│       └── README.md
```

### Hook Configuration Format

```json
{
  "description": "Cross-platform system notifications for Claude Code events",
  "hooks": {
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
    ],
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
    ]
  }
}
```

## Compliance Assessment

### Constitution Compliance ✅

- **市场标准合规性**: Follows standard plugin structure and marketplace integration
- **插件架构卓越性**: Modular, single-purpose with minimal dependencies
- **MCP 集成策略**: Not required for notification functionality
- **中文优先文档**: Will include comprehensive Chinese documentation
- **测试与质量**: Automated testing for cross-platform compatibility
- **安全要求**: Uses safe shell commands with input validation
- **性能标准**: Fast script execution with appropriate timeouts
- **开发工具规范**: Follows ESLint/Prettier standards where applicable

## Risk Mitigation

### Technical Risks

- **Platform Compatibility**: Implemented with detection and fallback mechanisms
- **Hook Execution Failures**: Timeout handling and error logging
- **Security Concerns**: Input validation and safe command execution

### Implementation Risks

- **Marketplace Integration**: Verified structure compatibility with official documentation
- **User Adoption**: Simple configuration with clear documentation
- **Maintenance**: Minimal dependencies reduce maintenance burden

## Next Steps

1. **Restructure Project**: Move notify-plugin to plugins/notify-plugin/
2. **Implement Hooks**: Create hooks/hooks.json with command-based configuration
3. **Develop Shell Scripts**: Implement cross-platform notification handlers
4. **Update Marketplace**: Configure proper marketplace.json references
5. **Test Integration**: Verify marketplace installation and hook functionality
6. **Document**: Create comprehensive Chinese documentation

## Research Sources

- Claude Code Plugin Development Guide
- Claude Code Hooks Reference Documentation
- StartVibe Marketplace Structure Analysis
- Cross-Platform Notification Tool Research
