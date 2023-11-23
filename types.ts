type BuildAction = "copy" | "package";

type BuildPlatform = "chrome" | "firefox" | "opera";

type BuildTarget = {
  directory: string;
  platform: BuildPlatform;
  manifest_version: number;
  patch: string[];
  temp: boolean;
};

type BuildConfig = {
  project_name_short: string;
  enforce_version_control: boolean;
  clean_manifest: boolean;
  default_actions: BuildAction[];
  release_directory: string;
  source: BuildTarget;
  targets: BuildTarget[];
  git_messages: {
    packages: string;
  };
  debug: boolean;
};

type ManivestV3ContentScript = {
  matches: string[];
  js: string[];
  css: string[];
};

type ManivestV3Action = {
  default_icon: {
    16: string;
    24: string;
    32: string;
  };
  default_title: string;
  default_popup: string;
};

type ManivestV3WebAccessibleResource = {
  resources: string[];
  matches: string[];
};

type ManivestV3 = {
  manifest_version: number;
  name: string;
  version: string;
  description: string;
  author: string;
  content_scripts: ManivestV3ContentScript[];
  action: ManivestV3Action;
  web_accessible_resources: ManivestV3WebAccessibleResource[];
  icons: {
    [key: string]: string;
  };
  permissions: string[];
};
