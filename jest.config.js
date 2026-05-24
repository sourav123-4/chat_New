module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-native-community|@react-navigation|react-native-.*|@react-native-icons|@reduxjs/toolkit|immer|react-redux|redux-persist|redux-logger|redux-saga)/)',
  ],
};
