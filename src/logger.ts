import util from 'node:util'

import chalk from 'chalk'

/**
 * Log levels to indicate importance of the logged message.
 * Every level corresponds to a certain color.
 *
 * - INFO: no color
 * - SUCCESS: green
 * - WARN: yellow
 * - ERROR: red
 * - DEBUG: gray
 *
 * Messages with DEBUG level are only displayed if explicitly enabled.
 */
// eslint-disable-next-line no-restricted-syntax
export const enum LogLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

/**
 * Represents a logging device which can be used directly as a function (for INFO logging)
 * but also has dedicated logging functions for respective logging levels.
 */
export interface Logging {
  prefix: string
  (message: string, ...parameters: any[]): void
  info: (message: string, ...parameters: any[]) => void
  success: (message: string, ...parameters: any[]) => void
  warn: (message: string, ...parameters: any[]) => void
  error: (message: string, ...parameters: any[]) => void
  debug: (message: string, ...parameters: any[]) => void
  log: (level: LogLevel, message: string, ...parameters: any[]) => void
}

interface IntermediateLogging { // some auxiliary interface used to correctly type stuff happening in "withPrefix"
  prefix?: string
  (message: string, ...parameters: any[]): void
  info?: (message: string, ...parameters: any[]) => void
  success?: (message: string, ...parameters: any[]) => void
  warn?: (message: string, ...parameters: any[]) => void
  error?: (message: string, ...parameters: any[]) => void
  debug?: (message: string, ...parameters: any[]) => void
  log?: (level: LogLevel, message: string, ...parameters: any[]) => void
}

/**
 * Logger class
 */
export class Logger {
  public static readonly internal = new Logger()
  private static readonly loggerCache = new Map<string, Logging>() // global cache of logger instances by plugin name
  private static debugEnabled = false
  private static timestampEnabled = true

  readonly prefix?: string

  constructor(prefix?: string) {
    this.prefix = prefix
  }

  /**
   * Creates a new Logging device with a specified prefix.
   *
   * @param prefix {string} - the prefix of the logger
   */
  static withPrefix(prefix: string): Logging {
    const loggerStuff = Logger.loggerCache.get(prefix)

    if (loggerStuff) {
      return loggerStuff
    } else {
      const logger = new Logger(prefix)

      const log: IntermediateLogging = logger.info.bind(logger)
      log.info = logger.info
      log.success = logger.success
      log.warn = logger.warn
      log.error = logger.error
      log.debug = logger.debug
      log.log = logger.log

      log.prefix = logger.prefix

      // @ts-expect-error: I aimed to not use ts-ignore in this project, but this evil "thing" above is hell
      const logging: Logging = log
      Logger.loggerCache.set(prefix, logging)
      return logging
    }
  }

  /**
   * Turns on debug level logging. Off by default.
   *
   * @param enabled {boolean}
   */
  public static setDebugEnabled(enabled: boolean = true): void {
    Logger.debugEnabled = enabled
  }

  /**
   * Turns on inclusion of timestamps in log messages. On by default.
   *
   * @param enabled {boolean}
   */
  public static setTimestampEnabled(enabled: boolean = true): void {
    Logger.timestampEnabled = enabled
  }

  /**
   * Forces color in logging output, even if it seems like color is unsupported.
   */
  public static forceColor(): void {
    chalk.level = 1 // `1` - Basic 16 colors support.
  }

  public info(message: string, ...parameters: any[]): void {
    this.log(LogLevel.INFO, message, ...parameters)
  }

  public success(message: string, ...parameters: any[]): void {
    this.log(LogLevel.SUCCESS, message, ...parameters)
  }

  public warn(message: string, ...parameters: any[]): void {
    this.log(LogLevel.WARN, message, ...parameters)
  }

  public error(message: string, ...parameters: any[]): void {
    this.log(LogLevel.ERROR, message, ...parameters)
  }

  public debug(message: string, ...parameters: any[]): void {
    this.log(LogLevel.DEBUG, message, ...parameters)
  }

  public log(level: LogLevel, message: string, ...parameters: any[]): void {
    if (level === LogLevel.DEBUG && !Logger.debugEnabled) {
      return
    }

    message = util.format(message, ...parameters)

    let loggingFunction = console.log // eslint-disable-line no-console
    switch (level) {
      case LogLevel.SUCCESS:
        message = chalk.green(message)
        break
      case LogLevel.WARN:
        message = chalk.yellow(message)
        loggingFunction = console.error
        break
      case LogLevel.ERROR:
        message = chalk.red(message)
        loggingFunction = console.error
        break
      case LogLevel.DEBUG:
        message = chalk.gray(message)
        break
    }

    if (this.prefix) {
      message = `${getLogPrefix(this.prefix)} ${message}`
    }

    if (Logger.timestampEnabled) {
      const date = new Date()
      message = chalk.white(`[${date.toLocaleString()}] `) + message
    }

    loggingFunction(message)
  }
}

/**
 * Gets the prefix
 * @param prefix
 */
export function getLogPrefix(prefix: string): string {
  return chalk.cyan(`[${prefix}]`)
}
