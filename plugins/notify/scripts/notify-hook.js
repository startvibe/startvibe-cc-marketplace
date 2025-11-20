#!/usr/bin/env node

/**
 * Notify Hook Script - 解析 Claude Code Hook 上下文并发送通知
 * 基于 @startvibe/node-notifier-cli
 */

const { spawn } = require('child_process');
const fs = require('fs');

// 从 stdin 读取 hook 输入数据
function readHookInput() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.on('data', chunk => {
      input += chunk.toString();
    });

    process.stdin.on('end', () => {
      try {
        const data = JSON.parse(input);
        resolve(data);
      } catch (error) {
        reject(new Error(`Invalid JSON input: ${error.message}`));
      }
    });

    // 超时处理
    setTimeout(() => {
      reject(new Error('Timeout reading hook input'));
    }, 5000);
  });
}

// 发送通知
function sendNotification(title, message, options = {}) {
  return new Promise((resolve) => {
    const args = ['@startvibe/node-notifier-cli', 'notify', '-t', title, '-m', message];

    if (options.sound) {
      args.push('-s');
    }

    if (options.icon) {
      args.push('-i', options.icon);
    }

    if (options.open) {
      args.push('-o', options.open);
    }

    const child = spawn('npx', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout: stdout.trim() });
      } else {
        resolve({ success: false, error: stderr.trim() });
      }
    });

    child.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

// 加载配置文件
function loadConfig() {
  try {
    const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || __dirname;
    const configPath = path.join(pluginRoot, 'config', 'notify-config.json');

    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    }
  } catch (error) {
    console.warn('Failed to load config file, using defaults:', error.message);
  }

  // 默认配置
  return {
    events: {
      Stop: {
        enabled: true,
        title: 'Claude 响应完成',
        messageTemplate: '{{projectName}} - Claude 已完成您的请求处理',
        sound: true,
        includeProjectInfo: true
      },
      Notification: {
        enabled: true,
        title: 'Claude 需要注意',
        messageTemplate: '{{projectName}} - {{message}}',
        fallbackMessage: '{{projectName}} - Claude 需要您的确认或输入',
        sound: true,
        includeProjectInfo: true
      }
    },
    display: {
      includeSessionInfo: false,
      includePermissionMode: false,
      maxMessageLength: 200
    },
    context: {
      projectNameExtraction: 'folder-name',
      showCurrentDirectory: false
    }
  };
}

// 获取项目名称（从路径中提取）
function getProjectName(cwd) {
  if (!cwd) return 'Unknown';
  return cwd.split(/[\\/]/).pop() || cwd;
}

// 获取简化的当前目录
function getCurrentDir(cwd) {
  if (!cwd) return '';
  const parts = cwd.split(/[\\/]/);
  return parts.slice(-2).join('/');
}

// 替换消息模板中的变量
function replaceTemplate(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

// 主函数
async function main() {
  try {
    const hookData = await readHookInput();
    const config = loadConfig();
    const { hook_event_name, cwd, session_id, message, permission_mode } = hookData;

    // 获取事件配置
    const eventConfig = config.events[hook_event_name];
    if (!eventConfig || !eventConfig.enabled) {
      console.log(`Event ${hook_event_name} is disabled or not configured`);
      process.exit(0);
    }

    // 提取有用的上下文信息
    const projectName = getProjectName(cwd);
    const currentDir = getCurrentDir(cwd);
    const sessionIdShort = session_id ? session_id.slice(0, 8) : 'unknown';

    // 构建模板变量
    const templateVars = {
      projectName,
      currentDir,
      sessionId: sessionIdShort,
      message: message || '',
      permissionMode: permission_mode || 'unknown',
      eventName: hook_event_name
    };

    // 使用配置生成标题和消息
    let title = eventConfig.title;
    let messageText = replaceTemplate(eventConfig.messageTemplate, templateVars);

    // 如果是 Notification 事件且没有消息，使用备用消息
    if (hook_event_name === 'Notification' && !message && eventConfig.fallbackMessage) {
      messageText = replaceTemplate(eventConfig.fallbackMessage, templateVars);
    }

    // 其他事件类型的默认处理
    if (!eventConfig) {
      title = `Claude ${hook_event_name}`;
      messageText = `${projectName} - ${hook_event_name} 事件触发`;
    }

    // 添加额外上下文信息
    let fullMessage = messageText;
    if (eventConfig.includeProjectInfo) {
      fullMessage += `\n项目: ${projectName}`;
    }

    // 根据配置添加额外信息
    if (config.display.includeSessionInfo) {
      fullMessage += `\n会话: ${sessionIdShort}`;
    }

    if (config.display.includePermissionMode) {
      fullMessage += `\n权限模式: ${permission_mode || 'unknown'}`;
    }

    // 限制消息长度
    if (config.display.maxMessageLength && fullMessage.length > config.display.maxMessageLength) {
      fullMessage = fullMessage.substring(0, config.display.maxMessageLength - 3) + '...';
    }

    // 发送通知
    const result = await sendNotification(title, fullMessage, {
      sound: eventConfig.sound !== false,
      timeout: 15
    });

    if (result.success) {
      console.log(`✅ 通知发送成功: ${title}`);
      process.exit(0);
    } else {
      console.error(`❌ 通知发送失败: ${result.error}`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`❌ Hook 脚本执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}