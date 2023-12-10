const originalLog = console.log;

var config: BuildConfig;

function logWithTag(tag: string, ...args: any[]) {
  let a: string[] = [];

  a.push(`[${new Date().toLocaleTimeString()}][${tag}] \t`);
  a.push(...args);

  originalLog.apply(console, a);
}

export default {
  setConfig(newConfig: BuildConfig) {
    config = newConfig;
  },

  log(...args: any[]) {
    logWithTag("info", ...args);
  },

  debug(...args: any[]) {
    if (!config.debug) return;
    logWithTag("debug", ...args);
  },

  warn(...args: any[]) {
    let a: string[] = [];

    a.push("\x1b[33m" + `[${new Date().toLocaleTimeString()}][warn] \t`);
    a.push(...args);
    a.push("\x1b[0m");

    originalLog.apply(console, a);
  },
};
