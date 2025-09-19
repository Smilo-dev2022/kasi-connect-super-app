const React = require('react');
module.exports = {
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  TouchEventBoundary: ({ children }) => React.createElement(React.Fragment, null, children),
};