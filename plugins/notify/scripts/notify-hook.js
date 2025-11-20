#!/usr/bin/env node

/**
 * Notify Hook Script - 解析 Claude Code Hook 上下文并发送通知
 * 基于 @startvibe/node-notifier-cli
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    // 加载配置以确定通知方式
    const config = loadConfig();
    const notificationConfig = config.notification || {};

    // 在 Windows 上尝试使用 PowerShell 作为备选方案
    if (process.platform === 'win32' && notificationConfig.preferNativeWindows !== false) {
      const powershellScript = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing

        $notification = New-Object System.Windows.Forms.NotifyIcon
        $notification.Icon = [System.Drawing.SystemIcons]::Information
        $notification.BalloonTipTitle = '${title.replace(/'/g, "''")}'
        $notification.BalloonTipText = '${message.replace(/'/g, "''")}'
        $notification.Visible = $true

        $notification.ShowBalloonTip(5000)
        Start-Sleep -Milliseconds 5500
        $notification.Dispose()
      `;

      const child = spawn('powershell', ['-Command', powershellScript], {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000
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
          resolve({ success: true, stdout: 'PowerShell notification sent' });
        } else {
          // 如果 PowerShell 失败且允许回退，尝试 node-notifier-cli
          if (notificationConfig.fallbackToNodeNotifier !== false) {
            sendNodeNotifierNotification(title, message, options).then(resolve);
          } else {
            resolve({ success: false, error: `PowerShell failed with code ${code}: ${stderr}` });
          }
        }
      });

      child.on('error', () => {
        // 如果 PowerShell 失败且允许回退，尝试 node-notifier-cli
        if (notificationConfig.fallbackToNodeNotifier !== false) {
          sendNodeNotifierNotification(title, message, options).then(resolve);
        } else {
          resolve({ success: false, error: 'PowerShell notification failed' });
        }
      });

    } else {
      // 非 Windows 系统或配置禁用 PowerShell，直接使用 node-notifier-cli
      sendNodeNotifierNotification(title, message, options).then(resolve);
    }
  });
}

// 使用 node-notifier-cli 发送通知的原始函数
function sendNodeNotifierNotification(title, message, options = {}) {
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

    // 使用更稳健的方式执行 npx
    let finalArgs = args;
    let command = 'npx';

    // 如果是 Windows，使用 shell 来执行命令
    if (process.platform === 'win32') {
      // 在 Windows 上使用 cmd 来执行 npx
      command = 'cmd';
      finalArgs = ['/c', 'npx'].concat(args);
    }

    const child = spawn(command, finalArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000, // 增加超时时间以适应 npx 下载
      shell: false
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
      const output = stdout.trim();
      const errors = stderr.trim();

      // 检查是否成功，即使有警告信息
      const isSuccess = code === 0 || output.includes('✅') || output.includes('sent');

      if (isSuccess) {
        resolve({ success: true, stdout: output });
      } else {
        // 如果有 npm 警告但没有实际错误，仍然认为是成功
        const hasWarningsOnly = errors.includes('npm warn') && !errors.includes('ERR!');
        if (hasWarningsOnly && output) {
          resolve({ success: true, stdout: output });
        } else {
          resolve({ success: false, error: errors });
        }
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
    },
    notification: {
      preferNativeWindows: true,
      fallbackToNodeNotifier: true
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
// 写日志到文件
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  try {
    const fs = require('fs');
    const path = require('path');
    // Windows 使用 C:\temp，Unix 使用 /tmp
    const logDir = process.platform === 'win32' ? 'C:\\temp' : '/tmp';
    const logPath = path.join(logDir, 'notify-hook.log');
    fs.appendFileSync(logPath, logEntry);
  } catch (error) {
    // 如果写文件失败，输出到 stderr
    console.error(`Failed to write log: ${error.message}`);
    console.error(logEntry);
  }
}

async function main() {
  writeLog('=== NOTIFY HOOK STARTED ===');
  writeLog(`Environment: ${JSON.stringify({
      CLAUDE_PLUGIN_ROOT: process.env.CLAUDE_PLUGIN_ROOT,
      NODE_ENV: process.env.NODE_ENV,
      PWD: process.env.PWD
    }, null, 2)}`);

  try {
    const hookData = await readHookInput();
    writeLog(`=== HOOK INPUT RECEIVED ===`);
    writeLog(JSON.stringify(hookData, null, 2));

    const config = loadConfig();

    const { hook_event_name, cwd, session_id, message, permission_mode } = hookData;
    writeLog(`=== EXTRACTED VARIABLES ===`);
    writeLog(JSON.stringify({
      hook_event_name,
      cwd,
      session_id: session_id ? session_id.substring(0, 8) + '...' : 'undefined',
      message: message ? message.substring(0, 50) + '...' : 'undefined',
      permission_mode
    }, null, 2));

    // 获取事件配置
    const eventConfig = config.events[hook_event_name];
    if (!eventConfig || !eventConfig.enabled) {
      writeLog(`Event ${hook_event_name} is disabled or not configured`);
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
      writeLog(`✅ 通知发送成功: ${title}`);
      process.exit(0);
    } else {
      writeLog(`❌ 通知发送失败: ${result.error}`);
      process.exit(1);
    }

  } catch (error) {
    writeLog(`❌ Hook 脚本执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}