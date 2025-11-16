#!/usr/bin/env node

/**
 * Claude Code 通知插件 - 配置管理模块
 * 版本: 1.0.0
 * 描述: 处理配置文件的加载、验证和管理
 * 作者: StartVibe 团队
 * 许可证: MIT
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.pluginRoot =
      process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
    this.configDir = path.join(this.pluginRoot, 'config');
    this.userConfigDir = path.join(
      process.env.HOME || process.env.USERPROFILE,
      '.claude-code',
      'notify-plugin'
    );
    this.logDir = path.join(
      process.env.HOME || process.env.USERPROFILE,
      '.claude-code',
      'notify-plugin',
      'logs'
    );

    // 配置文件加载优先级
    this.configPaths = [
      path.join(this.configDir, 'user-config.json'),
      path.join(this.userConfigDir, 'config.json'),
      path.join(this.configDir, 'default-config.json'),
    ];
  }

  /**
   * 加载配置文件
   * @returns {Object} 配置对象
   */
  loadConfig() {
    let config = null;
    let configPath = null;

    // 按优先级尝试加载配置文件
    for (const configFilePath of this.configPaths) {
      try {
        if (
          fs.existsSync(configFilePath) &&
          fs.statSync(configFilePath).isFile()
        ) {
          const content = fs.readFileSync(configFilePath, 'utf8');
          const parsedConfig = JSON.parse(content);

          if (this.validateConfig(parsedConfig)) {
            config = parsedConfig;
            configPath = configFilePath;
            break;
          } else {
            // eslint-disable-next-line no-console
            console.warn(`配置文件格式无效: ${configFilePath}`);
          }
        }
      } catch (error) {
        console.warn(
          `加载配置文件失败: ${configFilePath}, 错误: ${error.message}`
        );
      }
    }

    // 如果没有找到有效配置，使用空配置
    if (!config) {
      config = this.getDefaultConfig();
      console.warn('未找到有效配置文件，使用默认配置');
    }

    // 确保日志目录存在
    this.ensureLogDirectory();

    // 记录配置加载信息
    this.logInfo('config_loaded', {
      configPath: configPath,
      configVersion: config.version,
    });

    return config;
  }

  /**
   * 获取默认配置
   * @returns {Object} 默认配置对象
   */
  getDefaultConfig() {
    return {
      version: '1.0.0',
      lastModified: Date.now(),
      enabled: true,
      defaultSound: true,
      events: {
        stop: {
          enabled: true,
          sound: true,
          urgency: 'normal',
          customTemplate: {
            title: 'Claude 响应完成',
            message: 'Claude 已完成您的请求处理',
          },
        },
        notification: {
          enabled: true,
          sound: true,
          urgency: 'critical',
          customTemplate: {
            title: 'Claude 需要您的注意',
            message: 'Claude 需要您的确认或输入',
          },
        },
      },
      display: {
        title: 'Claude Code',
        message: '{{title}}: {{message}}',
        duration: 8,
        icon: '',
      },
      platformSettings: {
        macos: {
          subtitle: 'Claude Assistant',
          sound: 'Glass',
          contentImage: '',
          open: '',
          actions: [],
          reply: false,
          closeLabel: '关闭',
        },
        windows: {
          appID: 'ClaudeCode.Notify',
          toastStyle: 'modern',
          icon: '',
          id: 0,
          remove: 0,
          install: 'start-menu',
        },
        linux: {
          urgency: 'normal',
          category: 'im.received',
          app_name: 'Claude Code',
          timeout: 8,
          hint: '',
        },
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        weekdaysOnly: false,
      },
      performance: {
        maxNotificationRetries: 3,
        notificationTimeout: 5000,
        hookTimeout: 5000,
      },
      logging: {
        enabled: true,
        level: 'info',
        maxLogSize: 10485760,
        maxLogFiles: 5,
      },
    };
  }

  /**
   * 验证配置对象
   * @param {Object} config 配置对象
   * @returns {boolean} 是否有效
   */
  validateConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // 检查必需字段
    if (!config.version || typeof config.version !== 'string') {
      return false;
    }

    // 验证版本格式
    if (!/^\d+\.\d+\.\d+$/.test(config.version)) {
      return false;
    }

    // 检查 enabled 字段
    if (typeof config.enabled !== 'boolean') {
      return false;
    }

    // 检查 events 配置
    if (!config.events || typeof config.events !== 'object') {
      return false;
    }

    const requiredEvents = ['stop', 'notification'];
    for (const event of requiredEvents) {
      if (!config.events[event] || typeof config.events[event] !== 'object') {
        return false;
      }

      const eventConfig = config.events[event];
      if (
        typeof eventConfig.enabled !== 'boolean' ||
        typeof eventConfig.sound !== 'boolean' ||
        !['low', 'normal', 'critical'].includes(eventConfig.urgency)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * 保存配置文件
   * @param {Object} config 配置对象
   * @param {string} filePath 保存路径（可选）
   * @returns {boolean} 是否保存成功
   */
  saveConfig(config, filePath = null) {
    try {
      const targetPath =
        filePath || path.join(this.userConfigDir, 'config.json');

      // 验证配置
      if (!this.validateConfig(config)) {
        throw new Error('配置验证失败');
      }

      // 更新修改时间
      config.lastModified = Date.now();

      // 确保目录存在
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 备份现有配置
      if (fs.existsSync(targetPath)) {
        const backupPath = `${targetPath}.backup.${Date.now()}`;
        fs.copyFileSync(targetPath, backupPath);
      }

      // 保存新配置
      const content = JSON.stringify(config, null, 2);
      fs.writeFileSync(targetPath, content, 'utf8');

      this.logInfo('config_saved', {
        filePath: targetPath,
        configVersion: config.version,
      });

      return true;
    } catch (error) {
      this.logError('config_save_failed', {
        error: error.message,
        filePath: filePath,
      });
      return false;
    }
  }

  /**
   * 获取配置值
   * @param {Object} config 配置对象
   * @param {string} key 配置键路径（例如 "events.stop.enabled"）
   * @param {*} defaultValue 默认值
   * @returns {*} 配置值
   */
  getConfigValue(config, key, defaultValue = null) {
    try {
      const keys = key.split('.');
      let value = config;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return defaultValue;
        }
      }

      return value;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * 设置配置值
   * @param {Object} config 配置对象
   * @param {string} key 配置键路径
   * @param {*} value 配置值
   * @returns {Object} 更新后的配置对象
   */
  setConfigValue(config, key, value) {
    try {
      const keys = key.split('.');
      let current = config;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== 'object') {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]] = value;
      return config;
    } catch (error) {
      this.logError('config_set_failed', {
        error: error.message,
        key: key,
        value: value,
      });
      return config;
    }
  }

  /**
   * 处理模板变量
   * @param {string} template 模板字符串
   * @param {Object} variables 变量对象
   * @returns {string} 处理后的字符串
   */
  processTemplate(template, variables = {}) {
    if (!template || typeof template !== 'string') {
      return '';
    }

    let result = template;

    // 处理常用变量
    const commonVars = {
      sessionId: process.env.HOOK_EVENT_DATA
        ? JSON.parse(process.env.HOOK_EVENT_DATA || '{}').sessionId
        : '',
      hookEventName: process.env.HOOK_EVENT_NAME || '',
      timestamp: process.env.HOOK_EVENT_TIMESTAMP || '',
      cwd: process.env.cwd || '',
      permissionMode: process.env.permissionMode || '',
    };

    // 合并变量
    const allVars = { ...commonVars, ...variables };

    // 替换模板变量
    for (const [key, value] of Object.entries(allVars)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value || ''
      );
    }

    // 转义 HTML 特殊字符
    result = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return result;
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.warn(`创建日志目录失败: ${error.message}`);
    }
  }

  /**
   * 记录信息日志
   * @param {string} message 日志消息
   * @param {Object} data 附加数据
   */
  logInfo(message, data = {}) {
    this.log('info', message, data);
  }

  /**
   * 记录错误日志
   * @param {string} message 日志消息
   * @param {Object} data 附加数据
   */
  logError(message, data = {}) {
    this.log('error', message, data);
  }

  /**
   * 记录日志
   * @param {string} level 日志级别
   * @param {string} message 日志消息
   * @param {Object} data 附加数据
   */
  log(level, message, data = {}) {
    try {
      // 避免递归，直接检查日志状态而不调用 loadConfig
      const loggingEnabled = true; // 简化：默认启用日志记录

      if (!loggingEnabled) {
        return;
      }

      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level,
        script: 'config.js',
        message: message,
        ...data,
      };

      // 控制台输出
      if (level === 'error') {
        console.error(JSON.stringify(logEntry));
      } else {
        console.log(JSON.stringify(logEntry));
      }

      // 简化：跳过文件写入以避免递归问题
      // 在实际使用中可以通过简单的标志位避免递归
    } catch (error) {
      console.error(`日志记录失败: ${error.message}`);
    }
  }

  /**
   * 日志文件轮转
   * @param {string} logFile 日志文件路径
   */
  rotateLogFile(logFile) {
    try {
      if (!fs.existsSync(logFile)) {
        return;
      }

      const stats = fs.statSync(logFile);
      const config = this.loadConfig();
      const maxSize = config.logging?.maxLogSize || 10 * 1024 * 1024; // 默认 10MB

      if (stats.size > maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = logFile.replace('.log', `.${timestamp}.log`);
        fs.renameSync(logFile, rotatedFile);

        // 清理旧日志文件
        this.cleanOldLogFiles();
      }
    } catch (error) {
      console.warn(`日志文件轮转失败: ${error.message}`);
    }
  }

  /**
   * 清理旧日志文件
   */
  cleanOldLogFiles() {
    try {
      const config = this.loadConfig();
      const maxFiles = config.logging?.maxLogFiles || 5;

      const files = fs
        .readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          time: fs.statSync(path.join(this.logDir, file)).mtime,
        }))
        .sort((a, b) => b.time - a.time);

      // 保留最新的 maxFiles 个文件，删除其余的
      if (files.length > maxFiles) {
        for (let i = maxFiles; i < files.length; i++) {
          fs.unlinkSync(files[i].path);
        }
      }
    } catch (error) {
      console.warn(`清理旧日志文件失败: ${error.message}`);
    }
  }
}

// 导出模块
module.exports = ConfigManager;

// 如果直接运行此脚本，显示版本信息
if (require.main === module) {
  console.log('Claude Code 通知插件配置管理模块 v1.0.0');
  console.log('此模块应被其他脚本引用，而非直接运行');
}
