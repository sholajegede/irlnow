const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/*
 * Monorepo wiring.
 *
 * Metro only watches the project directory by default, so a change in
 * packages/domain or convex/ would not trigger a reload — and the packages
 * themselves would not resolve at all.
 */
config.watchFolders = [workspaceRoot];

// Look in the app's own node_modules first, then the hoisted root. Without
// the explicit list Metro walks upward and can bind two copies of React.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// A second React or react-native instance breaks hooks in ways that surface
// as unrelated runtime errors. Pin both to the hoisted copy.
config.resolver.extraNodeModules = {
  react: path.resolve(workspaceRoot, "node_modules/react"),
  "react-native": path.resolve(workspaceRoot, "node_modules/react-native"),
};

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
