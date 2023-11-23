#!/usr/bin/env node

// extbuild
// https://github.com/waymondrang/extbuild

import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { version } from "./package.json";

const og_log = console.log;

const start_time = new Date().getTime();
const browser_platforms = ["firefox"];
const manifest_ignore = ["manifest_version"];

// variable isn't used anymore but keeping for future reference
const scripts_directory = __dirname;

var config: BuildConfig;
var source_manifest: ManivestV3;

/**
 * Default log channel
 *
 * Independent of build_config.json
 * @returns void
 */
var log = function (...args: any[]) {
  let a: string[] = [];

  a.push(`[${new Date().toLocaleTimeString()}][info] \t`);

  //   for (var i = 0; i < arguments.length; i++) {
  //     a.push(arguments[i]);
  //   }

  a.push(...args);

  og_log.apply(console, a);
};

/**
 * Debug log channel
 *
 * Do not invoke before build_config.json is loaded
 * @returns void
 */
var log_debug = function (...args: any[]) {
  if (!config.debug) return;

  let a: string[] = [];

  a.push(`[${new Date().toLocaleTimeString()}][info] \t`);

  //   for (var i = 0; i < arguments.length; i++) {
  //     a.push(arguments[i]);
  //   }

  a.push(...args);

  og_log.apply(console, a);
};

/**
 * Warning log channel
 *
 * Independent of build_config.json
 * @returns void
 */
var log_warn = function (...args: any[]) {
  let a: string[] = [];

  a.push("\x1b[33m" + `[${new Date().toLocaleTimeString()}][warn] \t`);

  a.push(...args);

  a.push("\x1b[0m");

  og_log.apply(console, a);
};

log("\x1b[32m" + "initializing extension builder™ in " + "\x1b[0m");

log("\x1b[32m" + process.cwd() + "\x1b[0m");

process.on("exit", function (code) {
  log(
    "\x1b[36m" +
      "process exited in " +
      (new Date().getTime() - start_time) / 1000 +
      " seconds with code " +
      code +
      "\x1b[0m"
  );
});

// find and load build_config.json
try {
  config = JSON.parse(fs.readFileSync("build_config.json", "utf8"));
  log("build_config.json found");
} catch (e) {
  log_warn("build_config.json not found");
  process.exit(99);
}

// find and load source_manifest.json
try {
  source_manifest = JSON.parse(
    fs.readFileSync(config.source.directory + "/" + "manifest.json", "utf8")
  );
} catch {
  log_warn("could not read source manifest in ", config.source.directory);
  process.exit(99);
}

const force_mode =
  process.argv.includes("--ignore") || process.argv.includes("--force");
const will_package =
  process.argv.includes("--all") ||
  process.argv.includes("--package") ||
  config.default_actions.includes("package");
const will_copy =
  process.argv.includes("--copy") ||
  process.argv.includes("--all") ||
  config.default_actions.includes("copy");
// const will_git =
//   process.argv.includes("--git") ||
//   process.argv.includes("--all") ||
//   config.default_actions.includes("git");
const will_git = false;
const version_exists = fs.existsSync(
  `${config.release_directory}/${config.project_name_short}_v${source_manifest.version}_${config.source.platform}.zip`
);
const targets = config.targets;

log(
  "\x1b[32m" +
    "actions to perform: " +
    (will_copy ? "copy " : "") +
    (will_package ? "package " : "") +
    (will_git ? "git " : "") +
    "\x1b[0m"
);

log_debug(
  config.debug
    ? "debug mode "
    : "" + version_exists
    ? "version exists "
    : "" + force_mode
    ? "force mode "
    : ""
);

if (
  !fs.existsSync(config.release_directory) ||
  !fs.statSync(config.release_directory).isDirectory()
) {
  log("creating release directory " + config.release_directory);
  fs.mkdirSync(config.release_directory);
  log("created release directory " + config.release_directory);
}

// manifest updates happen here

log(
  "updating " +
    targets.map((e) => e.platform).join(", ") +
    " manifests using " +
    config.source.platform +
    " manifest"
);

// clean manifest
// if (config.clean_manifest) {
//   for (field in source_manifest) {
//     if (
//       !source_manifest[field] || Array.isArray(source_manifest[field])
//         ? !source_manifest[field].length
//         : false || typeof source_manifest[field] === "object"
//         ? !Object.keys(source_manifest[field]).length
//         : false
//     ) {
//       log_warn(field + " field is empty");
//       delete source_manifest[field];
//       log("cleaned field " + field);
//       cleaned = true;
//     }
//   }

//   fs.writeFileSync(
//     config.source.directory + "/manifest.json",
//     JSON.stringify(source_manifest, null, 2)
//   );
//   log("wrote cleaned manifest to source file");
// }

for (var target of targets) {
  if (target.temp && !will_package) {
    log_debug(
      "skipping checking if target directory " + target.directory + " exists"
    );
    continue;
  }
  log_debug("checking if target directory " + target.directory + " exists");
  if (
    !fs.existsSync(target.directory) ||
    !fs.statSync(target.directory).isDirectory()
  ) {
    log("creating target directory " + target.directory);
    fs.mkdirSync(target.directory);
    log("created target directory " + target.directory);
  }
  log_debug("creating manifest for " + target.platform);
  target.manifest = { manifest_version: target.manifest_version };
  for (field in source_manifest) {
    log_debug(
      "processing " + field + " field for " + target.platform + " manifest"
    );
    if (manifest_ignore.includes(field)) {
      continue;
    }
    if (source_manifest.manifest_version == 3 && target.manifest_version == 2) {
      if (field == "web_accessible_resources") {
        target.manifest.web_accessible_resources =
          source_manifest.web_accessible_resources[0].resources;
        continue;
      }
      if (field == "action") {
        target.manifest.browser_action = source_manifest.action;
        continue;
      }
      if (field == "background") {
        target.manifest.background = {
          scripts: [source_manifest.background.service_worker],
        };
        continue;
      }
    }
    // If not a special case, just copy the field
    target.manifest[field] = source_manifest[field];
  }
  log_debug("writing manifest.json to " + target.directory + "/manifest.json");
  fs.writeFileSync(
    target.directory + "/manifest.json",
    JSON.stringify(target.manifest, null, 2)
  );
}

log(
  "updated " +
    targets.map((e) => e.platform).join(", ") +
    " manifests using " +
    config.source.platform +
    " manifest"
);

if (will_copy) {
  log(
    "copying files between " +
      config.source.platform +
      " and " +
      targets.map((e) => e.platform).join(", ") +
      " directories"
  );
  for (var target of targets) {
    if (target.temp && !will_package) {
      log_debug("skipping copying " + target.directory);
      continue;
    }
    var files = fs.readdirSync(config.source.directory);
    for (var file of files) {
      let all_js = target.patch.includes("*.js"); // messy "wildcard" support
      if (fs.statSync(config.source.directory + "/" + file).isDirectory()) {
        log_debug(
          "expanding directory " + config.source.directory + "/" + file
        );
        var directory_files = fs.readdirSync(
          config.source.directory + "/" + file
        );
        files.push(...directory_files.map((e) => file + "/" + e));
        continue;
      }
      if (file.includes("manifest.json")) {
        log_debug("skipping manifest file");
        continue;
      }
      log_debug(
        "copying " +
          (file.length > 30 ? file.substring(0, 30) + "..." : file) +
          " to " +
          target.directory +
          "/" +
          (file.length > 30 ? file.substring(0, 30) + "..." : file)
      );
      fs.copySync(
        config.source.directory + "/" + file,
        target.directory + "/" + file
      );
      if (
        target.patch &&
        (target.patch.includes(file) || (all_js && file.endsWith(".js")))
      ) {
        log_debug("processing " + file);
        var source_file = fs
          .readFileSync(config.source.directory + "/" + file, {
            encoding: "utf-8",
          })
          .toString();
        var target_file;
        if (config.source.platform == "chrome") {
          if (
            source_manifest.manifest_version == 3 &&
            target.manifest_version == 2
          ) {
            target_file = browser_platforms.includes(target.platform)
              ? source_file
                  .replace(/chrome\.action/gm, "browser.browserAction")
                  .replace(/chrome\./gm, "browser.")
              : source_file.replace(/chrome\.action/gm, "chrome.browserAction");
          } else if (
            source_manifest.manifest_version == 2 &&
            target.manifest_version == 3
          ) {
            log("bump manifest version not yet supported");
            process.exit(1);
          } else {
            log(
              "manifest is equal, still will process browser api compatibility " +
                file
            );
            target_file = browser_platforms.includes(target.platform)
              ? source_file.replace(/chrome\./gm, "browser.")
              : source_file;
          }
        } else {
          log("platform not yet supported for directory sync");
          process.exit(1);
        }
        fs.writeFileSync(target.directory + "/" + file, target_file);
        log_debug("finished processing " + file);
      }
    }
    log_debug(
      "finished copying " +
        files.length +
        " files from " +
        config.source.platform +
        " into " +
        target.platform +
        " directory"
    );
  }
  log(
    "copied files between " +
      config.source.platform +
      " and " +
      targets.map((e) => e.platform).join(", ") +
      " directories"
  );
  if (will_git) {
    log("pushing synced directories to github");
    execSync(
      `${path.join(scripts_directory, "git.sh")} \"${
        config.git_messages.directory_sync
      }\"`,
      { shell: true, windowsHide: true }
    );
  }
  log("copying finished");
}

// packaging section

// first, validation

if (version_exists) {
  if (config["enforce_version_control"] && will_package && !force_mode) {
    log_warn(
      "will not overwrite existing packages for version " +
        source_manifest.version
    );
    process.exit(99);
  }
  if (will_package)
    log_warn(
      "overwriting existing packages for version " + source_manifest.version
    );
}

// then, package

if (will_package) {
  log(
    `packaging ${source_manifest.version} for ` +
      targets.map((e) => e.platform).join(", ") +
      " & " +
      config.source.platform
  );
  var packages = targets;
  packages.push(config.source);
  for (var package of packages) {
    var command = `${path.join(
      scripts_directory,
      config.debug ? "package.d.sh" : "package.sh"
    )} \"v${source_manifest.version}\" \"${config.project_name_short}\" \"${
      package.platform
    }\" \"${package.directory}\" \"${config.release_directory}\" ${
      package.temp ? "--temp" : ""
    }`;
    log_debug("executing " + command);
    execSync(command, { shell: true, windowsHide: true });
    log(`packaged ${source_manifest.version} for ` + package.platform);
    if (package.temp) {
      log("removing temporary target directory " + package.directory);
      fs.removeSync(package.directory);
      log("removed temporary target directory " + package.directory);
    }
  }
  if (will_git) {
    log("pushing completed packages to github");
    execSync(
      `${path.join(scripts_directory, "git.sh")} \"${
        config.git_messages.packages
      }\"`,
      { shell: true, windowsHide: true }
    );
  }
}
