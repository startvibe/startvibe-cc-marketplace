# Data Model: 项目配置初始化

**Date**: 2025-11-16
**Phase**: Phase 1 - Design & Contracts
**Purpose**: Define data structures for project configuration and marketplace compliance

## Core Data Entities

### 1. PluginMetadata (plugin.json)

```typescript
interface PluginMetadata {
  name: string; // 插件唯一名称
  version: string; // 语义版本号 (semver)
  description: string; // 插件描述（中文优先）
  author?: string; // 作者信息
  license?: string; // 开源许可证
  main?: string; // 主入口文件
  commands?: Command[]; // 斜杠命令列表
  agents?: Agent[]; // 专门代理列表
  skills?: Skill[]; // 技能列表
  dependencies?: Dependency[]; // 插件依赖
  engines?: {
    // 环境要求
    claude?: string; // Claude Code 版本要求
    node?: string; // Node.js 版本要求
  };
  keywords?: string[]; // 关键词标签
  repository?: {
    // 代码仓库信息
    type: string; // 如 "git"
    url: string; // 仓库 URL
  };
  homepage?: string; // 项目主页
  bugs?: {
    // 问题反馈
    url: string;
  };
  scripts?: {
    // 自定义脚本
    [key: string]: string;
  };
}
```

### 2. MarketplaceConfig (marketplace.json)

```typescript
interface MarketplaceConfig {
  name: string; // 市场标识符（kebab-case，无空格）
  owner: string | OwnerInfo; // 市场维护者信息
  plugins: PluginEntry[]; // 插件条目列表
  metadata?: {
    // 可选元数据
    version?: string; // 市场配置版本
    description?: string; // 市场简短描述
    pluginRoot?: string; // 相对插件来源的基本路径
  };
}

interface OwnerInfo {
  name: string;
  email?: string;
  url?: string;
}
```

### 3. PluginEntry

```typescript
interface PluginEntry {
  name: string; // 插件标识符（kebab-case，无空格）
  source: string | SourceConfig; // 插件源地址
  description?: string; // 插件简短描述
  version?: string; // 插件版本
  author?: string | AuthorInfo; // 插件作者信息
  homepage?: string; // 插件主页或文档 URL
  repository?: string; // 源代码仓库 URL
  license?: string; // SPDX 许可证标识符
  keywords?: string[]; // 用于插件发现和分类的标签
  category?: string; // 用于组织的插件类别
  tags?: string[]; // 用于可搜索性的标签
  strict?: boolean; // 在插件文件夹中需要 plugin.json（默认：true）
  commands?: string | string[]; // 命令文件或目录的自定义路径
  agents?: string | string[]; // 代理文件的自定义路径
  hooks?: string | HooksConfig; // 自定义钩子配置或钩子文件的路径
  mcpServers?: string | MCPConfig; // MCP 服务器配置或 MCP 配置的路径
}

interface SourceConfig {
  source: 'github' | 'git' | 'url';
  repo?: string; // GitHub 仓库（格式：owner/repo）
  url?: string; // Git 仓库 URL
}

interface AuthorInfo {
  name: string;
  email?: string;
  url?: string;
}

interface HooksConfig {
  [eventName: string]: HookMatcher[];
}

interface HookMatcher {
  matcher?: string; // 工具名称匹配模式
  hooks: PluginHook[];
}

interface PluginHook {
  type: 'command' | 'prompt';
  command?: string; // bash 命令（使用 ${CLAUDE_PLUGIN_ROOT}）
  prompt?: string; // LLM 提示
  timeout?: number; // 超时时间（秒）
}

interface MCPConfig {
  [serverName: string]: {
    command: string; // 服务器命令路径
    args?: string[]; // 命令参数
  };
}
```

### 4. DevelopmentConfig

```typescript
interface DevelopmentConfig {
  eslint: ESLintConfig;
  prettier: PrettierConfig;
  husky: HuskyConfig;
  pnpm: PnpmConfig;
  packageJson: PackageJsonConfig;
}

interface ESLintConfig {
  extends?: string[]; // 继承配置
  plugins?: string[]; // 插件列表
  rules?: ESLintRules; // 自定义规则
  env?: ESLintEnvironment; // 环境配置
  parser?: string; // 解析器
  parserOptions?: ParserOptions; // 解析器选项
}

interface PrettierConfig {
  semi: boolean; // 分号
  singleQuote: boolean; // 单引号
  tabWidth: number; // 缩进宽度
  useTabs: boolean; // 使用 Tab
  trailingComma: string; // 尾随逗号
  bracketSpacing: boolean; // 括号空格
  arrowParens: string; // 箭头函数参数
  endOfLine: string; // 行尾符
  printWidth: number; // 行宽限制
}

interface HuskyConfig {
  hooks: {
    // Git hooks 配置
    'pre-commit'?: string; // 提交前
    'commit-msg'?: string; // 提交信息
    'pre-push'?: string; // 推送前
    'prepare-commit-msg'?: string; // 准备提交信息
  };
  ignoreCommitMessage?: RegExp; // 忽略的提交信息
}

interface PnpmConfig {
  workspace: WorkspaceConfig; // 工作空间配置
  lockfile: LockfileConfig; // 锁文件配置
  registry: RegistryConfig; // 注册表配置
}
```

## Configuration Files Structure

### ESLint Configuration (.eslintrc.js)

```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier', // 必须放在最后
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    // 其他自定义规则
  },
  env: {
    node: true,
    es2022: true,
  },
};
```

### Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "printWidth": 80
}
```

### Husky Configuration (.husky/pre-commit)

```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

# 运行代码检查
npm run lint
npm run test
```

### pnpm Workspace Configuration (pnpm-workspace.yaml)

```yaml
packages:
  - '**' # 包含所有子目录
  - '!**/test/**' # 排除测试目录
  - '!**/docs/**' # 排除文档目录
```

## Data Validation Rules

### PluginMetadata Validation

```typescript
const validatePluginMetadata = (metadata: PluginMetadata): ValidationResult => {
  const required = ['name', 'version', 'description'];
  const missing = required.filter(field => !metadata[field]);

  if (missing.length > 0) {
    return {
      valid: false,
      errors: [`Missing required fields: ${missing.join(', ')}`],
    };
  }

  // 版本号格式验证 (semver)
  if (!metadata.version.match(/^\d+\.\d+\.\d+.*$/)) {
    return { valid: false, errors: ['Invalid version format'] };
  }

  return { valid: true };
};
```

### MarketplaceConfig Validation

```typescript
const validateMarketplaceConfig = (
  config: MarketplaceConfig
): ValidationResult => {
  const required = ['name', 'owner', 'plugins'];
  const missing = required.filter(field => !config[field]);

  if (missing.length > 0) {
    return {
      valid: false,
      errors: [`Missing required fields: ${missing.join(', ')}`],
    };
  }

  if (!Array.isArray(config.plugins) || config.plugins.length === 0) {
    return { valid: false, errors: ['plugins must be a non-empty array'] };
  }

  // 验证每个插件条目
  for (const plugin of config.plugins) {
    if (!plugin.name || !plugin.source) {
      return {
        valid: false,
        errors: [`Plugin ${plugin.name} missing required fields`],
      };
    }
  }

  return { valid: true };
};
```

## Configuration Dependencies

### Development Tools Dependencies

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0",
    "eslint-config-prettier": "^9.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^14.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Package Scripts Configuration

```json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint . --ext .js,.ts,.jsx,.tsx",
    "lint:fix": "eslint . --ext .js,.ts,.jsx,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "echo \"No tests yet\"",
    "validate": "npm run lint && npm run format:check"
  }
}
```

## Security Considerations

### Input Validation

1. **配置文件验证**: 使用 JSON Schema 验证所有配置文件
2. **依赖检查**: 验证插件依赖的安全性和完整性
3. **权限控制**: 确保配置文件访问权限正确设置

### Best Practices

1. **版本固定**: 在生产环境中使用精确的依赖版本
2. **定期更新**: 保持开发工具依赖的最新状态
3. **安全扫描**: 定期运行安全漏洞扫描工具

## Performance Requirements

### Configuration Loading

- 插件元数据加载时间: < 100ms
- 市场配置解析时间: < 200ms
- 开发工具初始化时间: < 2s

### Memory Usage

- 配置文件内存占用: < 10MB
- 开发工具运行时内存: < 100MB

## Error Handling

### Validation Errors

```typescript
interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
```
