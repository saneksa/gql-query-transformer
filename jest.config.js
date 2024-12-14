/**
 * @type {import("jest").Config}
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "lib"],
  transform: {},
  transformIgnorePatterns: ["node_modules"],
};
