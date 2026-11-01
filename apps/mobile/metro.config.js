// Metro com o pacote de regras compartilhadas (packages/shared), fora da pasta do app.
// O app NÃO faz parte de workspaces npm: tem o próprio node_modules.
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const raizApp = __dirname;
const shared = path.resolve(raizApp, "../../packages/shared");

const config = getDefaultConfig(raizApp);

// Observa o código compartilhado (hot reload quando ele muda).
config.watchFolders = [...(config.watchFolders ?? []), shared];
// "@aviso/shared" → packages/shared (package.json aponta main para src/index.ts).
config.resolver.extraNodeModules = { ...(config.resolver.extraNodeModules ?? {}), "@aviso/shared": shared };
// Dependências do código compartilhado são resolvidas no node_modules do app.
config.resolver.nodeModulesPaths = [path.resolve(raizApp, "node_modules")];

module.exports = config;
