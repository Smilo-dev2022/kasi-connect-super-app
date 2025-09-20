module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|@sentry/react-native)',
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
