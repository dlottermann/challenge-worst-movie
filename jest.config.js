export default {
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "json"],
  testMatch: ["**/tests/**/*.test.js"],
};
