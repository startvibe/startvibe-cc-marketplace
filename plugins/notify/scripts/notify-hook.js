#!/usr/bin/env node

/**
 * Notify Hook Script - 解析 Claude Code Hook 上下文并发送通知
 * 跨平台原生系统通知实现 (无第三方依赖)
 */

/* eslint-disable no-console, no-unused-vars */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 从 stdin 读取 hook 输入数据
function readHookInput(console, config) {
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
        if (console) {
          console.error(`💥 [INPUT] Invalid JSON input: ${error.message}`);
        }
        reject(new Error(`Invalid JSON input: ${error.message}`));
      }
    });

    // 超时处理 - 使用配置中的超时时间
    const hookInputTimeout = getHookInputTimeout(config);
    setTimeout(() => {
      if (console) {
        console.warn(
          `⏰ [INPUT] Timeout reading hook input (${hookInputTimeout}ms)`
        );
      }
      reject(new Error('Timeout reading hook input'));
    }, hookInputTimeout);
  });
}

// Windows PowerShell 通知函数 - 安全非阻塞模式 + 完整日志
function sendWindowsNotification(
  title,
  message,
  console,
  config /* options = {} */
) {
  return new Promise(resolve => {
    const startTime = Date.now();
    console.log(
      `🚀 [WINDOWS] Starting notification: title="${title}", message_length=${message.length}`
    );

    try {
      // 转义 PowerShell 字符串
      const escapedTitle = title.replace(/"/g, '""').replace(/'/g, "''");
      const escapedMessage = message.replace(/"/g, '""').replace(/'/g, "''");

      const powershellScript = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing

        $notification = New-Object System.Windows.Forms.NotifyIcon
        $notification.Icon = [System.Drawing.SystemIcons]::Information
        $notification.BalloonTipTitle = '${escapedTitle}'
        $notification.BalloonTipText = '${escapedMessage}'
        $notification.Visible = $true

        $notification.ShowBalloonTip(5000)
        Start-Sleep -Milliseconds 5500
        $notification.Dispose()
      `;

      const child = spawn('powershell', ['-Command', powershellScript], {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: getProcessCleanupTimeout(config),
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', data => {
        stdout += data.toString();
      });

      child.stderr?.on('data', data => {
        stderr += data.toString();
      });

      const pid = child.pid;
      console.log(`👶 [WINDOWS] Process started: PID=${pid}`);

      let resolved = false;

      // 统一的结果处理函数
      const handleResult = result => {
        if (!resolved) {
          resolved = true;

          // 无论成功还是失败，都输出完整的 stdout 和 stderr 日志
          if (stdout) {
            console.log(
              `📤 [WINDOWS] Process STDOUT: PID=${pid}, content:\n${stdout}`
            );
          }
          if (stderr) {
            console.log(
              `📤 [WINDOWS] Process STDERR: PID=${pid}, content:\n${stderr}`
            );
          }

          resolve(result);
        }
      };

      child.on('close', (code, signal) => {
        const duration = Date.now() - startTime;

        if (code === 0) {
          console.log(
            `✅ [WINDOWS] Process completed successfully: PID=${pid}, code=${code}, signal=${signal}, duration=${duration}ms`
          );
          handleResult({
            success: true,
            stdout: 'PowerShell notification sent',
            stderr: stderr,
            method: 'windows-system',
            pid,
          });
        } else if (
          signal === 'SIGTERM' ||
          signal === 'SIGKILL' ||
          code === null
        ) {
          // 超时或被强制终止
          console.log(
            `⏰ [WINDOWS] Process timed out or terminated: PID=${pid}, signal=${signal}, code=${code}, duration=${duration}ms`
          );
          handleResult({
            success: false,
            error: `Process timed out after ${getProcessCleanupTimeout(config)}ms`,
            stdout: stdout,
            stderr: stderr,
            method: 'windows-system',
            timedOut: true,
          });
        } else {
          // 其他错误退出
          console.log(
            `❌ [WINDOWS] Process failed: PID=${pid}, code=${code}, signal=${signal}, duration=${duration}ms`
          );
          handleResult({
            success: false,
            error: `PowerShell failed with code ${code}: ${stderr}`,
            stdout: stdout,
            stderr: stderr,
            method: 'windows-system',
          });
        }
      });

      child.on('error', error => {
        const duration = Date.now() - startTime;
        console.log(
          `❌ [WINDOWS] Process error: PID=${pid}, error=${error.message}, duration=${duration}ms`
        );
        handleResult({
          success: false,
          error: `PowerShell notification failed: ${error.message}`,
          stdout: stdout,
          stderr: stderr,
          method: 'windows-system',
        });
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(
        `💥 [WINDOWS] Failed to send notification: error=${error.message}, duration=${duration}ms`
      );
      resolve({
        success: false,
        error: error.message,
        method: 'windows-system',
      });
    }
  });
}

// macOS 系统通知函数 (使用 osascript) - 安全非阻塞模式 + 完整日志
function sendMacOSNotification(title, message, console, config, options = {}) {
  return new Promise(resolve => {
    const startTime = Date.now();
    console.log(
      `🚀 [MACOS] Starting notification: title="${title}", message_length=${message.length}`
    );

    try {
      // 转义特殊字符
      const escapedTitle = title.replace(/"/g, '\\"').replace(/'/g, "\\'");
      const escapedMessage = message.replace(/"/g, '\\"').replace(/'/g, "\\'");

      // 构建 AppleScript 命令
      let appleScript = `display notification "${escapedMessage}" with title "${escapedTitle}"`;

      // 添加声音
      if (options.sound !== false) {
        const soundName = options.sound || 'Glass';
        appleScript += ` sound name "${soundName}"`;
        console.log(`🔊 [MACOS] Added sound: ${soundName}`);
      }

      // 添加副标题（可选）
      if (options.subtitle) {
        const escapedSubtitle = options.subtitle
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");
        appleScript += ` subtitle "${escapedSubtitle}"`;
        console.log(`📝 [MACOS] Added subtitle: ${options.subtitle}`);
      }

      console.log(
        `📡 [MACOS] Spawning osascript process: script="${appleScript.substring(0, 100)}..."`
      );

      const child = spawn('osascript', ['-e', appleScript], {
        stdio: 'ignore',
      });

      const pid = child.pid;
      console.log(`👶 [MACOS] Process started: PID=${pid}`);

      // 设置清理超时
      const cleanupTimeoutMs = getProcessCleanupTimeout(config);
      const cleanupTimeout = setTimeout(() => {
        console.log(
          `⏰ [MACOS] Cleanup timeout reached (${cleanupTimeoutMs}ms), killing process PID=${pid}`
        );
        try {
          child.kill('SIGTERM');
          console.log(`🔪 [MACOS] Process PID=${pid} killed via SIGTERM`);
        } catch (error) {
          console.log(
            `❌ [MACOS] Failed to kill process PID=${pid}: ${error.message}`
          );
        }
      }, cleanupTimeoutMs);

      // 监听进程结束，清理定时器
      child.on('close', (code, signal) => {
        const duration = Date.now() - startTime;
        clearTimeout(cleanupTimeout);
        console.log(
          `✅ [MACOS] Process closed: PID=${pid}, code=${code}, signal=${signal}, duration=${duration}ms`
        );
      });

      child.on('error', error => {
        const duration = Date.now() - startTime;
        clearTimeout(cleanupTimeout);
        console.log(
          `❌ [MACOS] Process error: PID=${pid}, error=${error.message}, duration=${duration}ms`
        );
      });

      const duration = Date.now() - startTime;
      console.log(
        `✨ [MACOS] Notification sent successfully: PID=${pid}, init_duration=${duration}ms`
      );

      resolve({
        success: true,
        stdout: 'macOS notification sent (safe mode)',
        method: 'macos-system',
        pid,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(
        `💥 [MACOS] Failed to send notification: error=${error.message}, duration=${duration}ms`
      );
      resolve({ success: false, error: error.message, method: 'macos-system' });
    }
  });
}

// Linux 系统通知函数 - 安全非阻塞模式 + 完整日志
function sendLinuxNotification(
  title,
  message,
  console,
  config /* options = {} */
) {
  return new Promise(resolve => {
    const startTime = Date.now();
    console.log(
      `🚀 [LINUX] Starting notification: title="${title}", message_length=${message.length}`
    );

    try {
      // 转义字符
      const escapedTitle = title.replace(/"/g, '\\"').replace(/'/g, "\\'");
      const escapedMessage = message.replace(/"/g, '\\"').replace(/'/g, "\\'");

      const command = [
        escapedTitle,
        escapedMessage,
        '--urgency=low',
        '--expire-time=3000',
        '--hint=int:transient:1',
        '--app-name=Claude-Code',
      ];

      console.log(
        `📡 [LINUX] Spawning notify-send process: command=${JSON.stringify(command)}`
      );

      const child = spawn('notify-send', command, {
        stdio: 'ignore',
      });

      const pid = child.pid;
      console.log(`👶 [LINUX] Process started: PID=${pid}`);

      // 设置清理超时
      const cleanupTimeoutMs = getProcessCleanupTimeout(config);
      const cleanupTimeout = setTimeout(() => {
        console.log(
          `⏰ [LINUX] Cleanup timeout reached (${cleanupTimeoutMs}ms), killing process PID=${pid}`
        );
        try {
          child.kill('SIGTERM');
          console.log(`🔪 [LINUX] Process PID=${pid} killed via SIGTERM`);
        } catch (error) {
          console.log(
            `❌ [LINUX] Failed to kill process PID=${pid}: ${error.message}`
          );
        }
      }, cleanupTimeoutMs);

      // 监听进程结束，清理定时器
      child.on('close', (code, signal) => {
        const duration = Date.now() - startTime;
        clearTimeout(cleanupTimeout);
        console.log(
          `✅ [LINUX] Process closed: PID=${pid}, code=${code}, signal=${signal}, duration=${duration}ms`
        );
      });

      child.on('error', error => {
        const duration = Date.now() - startTime;
        clearTimeout(cleanupTimeout);
        console.log(
          `❌ [LINUX] Process error: PID=${pid}, error=${error.message}, duration=${duration}ms`
        );
      });

      const duration = Date.now() - startTime;
      console.log(
        `✨ [LINUX] Notification sent successfully: PID=${pid}, init_duration=${duration}ms`
      );

      resolve({
        success: true,
        stdout: 'Linux notification sent (safe mode)',
        method: 'linux-system',
        pid,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(
        `💥 [LINUX] Failed to send notification: error=${error.message}, duration=${duration}ms`
      );
      resolve({ success: false, error: error.message, method: 'linux-system' });
    }
  });
}

// 跨平台通知发送函数 - 完整日志
function sendNotification(title, message, console, config) {
  return new Promise(resolve => {
    const startTime = Date.now();
    console.log(
      `🎯 [MAIN] Starting cross-platform notification: title="${title}", message_length=${message.length}`
    );

    const notificationConfig = config.notification || {};
    console.log(
      `🔧 [MAIN] Notification config: ${JSON.stringify(notificationConfig)}`
    );

    let selectedPlatform = '';
    let selectedMethod = '';

    // 根据平台选择系统通知方式
    if (
      process.platform === 'win32' &&
      notificationConfig.preferNativeWindows !== false
    ) {
      // Windows: 使用 PowerShell 系统通知
      selectedPlatform = 'Windows';
      selectedMethod = 'PowerShell';
      console.log(
        `🖥️  [MAIN] Selected platform: ${selectedPlatform} - ${selectedMethod} (preferred)`
      );
      sendWindowsNotification(title, message, console, config).then(resolve);
    } else if (
      process.platform === 'darwin' &&
      notificationConfig.preferNativeMacOS !== false
    ) {
      // macOS: 使用 osascript 系统通知
      selectedPlatform = 'macOS';
      selectedMethod = 'osascript';
      console.log(
        `🍎 [MAIN] Selected platform: ${selectedPlatform} - ${selectedMethod} (preferred)`
      );
      sendMacOSNotification(title, message, console, config).then(resolve);
    } else if (process.platform === 'linux') {
      // Linux: 使用 notify-send/zenity 系统通知
      selectedPlatform = 'Linux';
      selectedMethod = 'notify-send';
      console.log(
        `🐧 [MAIN] Selected platform: ${selectedPlatform} - ${selectedMethod}`
      );
      sendLinuxNotification(title, message, console, config).then(resolve);
    } else {
      // 默认: 根据平台选择最佳方案
      if (process.platform === 'darwin') {
        selectedPlatform = 'macOS';
        selectedMethod = 'osascript';
      } else if (process.platform === 'win32') {
        selectedPlatform = 'Windows';
        selectedMethod = 'PowerShell';
      } else {
        selectedPlatform = process.platform;
        selectedMethod = 'default';
      }
      console.log(
        `🔄 [MAIN] Selected fallback platform: ${selectedPlatform} - ${selectedMethod}`
      );

      if (process.platform === 'darwin') {
        sendMacOSNotification(title, message, console, config).then(resolve);
      } else if (process.platform === 'win32') {
        sendWindowsNotification(title, message, console, config).then(resolve);
      } else {
        sendLinuxNotification(title, message, console, config).then(resolve);
      }
    }

    // 监听结果并记录最终状态
    const originalResolve = resolve;
    resolve = result => {
      const duration = Date.now() - startTime;
      if (result.success) {
        console.log(
          `✅ [MAIN] Notification completed successfully: platform=${selectedPlatform}, method=${selectedMethod}, duration=${duration}ms, result=${result.stdout}`
        );
      } else {
        console.log(
          `❌ [MAIN] Notification failed: platform=${selectedPlatform}, method=${selectedMethod}, duration=${duration}ms, error=${result.error}`
        );
      }
      originalResolve(result);
    };
  });
}

// 加载配置文件
function loadConfig(console) {
  try {
    const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || __dirname;
    const configPath = path.join(pluginRoot, 'config', 'notify-config.json');

    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    } else {
      // 配置文件不存在，使用默认配置
      return getDefaultConfig();
    }
  } catch (error) {
    if (console) {
      console.log(
        `⚠️ [CONFIG] Failed to load config file, using defaults: ${error.message}`
      );
    }
    // 加载失败，使用默认配置
    return getDefaultConfig();
  }
}

// 获取默认配置
function getDefaultConfig() {
  return {
    events: {
      Stop: {
        enabled: true,
        title: 'Claude 响应完成',
        messageTemplate: '{{projectName}} - Claude 已完成您的请求处理',
        sound: true,
        includeProjectInfo: true,
      },
      Notification: {
        enabled: true,
        title: 'Claude 需要注意',
        messageTemplate: '{{projectName}} - {{message}}',
        fallbackMessage: '{{projectName}} - Claude 需要您的确认或输入',
        sound: true,
        includeProjectInfo: true,
      },
    },
    display: {
      includeSessionInfo: false,
      includePermissionMode: false,
      maxMessageLength: 200,
    },
    notification: {
      preferNativeMacOS: true,
      preferNativeWindows: true,
      timeout: {
        processCleanup: 6000,
        hookInput: 5000,
      },
    },
  };
}

// 获取进程清理超时时间
function getProcessCleanupTimeout(config) {
  return config.notification?.timeout?.processCleanup || 6000;
}

// 获取Hook输入超时时间
function getHookInputTimeout(config) {
  return config.notification?.timeout?.hookInput || 5000;
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

// 创建文件 console 实例
function createFileConsole() {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  // 使用系统默认的临时目录
  const logDir = os.tmpdir();
  const logPath = path.join(logDir, 'notify-hook.log');

  // 创建日志目录（如果不存在）
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (error) {
    // 静默处理目录创建失败，输出到原始 console
    // eslint-disable-next-line no-console
    console.warn(`Failed to create log directory: ${error.message}`);
  }

  // 创建文件输出流
  const fileOutput = fs.createWriteStream(logPath, { flags: 'a' });

  // 创建专用的 console 实例用于文件输出
  const fileConsole = new console.Console({
    stdout: fileOutput,
    stderr: fileOutput,
    colorMode: false,
  });

  // 添加带时间戳的便捷方法
  fileConsole.logWithTime = function (...args) {
    const timestamp = new Date().toISOString();
    this.log(`[${timestamp}]`, ...args);
  };

  fileConsole.errorWithTime = function (...args) {
    const timestamp = new Date().toISOString();
    this.error(`[${timestamp}]`, ...args);
    // 同时输出到原始 stderr，用于重要错误
    // eslint-disable-next-line no-console
    console.error(`[${timestamp}]`, ...args);
  };

  fileConsole.warnWithTime = function (...args) {
    const timestamp = new Date().toISOString();
    this.warn(`[${timestamp}]`, ...args);
  };

  return fileConsole;
}

async function main() {
  // 创建文件 console 实例
  const console = createFileConsole();

  global.startTime = Date.now();
  console.logWithTime('=== NOTIFY HOOK STARTED ===');
  console.logWithTime('Environment:', {
    CLAUDE_PLUGIN_ROOT: process.env.CLAUDE_PLUGIN_ROOT,
    NODE_ENV: process.env.NODE_ENV,
    PWD: process.env.PWD,
    PLATFORM: process.platform,
    ARCH: process.arch,
  });

  try {
    // 在main方法中一次性加载配置
    const config = loadConfig(console);
    console.logWithTime('=== CONFIG LOADED ===');

    const hookData = await readHookInput(console, config);
    console.logWithTime('=== HOOK INPUT RECEIVED ===');
    console.log(JSON.stringify(hookData, null, 2));

    const { hook_event_name, cwd, session_id, message, permission_mode } =
      hookData;
    console.logWithTime('=== EXTRACTED VARIABLES ===');
    console.log(
      JSON.stringify(
        {
          hook_event_name,
          cwd,
          session_id: session_id
            ? session_id.substring(0, 8) + '...'
            : 'undefined',
          message: message ? message.substring(0, 50) + '...' : 'undefined',
          permission_mode,
        },
        null,
        2
      )
    );

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
      eventName: hook_event_name,
    };

    // 使用配置生成标题和消息
    let title = eventConfig.title;
    let messageText = replaceTemplate(
      eventConfig.messageTemplate,
      templateVars
    );

    // 如果是 Notification 事件且没有消息，使用备用消息
    if (
      hook_event_name === 'Notification' &&
      !message &&
      eventConfig.fallbackMessage
    ) {
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
    if (
      config.display.maxMessageLength &&
      fullMessage.length > config.display.maxMessageLength
    ) {
      fullMessage =
        fullMessage.substring(0, config.display.maxMessageLength - 3) + '...';
    }

    // 发送通知 (传递配置对象)
    const result = await sendNotification(title, fullMessage, console, config);

    const totalDuration = Date.now() - global.startTime;
    if (result.success) {
      console.log(
        `🎉 [MAIN] Hook execution completed successfully: title="${title}", total_duration=${totalDuration}ms`
      );
      console.log(`✅ 通知发送成功: ${title}`);
      process.exit(0);
    } else {
      console.log(
        `💔 [MAIN] Hook execution failed: title="${title}", total_duration=${totalDuration}ms, error="${result.error}"`
      );
      console.log(`❌ 通知发送失败: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Hook 脚本执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}
