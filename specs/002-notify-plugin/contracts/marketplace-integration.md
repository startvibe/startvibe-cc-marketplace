# 市场集成合约

## 概述

本合约定义了通知插件在 StartVibe Claude Code 市场结构中的集成要求。

## 市场结构合约

### 根市场配置

**文件**：`.claude-plugin/marketplace.json`

```json
{
  "name": "StartVibe Claude Code Marketplace",
  "description": "Official marketplace for StartVibe Claude Code plugins",
  "version": "1.0.0",
  "plugins": ["./plugins/notify-plugin"],
  "author": "StartVibe Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/startvibe/startvibe-cc-marketplace"
  },
  "supportedPlatforms": ["macos", "windows", "linux"],
  "claudeCodeVersion": ">=1.0.0"
}
```

### 插件目录结构

```
startvibe-cc-marketplace/
├── .claude-plugin/
│   ├── marketplace.json         # 根市场配置
│   └── plugin.json              # 根插件元数据
├── plugins/
│   └── notify-plugin/           # 通知插件目录
│       ├── .claude-plugin/
│       │   └── plugin.json      # 插件元数据 (必需)
│       ├── hooks/
│       │   └── hooks.json       # Hook 配置 (必需)
│       ├── scripts/             # Shell 脚本（主要实现）
│       │   ├── notification-handler.sh
│       │   ├── stop-handler.sh
│       │   ├── native-notifier.sh  # 原生通知封装
│       │   └── platform-check.sh   # 平台检测
│       ├── src/                 # 轻量级 JavaScript
│       │   ├── index.js         # 配置管理入口
│       │   └── config.js        # 配置文件处理
│       ├── config/              # 配置文件 (可选)
│       │   └── default-config.json
│       └── README.md            # 插件文档 (必需)
```

## 插件元数据合约

### 插件 JSON 架构

**文件**: `plugins/notify-plugin/.claude-plugin/plugin.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Plugin identifier (lowercase, hyphen-separated)"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version (major.minor.patch)"
    },
    "description": {
      "type": "string",
      "minLength": 10,
      "maxLength": 200,
      "description": "Human-readable plugin description"
    },
    "author": {
      "type": "string",
      "minLength": 1,
      "description": "Plugin author name"
    },
    "license": {
      "type": "string",
      "enum": ["MIT", "Apache-2.0", "BSD-3-Clause", "GPL-3.0"],
      "description": "License identifier"
    },
    "keywords": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[a-z0-9-]+$"
      },
      "minItems": 1,
      "maxItems": 10,
      "description": "Searchable keywords"
    },
    "engines": {
      "type": "object",
      "properties": {
        "claude-code": {
          "type": "string",
          "pattern": "^>=\\d+\\.\\d+\\.\\d+$",
          "description": "Claude Code version requirement"
        }
      },
      "required": ["claude-code"]
    },
    "marketplace": {
      "type": "object",
      "properties": {
        "category": {
          "type": "string",
          "enum": ["productivity", "development", "utility", "accessibility"],
          "description": "Plugin category in marketplace"
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "maxItems": 5,
          "description": "Marketplace tags"
        },
        "featured": {
          "type": "boolean",
          "default": false,
          "description": "Whether plugin is featured"
        }
      }
    }
  },
  "required": ["name", "version", "description", "author", "license", "engines"]
}
```

### Required Metadata Fields

1. **name**: Unique plugin identifier
2. **version**: Semantic version string
3. **description**: Clear, concise description
4. **author**: Plugin author
5. **license**: SPDX license identifier
6. **engines**: Claude Code version compatibility

### Recommended Metadata Fields

1. **keywords**: Searchable terms
2. **marketplace**: Marketplace-specific settings
3. **repository**: Source code repository

## Hook Integration Contract

### Hook Configuration Schema

**File**: `plugins/notify-plugin/hooks/hooks.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "description": {
      "type": "string",
      "minLength": 10,
      "description": "Human-readable description of hook functionality"
    },
    "hooks": {
      "type": "object",
      "patternProperties": {
        "^(Stop|Notification|SessionStart|SessionEnd|PreToolUse|PostToolUse|UserPromptSubmit|PreCompact)$": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "hooks": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": ["command"],
                      "description": "Hook execution type"
                    },
                    "command": {
                      "type": "string",
                      "pattern": "^\\$\\{CLAUDE_PLUGIN_ROOT\\}/.*\\.(sh|bat|ps1)$",
                      "description": "Command to execute, relative to plugin root"
                    },
                    "timeout": {
                      "type": "number",
                      "minimum": 1,
                      "maximum": 120,
                      "description": "Execution timeout in seconds"
                    },
                    "conditions": {
                      "type": "object",
                      "properties": {
                        "platforms": {
                          "type": "array",
                          "items": {
                            "type": "string",
                            "enum": ["macos", "windows", "linux"]
                          }
                        }
                      }
                    }
                  },
                  "required": ["type", "command"],
                  "additionalProperties": false
                }
              }
            }
          }
        }
      }
    }
  },
  "required": ["description", "hooks"]
}
```

### Hook Command Requirements

1. **Path Resolution**: Must use `${CLAUDE_PLUGIN_ROOT}` environment variable
2. **File Extension**: Must match platform conventions (.sh, .bat, .ps1)
3. **Execute Permissions**: Script files must be executable
4. **Timeout Compliance**: Must complete within specified timeout
5. **Error Handling**: Must return appropriate exit codes

### 原生通知工具支持

#### 支持的操作系统和工具

| 操作系统 | 通知工具    | 状态      | 要求                                 |
| -------- | ----------- | --------- | ------------------------------------ |
| macOS    | osascript   | ✅ 内置   | 无需额外安装                         |
| Linux    | notify-send | ✅ 需安装 | `sudo apt-get install libnotify-bin` |
| Windows  | PowerShell  | ✅ 内置   | 无需额外安装                         |

#### 平台检测和回退机制

```json
{
  "description": "Cross-platform system notifications using native tools",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/platform-check.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

#### 平台检测脚本示例

```bash
#!/bin/bash
# scripts/platform-check.sh
readonly PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"

# 检测平台
detect_platform() {
  case "$(uname -s)" in
    Darwin*)
      echo "macos"
      ;;
    Linux*)
      echo "linux"
      ;;
    CYGWIN*|MINGW*|MSYS*)
      echo "windows"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

PLATFORM=$(detect_platform)
echo "✓ 检测到平台: $PLATFORM"

# 检查通知工具可用性
check_notification_tools() {
  case "$PLATFORM" in
    "macos")
      # osascript 内置，无需检查
      echo "✓ macOS osascript 可用"
      ;;
    "linux")
      if command -v notify-send >/dev/null 2>&1; then
        echo "✓ Linux notify-send 可用"
      else
        echo "⚠ 建议安装 notify-send: sudo apt-get install libnotify-bin"
      fi
      ;;
    "windows")
      if command -v powershell >/dev/null 2>&1; then
        echo "✓ Windows PowerShell 可用"
      else
        echo "❌ PowerShell 不可用"
      fi
      ;;
  esac
}

check_notification_tools
```

### 插件安装时自动触发依赖安装

#### 方案A：通过 PreToolUse Hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/ensure-dependencies.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

#### 方案B：捆绑 node-notifier 源码

```bash
#!/bin/bash
# scripts/use-bundled-notifier.sh
readonly PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
readonly BUNDLED_NOTIFIER="$PLUGIN_ROOT/lib/node-notifier.js"

# 如果存在捆绑版本，使用它
if [ -f "$BUNDLED_NOTIFIER" ]; then
  export NODE_PATH="$PLUGIN_ROOT/lib:$NODE_PATH"
  echo "✓ 使用捆绑的 node-notifier"
else
  # 回退到检查系统安装的版本
  if ! node -e "require('node-notifier')" 2>/dev/null; then
    echo "❌ 需要安装 node-notifier"
    exit 1
  fi
fi
```

## Plugin Discovery Contract

### Discovery Process

1. **Marketplace Loading**: Claude Code loads `.claude-plugin/marketplace.json`
2. **Plugin Enumeration**: Reads `plugins` array and validates each plugin
3. **Metadata Validation**: Validates each plugin's `.claude-plugin/plugin.json`
4. **Hook Registration**: Registers hooks from `hooks/hooks.json`
5. **Dependency Resolution**: Resolves any plugin dependencies

### Validation Requirements

#### Plugin Validation

```bash
# Validation checklist
- Plugin directory exists
- .claude-plugin/plugin.json exists and is valid
- hooks/hooks.json exists (if hooks are used)
- Script files exist and are executable
- Required metadata fields are present
- Version follows semantic versioning
- License is valid SPDX identifier
```

#### Hook Validation

```bash
# Hook validation checklist
- Hook configuration is valid JSON
- Command paths are relative to plugin root
- Timeout values are within acceptable range
- Script files have execute permissions
- Platform-specific conditions are valid
```

## Installation Contract

### Plugin Installation Process

1. **Marketplace Clone**: Clone marketplace repository
2. **Plugin Validation**: Validate all plugins in marketplace
3. **Hook Registration**: Register hooks for each valid plugin
4. **Configuration Setup**: Create default configuration if needed
5. **Dependency Check**: Verify system dependencies

### Installation Requirements

#### System Requirements

- **Operating System**: macOS 10.12+, Windows 8+, Ubuntu 16.04+
- **Claude Code**: Version 1.0.0 or higher
- **Shell**: Bash 4.0+, PowerShell 5.0+, or Windows Command Prompt
- **Permissions**: Execute permissions for script files

#### Platform Dependencies

```bash
# macOS requirements
- osascript (built-in)
- terminal-notifier (optional, for enhanced notifications)

# Windows requirements
- PowerShell (built-in)
- .NET Framework 4.5+ (built-in)

# Linux requirements
- notify-send (libnotify-bin)
- zenity (fallback option)
```

## Configuration Management Contract

### Configuration File Locations

```bash
# Priority order (highest to lowest)
1. $CLAUDE_PLUGIN_ROOT/config/user-config.json
2. $HOME/.claude-code/notify-plugin/config.json
3. $CLAUDE_PLUGIN_ROOT/config/default-config.json
```

### Configuration Schema Contract

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "enabled": {
      "type": "boolean",
      "default": true
    },
    "defaultSound": {
      "type": "boolean",
      "default": true
    },
    "events": {
      "type": "object",
      "patternProperties": {
        "^[a-z-]+$": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean" },
            "sound": { "type": "boolean" },
            "urgency": {
              "type": "string",
              "enum": ["low", "normal", "critical"]
            }
          }
        }
      }
    }
  }
}
```

## Update and Migration Contract

### Version Management

1. **Semantic Versioning**: Follow SemVer for plugin versions
2. **Backward Compatibility**: Maintain backward compatibility when possible
3. **Migration Scripts**: Provide migration for breaking changes
4. **Configuration Migration**: Automatic configuration upgrades

### Update Process

1. **Version Check**: Compare installed vs available version
2. **Backup Creation**: Backup current configuration
3. **Plugin Update**: Download and install new version
4. **Configuration Migration**: Migrate configuration if needed
5. **Validation**: Validate updated plugin installation

### Migration Requirements

```bash
# Migration checklist
- Backup existing configuration
- Validate new version compatibility
- Migrate configuration format
- Test plugin functionality
- Restore configuration if migration fails
```

## Security Contract

### Plugin Security Requirements

1. **Sandbox Execution**: Plugins run in restricted environment
2. **Resource Limits**: Enforce memory and CPU limits
3. **File System Access**: Limited to plugin directory and user config
4. **Network Access**: No network access unless explicitly required
5. **Input Validation**: Validate all user inputs and environment data

### Script Security Requirements

1. **Path Validation**: Validate all file paths
2. **Command Injection**: Prevent command injection attacks
3. **Privilege Escalation**: No privilege escalation attempts
4. **Data Sanitization**: Sanitize all external data
5. **Error Handling**: Secure error message handling

### Security Validation

```bash
# Security checklist
- Script files have appropriate permissions
- No hardcoded sensitive data
- Input validation is implemented
- Error messages don't leak information
- File access is limited to required directories
```

## Performance Contract

### Performance Requirements

1. **Startup Time**: Plugin initialization < 100ms
2. **Hook Execution**: Hook response < specified timeout
3. **Memory Usage**: < 10MB per plugin
4. **CPU Usage**: < 5% during execution
5. **Disk I/O**: Minimal configuration file access

### Monitoring Requirements

1. **Execution Metrics**: Track execution time and success rate
2. **Error Tracking**: Monitor and log errors
3. **Resource Usage**: Monitor memory and CPU usage
4. **Performance Alerts**: Alert on performance degradation

## Testing Contract

### Testing Requirements

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test plugin with Claude Code hooks
3. **Platform Tests**: Test on all supported platforms
4. **Performance Tests**: Validate performance requirements
5. **Security Tests**: Validate security requirements

### Test Coverage

1. **Code Coverage**: Minimum 80% line coverage
2. **Hook Coverage**: All hook configurations tested
3. **Platform Coverage**: All supported platforms tested
4. **Error Coverage**: All error paths tested

## Documentation Contract

### Required Documentation

1. **README.md**: Plugin overview and usage instructions
2. **CHANGELOG.md**: Version history and changes
3. **LICENSE**: License file
4. **Configuration Guide**: Detailed configuration options
5. **Troubleshooting Guide**: Common issues and solutions

### Documentation Requirements

1. **Language**: Primary documentation in Chinese
2. **Clarity**: Clear, concise, and accurate
3. **Completeness**: Cover all features and configurations
4. **Maintenance**: Keep documentation updated with code changes
