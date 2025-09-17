module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module-resolver', {
      root: ['./src'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        '@api': './src/api',
        '@features': './src/features',
        '@navigation': './src/navigation',
        '@screens': './src/screens',
        '@components': './src/components',
        '@utils': './src/utils',
        '@types': './src/types',
        '@theme': './src/theme'
      }
    }],
    'react-native-reanimated/plugin'
  ]
};
