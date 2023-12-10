import fs from "fs";
import { execSync } from "child_process";
import logger from "../logger";
import os from "os";
import path from "path";

const tempDirectory = os.tmpdir();

export default function (
  config: BuildConfig,
  sourceManifest: ManivestV3,
  buildTarget: BuildTarget
) {
  const combinedName = `${config.project_name_short}_v${sourceManifest.version}_${buildTarget.platform}`;

  const temporaryDirectory = path.join(tempDirectory, combinedName);
  const destinationPath = path.join(
    config.release_directory,
    `${combinedName}.zip`
  );

  // check if temporary directory exists
  if (fs.existsSync(temporaryDirectory)) {
    logger.log("deleting temporary target directory " + temporaryDirectory);

    fs.rmSync(temporaryDirectory, { recursive: true });
  }

  logger.log("creating temporary target directory " + temporaryDirectory);

  fs.mkdirSync(temporaryDirectory);

  logger.log("created temporary target directory " + temporaryDirectory);

  // todo: process and copy files into temporary directory
  throw new Error("not implemented");

  // ensure release directory exists
  if (
    !fs.existsSync(config.release_directory) ||
    !fs.statSync(config.release_directory).isDirectory()
  ) {
    logger.log("creating release directory " + config.release_directory);

    fs.mkdirSync(config.release_directory, { recursive: true });
  }

  // on windows
  // command will update archive if already exists
  // https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.archive/compress-archive?view=powershell-7.4
  execSync(
    `Compress-Archive -Update -Path ${temporaryDirectory} -DestinationPath ${destinationPath}`,
    {
      shell: "powershell.exe",
    }
  );

  // remove temporary directory
  logger.log("removing temporary target directory " + temporaryDirectory);

  fs.rmSync(temporaryDirectory, { recursive: true });

  logger.log("removed temporary target directory " + temporaryDirectory);
}
