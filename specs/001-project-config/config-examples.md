# 配置示例文档

**目的**: 基于官方文档的配置示例
**参考**: Claude Code 官方文档

## 市场配置示例

### 基础市场配置 (.claude-plugin/marketplace.json)

```json
{
  "name": "startvibe-tools",
  "owner": {
    "name": "StartVibe Team",
    "email": "dev@startvibe.com"
  },
  "plugins": [
    {
      "name": "project-config",
      "source": "./plugins/project-config",
      "description": "项目配置初始化工具",
      "version": "1.0.0",
      "author": {
        "name": "StartVibe Team"
      },
      "license": "MIT",
      "keywords": ["development", "configuration", "eslint", "prettier"],
      "category": "productivity"
    }
  ]
}
```

### 高级市场配置示例

```json
{
  "name": "enterprise-tools",
  "owner": {
    "name": "Enterprise Team",
    "email": "enterprise@company.com",
    "url": "https://company.com"
  },
  "metadata": {
    "version": "2.1.0",
    "description": "企业级 Claude Code 插件集合",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "security-scanner",
      "source": {
        "source": "github",
        "repo": "company/security-scanner"
      },
      "description": "安全代码扫描工具",
      "version": "2.1.0",
      "author": {
        "name": "Security Team",
        "email": "security@company.com"
      },
      "homepage": "https://docs.company.com/plugins/security-scanner",
      "repository": "https://github.com/company/security-scanner",
      "license": "MIT",
      "keywords": ["security", "scanning", "enterprise"],
      "category": "development",
      "commands": ["./commands/core/", "./commands/enterprise/"],
      "agents": [
        "./agents/security-reviewer.md",
        "./agents/compliance-checker.md"
      ],
      "hooks": {
        "PostToolUse": [
          {
            "matcher": "Write|Edit",
            "hooks": [
              {
                "type": "command",
                "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh",
                "timeout": 30
              }
            ]
          }
        ]
      },
      "mcpServers": {
        "enterprise-db": {
          "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
          "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
        }
      },
      "strict": false
    }
  ]
}
```

## 插件 Hooks 配置示例

### 基础 Hooks 配置 (hooks/hooks.json)

```json
{
  "description": "项目配置插件的 hooks",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format-check.sh",
            "timeout": 15
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "评估此 Bash 命令是否安全：$ARGUMENTS。检查潜在的安全风险。",
            "timeout": 10
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/setup-environment.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### 代码格式化 Hooks

```json
{
  "description": "自动代码格式化 hooks",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$CLAUDE_PROJECT_DIR/$1\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

## 项目设置配置

### Claude Code 设置 (.claude/settings.json)

```json
{
  "extraKnownMarketplaces": {
    "startvibe-tools": {
      "source": {
        "source": "github",
        "repo": "startvibe/claude-plugins"
      }
    },
    "local-dev": {
      "source": {
        "source": "url",
        "url": "file://$CLAUDE_PROJECT_DIR/.claude-plugin/marketplace.json"
      }
    }
  },
  "enabledPlugins": ["project-config@startvibe-tools"]
}
```

## 环境变量使用

### 插件脚本示例

```bash
#!/bin/bash
# scripts/validate.sh - 项目验证脚本

# 使用插件根目录环境变量
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR}"

echo "正在验证项目配置..."

# 运行 ESLint
if [ -f "$PROJECT_DIR/.eslintrc.js" ]; then
  echo "✓ ESLint 配置存在"
else
  echo "❌ 缺少 ESLint 配置"
  exit 1
fi

# 运行 Prettier
if [ -f "$PROJECT_DIR/.prettierrc" ]; then
  echo "✓ Prettier 配置存在"
else
  echo "❌ 缺少 Prettier 配置"
  exit 1
fi

# 检查 pnpm
if [ -f "$PROJECT_DIR/pnpm-lock.yaml" ]; then
  echo "✓ pnpm 锁定文件存在"
else
  echo "❌ 缺少 pnpm 锁定文件"
  exit 1
fi

echo "项目验证完成！"
exit 0
```

### 环境设置脚本

```bash
#!/bin/bash
# scripts/setup-environment.sh - 环境设置脚本

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR}"

echo "设置开发环境..."

# 检查 Node.js 版本
NODE_VERSION=$(node --version)
echo "Node.js 版本: $NODE_VERSION"

# 检查 pnpm
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  echo "pnpm 版本: $PNPM_VERSION"
else
  echo "警告: pnpm 未安装"
fi

# 设置环境变量（如果 CLAUDE_ENV_FILE 可用）
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=development' >> "$CLAUDE_ENV_FILE"
  echo 'export CLAUDE_PLUGIN_ROOT="'$PLUGIN_ROOT'"' >> "$CLAUDE_ENV_FILE"
fi

echo "环境设置完成！"
exit 0
```

## 验证和测试

### 市场验证命令

```bash
# 验证市场 JSON 语法
claude plugin validate .

# 添加本地市场用于测试
/plugin marketplace add ./.claude-plugin

# 安装测试插件
/plugin install project-config@startvibe-tools

# 验证插件安装
/plugin list
```

### 配置文件验证

```bash
# 验证 JSON 语法
jsonlint .claude-plugin/marketplace.json
jsonlint .claude-plugin/plugin.json
jsonlint hooks/hooks.json

# 验证脚本权限
chmod +x scripts/*.sh

# 测试 hooks
claude --debug
```

## 最佳实践

### 1. 文件结构组织

```
.claude-plugin/
├── plugin.json              # 插件元数据
├── marketplace.json         # 市场配置（如果这是市场）
├── hooks/
│   └── hooks.json          # 插件 hooks 配置
├── scripts/
│   ├── validate.sh         # 验证脚本
│   └── setup-environment.sh # 环境设置脚本
├── commands/
│   └── config-init.md      # 斜杠命令
└── README.md               # 插件文档（中文优先）
```

### 2. 错误处理

- 所有脚本都应使用适当的退出代码
- 使用 `set -e` 确保错误时停止执行
- 提供有意义的错误消息

### 3. 安全考虑

- 验证所有输入参数
- 使用绝对路径引用脚本
- 避免在 hooks 中执行危险操作
- 使用 `${CLAUDE_PLUGIN_ROOT}` 而不是相对路径

### 4. 性能优化

- 设置合理的 hooks 超时时间
- 避免在 hooks 中执行耗时操作
- 使用并行 hooks 提高效率
