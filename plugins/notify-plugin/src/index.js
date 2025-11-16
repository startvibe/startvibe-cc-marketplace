#!/usr/bin/env node

/**
 * Claude Code 通知插件 - 主入口文件
 * 版本: 1.0.0
 * 描述: 插件初始化和主要功能入口
 * 作者: StartVibe 团队
 * 许可证: MIT
 */

/* eslint-disable no-console */

const ConfigManager = require('./config');

class NotifyPlugin {
  constructor() {
    this.configManager = null;
    this.config = null;
    this.isInitialized = false;
  }

  /**
   * 初始化插件
   */
  async initialize() {
    try {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          script: 'index.js',
          message: '初始化 Claude Code 通知插件',
        })
      );

      // 初始化配置管理器
      this.configManager = new ConfigManager();

      // 加载配置
      this.config = this.configManager.loadConfig();

      // 检查插件是否启用
      if (!this.config.enabled) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            script: 'index.js',
            message: '插件已禁用',
          })
        );
        return false;
      }

      // 验证平台支持
      if (!(await this.validatePlatformSupport())) {
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            script: 'index.js',
            message: '平台不支持或缺少必要工具',
          })
        );
        return false;
      }

      this.isInitialized = true;

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          script: 'index.js',
          message: '插件初始化完成',
          data: {
            version: this.config.version,
            platform: process.platform,
            enabledEvents: this.getEnabledEvents(),
          },
        })
      );

      return true;
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          script: 'index.js',
          message: '插件初始化失败',
          data: {
            error: error.message,
            stack: error.stack,
          },
        })
      );
      return false;
    }
  }

  /**
   * 验证平台支持
   */
  async validatePlatformSupport() {
    try {
      const { spawn } = require('child_process');

      return new Promise((resolve, reject) => {
        const platformCheckScript = process.env.CLAUDE_PLUGIN_ROOT
          ? `${process.env.CLAUDE_PLUGIN_ROOT}/scripts/platform-check.sh`
          : `${process.cwd()}/scripts/platform-check.sh`;

        const child = spawn(platformCheckScript, ['--verbose'], {
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 10000,
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', data => {
          stdout += data.toString();
        });

        child.stderr.on('data', data => {
          stderr += data.toString();
        });

        child.on('close', code => {
          if (code === 0) {
            console.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                script: 'index.js',
                message: '平台验证成功',
                data: {
                  output: stdout.trim(),
                },
              })
            );
            resolve(true);
          } else {
            console.error(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                script: 'index.js',
                message: '平台验证失败',
                data: {
                  exitCode: code,
                  stderr: stderr.trim(),
                },
              })
            );
            resolve(false);
          }
        });

        child.on('error', error => {
          console.error(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'error',
              script: 'index.js',
              message: '平台检测脚本执行失败',
              data: {
                error: error.message,
                script: platformCheckScript,
              },
            })
          );
          reject(error);
        });
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          script: 'index.js',
          message: '平台验证过程中发生错误',
          data: {
            error: error.message,
          },
        })
      );
      return false;
    }
  }

  /**
   * 获取已启用的事件列表
   */
  getEnabledEvents() {
    if (!this.config || !this.config.events) {
      return [];
    }

    return Object.entries(this.config.events)
      .filter(([, eventConfig]) => eventConfig.enabled)
      .map(([eventName]) => eventName);
  }

  /**
   * 检查静默时间
   */
  isInQuietHours() {
    if (
      !this.config ||
      !this.config.quietHours ||
      !this.config.quietHours.enabled
    ) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;

    const quietHours = this.config.quietHours;
    const startTime = this.parseTime(quietHours.start);
    const endTime = this.parseTime(quietHours.end);

    // 检查是否是周末
    if (quietHours.weekdaysOnly) {
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
      }
    }

    // 检查是否在静默时间范围内
    if (startTime <= endTime) {
      // 不跨天的情况，如 22:00 - 08:00
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // 跨天的情况，如 22:00 - 次日 08:00
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * 解析时间字符串为分钟数
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 发送通知
   */
  async sendNotification(title, message, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('插件未初始化');
      }

      // 检查静默时间
      if (this.isInQuietHours()) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            script: 'index.js',
            message: '静默时间，跳过通知发送',
            data: {
              title: title,
              message: message,
            },
          })
        );
        return { success: true, skipped: true, reason: 'quiet_hours' };
      }

      const {
        urgency = 'normal',
        sound = true,
        eventType = 'unknown',
      } = options;

      // 检查事件是否启用
      const eventConfig = this.configManager.getConfigValue(
        this.config,
        `events.${eventType}.enabled`,
        true
      );

      if (!eventConfig) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            script: 'index.js',
            message: '事件已禁用，跳过通知发送',
            data: {
              eventType: eventType,
              title: title,
              message: message,
            },
          })
        );
        return { success: true, skipped: true, reason: 'event_disabled' };
      }

      // 调用原生通知脚本
      const result = await this.executeNotificationScript(
        title,
        message,
        urgency,
        sound
      );

      return result;
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          script: 'index.js',
          message: '发送通知失败',
          data: {
            title: title,
            message: message,
            error: error.message,
          },
        })
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * 执行通知脚本
   */
  async executeNotificationScript(title, message, urgency, sound) {
    try {
      const { spawn } = require('child_process');

      return new Promise((resolve, reject) => {
        const notifierScript = process.env.CLAUDE_PLUGIN_ROOT
          ? `${process.env.CLAUDE_PLUGIN_ROOT}/scripts/native-notifier.sh`
          : `${process.cwd()}/scripts/native-notifier.sh`;

        const child = spawn(
          notifierScript,
          [title, message, urgency, sound.toString()],
          {
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: 5000,
          }
        );

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', data => {
          stdout += data.toString();
        });

        child.stderr.on('data', data => {
          stderr += data.toString();
        });

        child.on('close', code => {
          if (code === 0) {
            console.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                script: 'index.js',
                message: '通知发送成功',
                data: {
                  title: title,
                  message: message,
                  urgency: urgency,
                },
              })
            );
            resolve({ success: true, stdout: stdout.trim() });
          } else {
            console.error(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                script: 'index.js',
                message: '通知脚本执行失败',
                data: {
                  exitCode: code,
                  stderr: stderr.trim(),
                  title: title,
                  message: message,
                },
              })
            );
            resolve({ success: false, error: stderr.trim(), exitCode: code });
          }
        });

        child.on('error', error => {
          console.error(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'error',
              script: 'index.js',
              message: '通知脚本执行异常',
              data: {
                error: error.message,
                script: notifierScript,
                title: title,
                message: message,
              },
            })
          );
          reject(error);
        });
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          script: 'index.js',
          message: '执行通知脚本时发生错误',
          data: {
            error: error.message,
            title: title,
            message: message,
          },
        })
      );
      throw error;
    }
  }

  /**
   * 获取插件状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      version: this.config?.version || 'unknown',
      enabled: this.config?.enabled || false,
      platform: process.platform,
      enabledEvents: this.getEnabledEvents(),
      quietHours: this.config?.quietHours?.enabled || false,
      logLevel: this.config?.logging?.level || 'info',
    };
  }
}

// 导出插件类
module.exports = NotifyPlugin;

// 如果直接运行此脚本
if (require.main === module) {
  const plugin = new NotifyPlugin();

  plugin
    .initialize()
    .then(success => {
      if (success) {
        console.log('✅ Claude Code 通知插件初始化成功');
        console.log('状态:', JSON.stringify(plugin.getStatus(), null, 2));

        // 测试通知
        if (process.argv.includes('--test')) {
          console.log('🧪 发送测试通知...');
          plugin
            .sendNotification('测试通知', '这是一条测试消息', {
              urgency: 'normal',
            })
            .then(result => {
              console.log('测试结果:', result);
              process.exit(result.success ? 0 : 1);
            });
        } else {
          process.exit(0);
        }
      } else {
        console.error('❌ Claude Code 通知插件初始化失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 初始化过程中发生错误:', error.message);
      process.exit(1);
    });
}
