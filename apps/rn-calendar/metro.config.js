/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Monorepo 根目录
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
    watchFolders: [
        // 监听共享包目录
        path.resolve(monorepoRoot, 'packages/shared'),
        // 监听 monorepo 根目录
        monorepoRoot,
    ],
    resolver: {
        nodeModulesPaths: [
            path.resolve(projectRoot, 'node_modules'),
            path.resolve(monorepoRoot, 'node_modules'),
        ],
        // 解析共享包的额外扩展
        extraNodeModules: {
            '@daymate/shared': path.resolve(monorepoRoot, 'packages/shared'),
        },
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
