type LogArgs = unknown[];

const shouldLogToConsole = import.meta.env.DEV;

export const logger = {
  debug(...args: LogArgs) {
    if (shouldLogToConsole) {
      console.debug(...args);
    }
  },

  warn(...args: LogArgs) {
    if (shouldLogToConsole) {
      console.warn(...args);
    }
  },

  error(...args: LogArgs) {
    if (shouldLogToConsole) {
      console.error(...args);
    }
  },
};
