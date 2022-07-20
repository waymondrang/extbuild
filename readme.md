## Extension Builder

A command line tool to help package browser extensions for different platforms and manifest versions.

## Features

- Set project-specific configurations
- Sync files between source and target directories
- Package (zip) targets for distribution
- Create temporary target directories
- Prevent version overwrite
- Clean manifest.json

## Installation

To use extbuild in the terminal, install with the `-g` option

```console
npm install -g extbuild
```

## Usage

Navigate the current working directory to where build_config.json is an immediate child, then run

```console
extbuild
```

## Configuration

```json
{
  "project_name_short": "extbuild",
  "enforce_version_control": true,
  "clean_manifest": true,
  "default_actions": ["copy"],
  "release_directory": "../releases",
  "source": {
    "directory": "../src/chrome",
    "platform": "chrome"
  },
  "targets": [
    {
      "directory": "../src/firefox",
      "platform": "firefox",
      "manifest_version": 2,
      "patch": [],
      "temp": true
    }
  ],
  "git_messages": {
    "directory_sync": "automated directory sync",
    "packages": "automated package build"
  },
  "debug": false
}
```

## `project_name_short`

The extension's short/abbreviated name.

#### Example

`dad`, `pur`, or `extbuild`.

## `enforce_version_control`

If set to `true`, the program will check if a package already exists for the extension's current version. You can temporarily override this by using the `--force` option.

## `clean-manifest`

If `true`, the program will remove any empty fields in the manifest, including empty objects, arrays, and strings.

## `default_actions`

An array of actions that will run on every invocation.

#### Options

`copy`

This will sync the target (excluding `temp` enabled) directories with the source directory, adjusting any patch files and manifest fields.

`package`

This will create packages for the source and target (including `temp` enabled) directories.

`git`

This will push to GitHub after every action with automated messages configured in `build_config.json`.

## `release_directory`

The relative path of the release directory, where packages will be created. If the directory does not exist, it will be created.

## `source`

An object containing information on the source directory.

#### `directory`

The relative path of the source directory. This path must exist and contain a `manifest.json` file.

#### `platform`

The platform of the source directory. Supports `chrome` and `firefox`.

## `targets`

An array of objects containing information on the build targets.

#### `directory`

The relative path of the source directory. If `temp` is `true`, this will be the relative path of the temporary directory. If the directory does not exist, one will be created.

#### `platform`

The platform of the target. Supports `chrome`, `firefox`, `opera`, and `edge`.

#### `manifest_version`

The manifest version of the target.

#### `patch`

Array of files to patch. Patches version and platform-specific methods, including changing `chrome` to `browser` for Firefox and `browserAction` to `action` for sync between manifest V2 and V3.

`manifest.json` files will be synced by default, it does not need to be included in `patch`.

#### `temp`

If `true`, the target directory will only be created if the package action is invoked, in which the directory will be removed after the process has finished.

## `git_messages`

Commit messages used when the git action is invoked.

## `debug`

Extra console output

## `scripts_directory`

If invoking the script via `npm`, this field is required to point the program to the .sh scripts.
