# 数据模型：通知插件 (Notify Plugin)

## 概述

本文档定义了 Claude Code 市场通知插件的数据模型、接口和架构。该模型采用基于 Shell 脚本的方式，使用原生平台通知工具（macOS osascript、Linux notify-send、Windows PowerShell），实现零依赖的即装即用体验。

## 核心数据模型

### 插件元数据模型

```typescript
interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  repository: {
    type: string;
    url: string;
  };
  keywords: string[];
  engines: {
    node: string;
  };
}
```

### Hook 事件数据模型

```typescript
interface HookEvent {
  // Event identification
  hookEventName: 'Stop' | 'Notification';
  timestamp: number;

  // Session context
  sessionId?: string;
  transcriptPath?: string;
  cwd?: string;
  permissionMode?: string;

  // Event-specific data
  eventType?: string;
  message?: string;
  duration?: number;

  // Environment variables provided by Claude Code
  CLAUDE_PLUGIN_ROOT: string;
  HOOK_EVENT_NAME: string;
  HOOK_EVENT_TIMESTAMP: string;
  HOOK_EVENT_DATA?: string;
}
```

### Hook 配置模型

```typescript
interface HookConfiguration {
  description: string;
  hooks: {
    [eventName: string]: HookEventConfig[];
  };
}

interface HookEventConfig {
  hooks: HookDefinition[];
}

interface HookDefinition {
  type: 'command';
  command: string; // Path to shell script
  timeout: number; // Timeout in seconds
}
```

### 平台通知模型

```typescript
interface PlatformNotification {
  // Basic notification data
  title: string;
  message: string;
  urgency: 'low' | 'normal' | 'critical';

  // Platform-specific options
  platform: 'macos' | 'windows' | 'linux';
  sound?: boolean;
  timeout?: number;
  icon?: string;

  // Optional platform features
  subtitle?: string; // macOS only
  actions?: string[]; // macOS only
  appID?: string; // Windows only
  category?: string; // Linux only
  hint?: string; // Linux only (JSON format)
}
```

### Plugin Configuration Model

```typescript
interface PluginConfiguration {
  // Metadata
  version: string;
  lastModified: number;

  // Global settings
  enabled: boolean;
  defaultSound: boolean;

  // Event configurations
  events: {
    stop: EventConfiguration;
    notification: EventConfiguration;
  };

  // Display settings
  display: DisplayConfiguration;

  // Platform-specific settings
  platformSettings: PlatformSpecificSettings;
}

interface EventConfiguration {
  enabled: boolean;
  sound: boolean;
  urgency: 'low' | 'normal' | 'critical';
  customTemplate?: NotificationTemplate;
}

interface NotificationTemplate {
  title: string;
  message: string;
}

interface DisplayConfiguration {
  title: string;
  message: string;
  duration: number;
  icon?: string;
}

interface PlatformSpecificSettings {
  macos: MacOSSettings;
  windows: WindowsSettings;
  linux: LinuxSettings;
}

interface MacOSSettings {
  subtitle?: string;
  sound?: string;
  contentImage?: string;
  open?: string;
  actions?: string[];
  reply?: boolean;
  closeLabel?: string;
}

interface WindowsSettings {
  appID?: string;
  toastStyle?: 'modern' | 'classic';
  icon?: string;
  id?: number;
  remove?: number;
  install?: 'start-menu';
}

interface LinuxSettings {
  urgency?: 'low' | 'normal' | 'critical';
  category?: string;
  'app-name'?: string;
  timeout?: number;
  hint?: string;
}
```

## JSON Schema Definitions

### plugin.json Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Plugin display name"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version"
    },
    "description": {
      "type": "string",
      "description": "Plugin description"
    },
    "author": {
      "type": "string",
      "description": "Plugin author"
    },
    "license": {
      "type": "string",
      "description": "License identifier"
    },
    "keywords": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Plugin keywords"
    },
    "engines": {
      "type": "object",
      "properties": {
        "claude-code": {
          "type": "string",
          "description": "Claude Code version requirement"
        }
      }
    }
  },
  "required": ["name", "version", "description", "author"]
}
```

### hooks.json Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "description": {
      "type": "string",
      "description": "Hook configuration description"
    },
    "hooks": {
      "type": "object",
      "patternProperties": {
        "^(Stop|Notification|SessionStart)$": {
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
                      "enum": ["command"]
                    },
                    "command": {
                      "type": "string",
                      "description": "Command to execute for hook"
                    },
                    "timeout": {
                      "type": "number",
                      "minimum": 1,
                      "maximum": 120,
                      "description": "Command timeout in seconds"
                    }
                  },
                  "required": ["type", "command"]
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

### 自动依赖管理 Hook 配置示例

```json
{
  "description": "Cross-platform system notifications for Claude Code events with automatic dependency management",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/auto-install-dependencies.sh",
            "timeout": 60
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
            "timeout": 5
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
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### marketplace.json Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Marketplace display name"
    },
    "description": {
      "type": "string",
      "description": "Marketplace description"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "plugins": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Relative path to plugin directory"
      }
    },
    "author": {
      "type": "string",
      "description": "Marketplace author"
    },
    "license": {
      "type": "string",
      "description": "License identifier"
    },
    "repository": {
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "url": { "type": "string", "format": "uri" }
      }
    }
  },
  "required": ["name", "description", "version", "plugins"]
}
```

### User Configuration Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "lastModified": {
      "type": "number",
      "description": "Unix timestamp of last modification"
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
        "^(stop|notification)$": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean" },
            "sound": { "type": "boolean" },
            "urgency": {
              "type": "string",
              "enum": ["low", "normal", "critical"]
            },
            "customTemplate": {
              "type": "object",
              "properties": {
                "title": { "type": "string" },
                "message": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "display": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "message": { "type": "string" },
        "duration": {
          "type": "number",
          "minimum": 1,
          "maximum": 60
        },
        "icon": { "type": "string" }
      }
    },
    "platformSettings": {
      "type": "object",
      "properties": {
        "macos": { "$ref": "#/$defs/MacOSConfig" },
        "windows": { "$ref": "#/$defs/WindowsConfig" },
        "linux": { "$ref": "#/$defs/LinuxConfig" }
      }
    }
  },
  "required": ["version", "enabled"],
  "$defs": {
    "MacOSConfig": {
      "type": "object",
      "properties": {
        "subtitle": { "type": "string" },
        "sound": { "type": "string" },
        "contentImage": { "type": "string" },
        "open": { "type": "string" },
        "actions": {
          "type": "array",
          "items": { "type": "string" }
        },
        "reply": { "type": "boolean" },
        "closeLabel": { "type": "string" }
      }
    },
    "WindowsConfig": {
      "type": "object",
      "properties": {
        "appID": { "type": "string" },
        "toastStyle": {
          "type": "string",
          "enum": ["modern", "classic"]
        },
        "icon": { "type": "string" },
        "id": { "type": "number" },
        "remove": { "type": "number" },
        "install": { "type": "string" }
      }
    },
    "LinuxConfig": {
      "type": "object",
      "properties": {
        "urgency": {
          "type": "string",
          "enum": ["low", "normal", "critical"]
        },
        "category": { "type": "string" },
        "app_name": { "type": "string" },
        "timeout": { "type": "number" },
        "hint": { "type": "string" }
      }
    }
  }
}
```

## Template Variable System

### Template Variables

```typescript
interface TemplateVariables {
  title: string;
  message: string;
  sessionId?: string;
  eventType?: string;
  hookEventName: string;
  transcriptPath?: string;
  cwd?: string;
  permissionMode?: string;
  timestamp: number;
  duration?: number;
}
```

### Supported Variables

| Variable             | Type   | Description               | Example                     |
| -------------------- | ------ | ------------------------- | --------------------------- |
| `{{title}}`          | string | Event title               | "Claude Response Complete"  |
| `{{message}}`        | string | Event message             | "Task processing completed" |
| `{{sessionId}}`      | string | Session identifier        | "session-12345"             |
| `{{eventType}}`      | string | Event type                | "stop", "notification"      |
| `{{hookEventName}}`  | string | Hook event name           | "stop"                      |
| `{{transcriptPath}}` | string | Transcript file path      | "/tmp/transcript.txt"       |
| `{{cwd}}`            | string | Working directory         | "/Users/user/project"       |
| `{{permissionMode}}` | string | Permission mode           | "default"                   |
| `{{timestamp}}`      | number | Unix timestamp            | 1705123456789               |
| `{{duration}}`       | number | Event duration in seconds | 15                          |

## Shell Script Data Flow

### Input Data Structure

```bash
# Environment variables provided by Claude Code
CLAUDE_PLUGIN_ROOT="/path/to/plugins/notify-plugin"
HOOK_EVENT_NAME="Stop"
HOOK_EVENT_TIMESTAMP="1705123456789"
HOOK_EVENT_DATA='{"sessionId":"session-123","cwd":"/Users/user/project"}'

# Parsed variables for shell scripts
EVENT_NAME="Stop"
EVENT_TIMESTAMP="1705123456789"
SESSION_ID="session-123"
CWD="/Users/user/project"
```

### Command Execution Model

```typescript
interface CommandExecution {
  command: string; // Shell script path
  args: string[]; // Command arguments
  env: Record<string, string>; // Environment variables
  timeout: number; // Execution timeout
  workingDirectory: string; // Script execution directory
}

interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  error?: string;
}
```

## Platform Detection Model

### Platform Information

```typescript
interface PlatformInfo {
  platform: 'macos' | 'windows' | 'linux';
  architecture: 'x64' | 'arm64' | 'x86';
  version: string;

  // Platform capabilities
  notifications: {
    supported: boolean;
    nativeTools: string[]; // Available notification tools
    fallbackMethods: string[]; // Fallback notification methods
  };

  // Script compatibility
  shellPath: string; // Path to shell interpreter
  scriptExtensions: string[]; // Supported script extensions
}
```

### Platform Detection Logic

```bash
# Platform detection in shell scripts
detect_platform() {
  case "$(uname -s)" in
    Darwin*) echo "macos" ;;
    CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
    Linux*) echo "linux" ;;
    *) echo "unknown" ;;
  esac
}
```

## Error Handling Model

### Error Classification

```typescript
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

enum ErrorCategory {
  PLATFORM = 'platform',
  CONFIGURATION = 'configuration',
  EXECUTION = 'execution',
  PERMISSION = 'permission',
  SYSTEM = 'system',
}

interface PluginError {
  timestamp: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code: string;
  message: string;
  platform?: string;
  script?: string;
  exitCode?: number;
  details?: Record<string, unknown>;
}
```

### Error Logging Format

```bash
# Standard error logging format for shell scripts
log_error() {
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local script_name=$(basename "$0")
  echo "{\"timestamp\":\"$timestamp\",\"severity\":\"error\",\"script\":\"$script_name\",\"message\":\"$1\"}" >&2
}
```

## Configuration Storage Model

### File Structure

```
~/.claude-code/notify-plugin/
├── config.json                     # User configuration
├── logs/                           # Log files
│   ├── notifications.log           # Notification history
│   ├── errors.log                  # Error log
│   └── performance.log             # Performance metrics
└── backups/                        # Configuration backups
    └── config-*.json
```

### Configuration Migration

```typescript
interface MigrationConfig {
  fromVersion: string;
  toVersion: string;
  migrationSteps: MigrationStep[];
  backupRequired: boolean;
}

interface MigrationStep {
  type: 'property' | 'structure' | 'validation';
  description: string;
  transform: (oldConfig: unknown) => unknown;
  validate: (newConfig: unknown) => ValidationResult;
}
```

## Performance Metrics Model

### Metrics Collection

```typescript
interface NotificationMetrics {
  timestamp: number;
  eventType: string;
  platform: string;
  success: boolean;
  duration: number;
  method: string; // "osascript", "notify-send", "powershell"
  error?: string;
}

interface PluginMetrics {
  version: string;
  startTime: number;
  totalNotifications: number;
  successfulNotifications: number;
  failedNotifications: number;
  averageDuration: number;
  platformMetrics: {
    [platform: string]: PlatformMetrics;
  };
}

interface PlatformMetrics {
  platform: string;
  supported: boolean;
  availableTools: string[];
  totalAttempts: number;
  successRate: number;
  averageDuration: number;
  lastSuccess?: number;
  lastFailure?: number;
}
```

This data model provides a comprehensive foundation for the marketplace notification plugin with proper shell script integration, platform detection, and native notification tool support.
