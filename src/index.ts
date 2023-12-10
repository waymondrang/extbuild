#!/usr/bin/env node

// extbuild
// https://github.com/waymondrang/extbuild

import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { version } from "../package.json";
import logger from "./logger";
import os from "os";
import handleWindows from "./platforms/win32";
import handleMacOS from "./platforms/darwin";

const start_time = new Date().getTime();
const systemPlatform = os.platform();

var config: BuildConfig;
var sourceManifest: ManivestV3;

try {
  config = JSON.parse(fs.readFileSync("build_config.json", "utf8"));
  logger.log("build_config.json found");
} catch (e) {
  logger.warn("build_config.json not found");
  process.exit(99);
}

logger.setConfig(config);

logger.log("\x1b[32m" + "running extbuild in " + "\x1b[0m");
logger.log("\x1b[32m" + process.cwd() + "\x1b[0m");

process.on("exit", function (code) {
  logger.log(
    "\x1b[36m" +
      "process exited in " +
      (new Date().getTime() - start_time) / 1000 +
      " seconds with code " +
      code +
      "\x1b[0m"
  );
});

// find and load source manifest.json
try {
  sourceManifest = JSON.parse(
    fs.readFileSync(config.source.directory + "/" + "manifest.json", "utf8")
  );
} catch {
  logger.warn("could not read source manifest in ", config.source.directory);
  process.exit(99);
}

const willForce =
  process.argv.includes("--ignore") || process.argv.includes("--force");
const willPackage =
  process.argv.includes("--all") ||
  process.argv.includes("--package") ||
  config.default_actions.includes("package");
const willCopy =
  process.argv.includes("--copy") ||
  process.argv.includes("--all") ||
  config.default_actions.includes("copy");

// const will_git =
//   process.argv.includes("--git") ||
//   process.argv.includes("--all") ||
//   config.default_actions.includes("git");
const willGit = false;

const versionExists = fs.existsSync(
  `${config.release_directory}/${config.project_name_short}_v${sourceManifest.version}_${config.source.platform}.zip`
);
const targets = config.targets;

logger.log(
  "\x1b[32m" +
    "actions to perform: " +
    (willCopy ? "copy " : "") +
    (willPackage ? "package " : "") +
    (willGit ? "git " : "") +
    "forced: " +
    willForce +
    "\x1b[0m"
);

if (config.debug)
  logger.debug(
    config.debug
      ? "debug mode "
      : "" + versionExists
      ? "version exists "
      : "" + willForce
      ? "force mode "
      : ""
  );

if (
  !fs.existsSync(config.release_directory) ||
  !fs.statSync(config.release_directory).isDirectory()
) {
  logger.log("creating release directory " + config.release_directory);
  fs.mkdirSync(config.release_directory);
  logger.log("created release directory " + config.release_directory);
}

// manifest updates happen here
// note: 12/9/2023 - manifests should not need to be updated anymore

// logger.log(
//   "updating " +
//     targets.map((e) => e.platform).join(", ") +
//     " manifests using " +
//     config.source.platform +
//     " manifest"
// );

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

// for (var target of targets) {
//   if (target.temp && !willPackage) {
//     logger.debug(
//       "skipping checking if target directory " + target.directory + " exists"
//     );
//     continue;
//   }

//   log_debug("checking if target directory " + target.directory + " exists");

//   if (
//     !fs.existsSync(target.directory) ||
//     !fs.statSync(target.directory).isDirectory()
//   ) {
//     log("creating target directory " + target.directory);
//     fs.mkdirSync(target.directory);
//     log("created target directory " + target.directory);
//   }

//   log_debug("creating manifest for " + target.platform);
//   target.manifest = { manifest_version: target.manifest_version };

//   for (field in source_manifest) {
//     log_debug(
//       "processing " + field + " field for " + target.platform + " manifest"
//     );

//     if (manifest_ignore.includes(field)) {
//       continue;
//     }

//     if (source_manifest.manifest_version == 3 && target.manifest_version == 2) {
//       if (field == "web_accessible_resources") {
//         target.manifest.web_accessible_resources =
//           source_manifest.web_accessible_resources[0].resources;
//         continue;
//       }
//       if (field == "action") {
//         target.manifest.browser_action = source_manifest.action;
//         continue;
//       }
//       if (field == "background") {
//         target.manifest.background = {
//           scripts: [source_manifest.background.service_worker],
//         };
//         continue;
//       }
//     }
//     // If not a special case, just copy the field
//     target.manifest[field] = source_manifest[field];
//   }

//   log_debug("writing manifest.json to " + target.directory + "/manifest.json");

//   fs.writeFileSync(
//     target.directory + "/manifest.json",
//     JSON.stringify(target.manifest, null, 2)
//   );
// }

// log(
//   "updated " +
//     targets.map((e) => e.platform).join(", ") +
//     " manifests using " +
//     config.source.platform +
//     " manifest"
// );

// if (willCopy) {
//   logger.log(
//     "copying files between " +
//       config.source.platform +
//       " and " +
//       targets.map((e) => e.platform).join(", ") +
//       " directories"
//   );

//   // all platforms will be temp, chrome is assumed to be source
//   for (var target of targets) {
//     if (target.temp && !willPackage) {
//       log_debug("skipping copying " + target.directory);
//       continue;
//     }
//     var files = fs.readdirSync(config.source.directory);
//     for (var file of files) {
//       let all_js = target.patch.includes("*.js"); // messy "wildcard" support
//       if (fs.statSync(config.source.directory + "/" + file).isDirectory()) {
//         log_debug(
//           "expanding directory " + config.source.directory + "/" + file
//         );
//         var directory_files = fs.readdirSync(
//           config.source.directory + "/" + file
//         );
//         files.push(...directory_files.map((e) => file + "/" + e));
//         continue;
//       }
//       if (file.includes("manifest.json")) {
//         log_debug("skipping manifest file");
//         continue;
//       }
//       log_debug(
//         "copying " +
//           (file.length > 30 ? file.substring(0, 30) + "..." : file) +
//           " to " +
//           target.directory +
//           "/" +
//           (file.length > 30 ? file.substring(0, 30) + "..." : file)
//       );
//       fs.copySync(
//         config.source.directory + "/" + file,
//         target.directory + "/" + file
//       );
//       if (
//         target.patch &&
//         (target.patch.includes(file) || (all_js && file.endsWith(".js")))
//       ) {
//         log_debug("processing " + file);
//         var source_file = fs
//           .readFileSync(config.source.directory + "/" + file, {
//             encoding: "utf-8",
//           })
//           .toString();
//         var target_file;
//         if (config.source.platform == "chrome") {
//           if (
//             sourceManifest.manifest_version == 3 &&
//             target.manifest_version == 2
//           ) {
//             target_file = browser_platforms.includes(target.platform)
//               ? source_file
//                   .replace(/chrome\.action/gm, "browser.browserAction")
//                   .replace(/chrome\./gm, "browser.")
//               : source_file.replace(/chrome\.action/gm, "chrome.browserAction");
//           } else if (
//             sourceManifest.manifest_version == 2 &&
//             target.manifest_version == 3
//           ) {
//             log("bump manifest version not yet supported");
//             process.exit(1);
//           } else {
//             log(
//               "manifest is equal, still will process browser api compatibility " +
//                 file
//             );
//             target_file = browser_platforms.includes(target.platform)
//               ? source_file.replace(/chrome\./gm, "browser.")
//               : source_file;
//           }
//         } else {
//           log("platform not yet supported for directory sync");
//           process.exit(1);
//         }
//         fs.writeFileSync(target.directory + "/" + file, target_file);
//         log_debug("finished processing " + file);
//       }
//     }
//     log_debug(
//       "finished copying " +
//         files.length +
//         " files from " +
//         config.source.platform +
//         " into " +
//         target.platform +
//         " directory"
//     );
//   }
//   log(
//     "copied files between " +
//       config.source.platform +
//       " and " +
//       targets.map((e) => e.platform).join(", ") +
//       " directories"
//   );
//   if (willGit) {
//     log("pushing synced directories to github");
//     execSync(
//       `${path.join(scripts_directory, "git.sh")} \"${
//         config.git_messages.directory_sync
//       }\"`,
//       { shell: true, windowsHide: true }
//     );
//   }
//   log("copying finished");
// }

///////////////////////
//     packaging     //
///////////////////////

// first, validation

if (versionExists) {
  if (config.enforce_version_control && willPackage && !willForce) {
    logger.warn(
      "will not overwrite existing packages for version " +
        sourceManifest.version
    );
    process.exit(99);
  }

  if (willPackage) {
    logger.warn(
      "overwriting existing packages for version " + sourceManifest.version
    );
  }
}

if (willPackage) {
  logger.log(
    `packaging ${sourceManifest.version} for ` +
      targets.map((e) => e.platform).join(", ") +
      " & " +
      config.source.platform
  );

  // packages will include source
  var buildTargets = targets;
  buildTargets.push(config.source);

  var systemHandler: SystemHandler;

  switch (systemPlatform) {
    case "win32":
      logger.debug("using windows handler for file processing");
      systemHandler = handleWindows as SystemHandler;
      break;
    case "darwin":
      logger.debug("using macos handler for file processing");
      systemHandler = handleMacOS as SystemHandler;
      break;
    default:
      logger.warn("platform not supported");
      process.exit(99);
  }

  for (var buildTarget of buildTargets) {
    systemHandler(config, sourceManifest, buildTarget);
  }
}
