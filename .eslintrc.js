module.exports = {
  extends: [
    "@gidw/eslint-config-standard-node",
    "eslint-config-prettier",
  ],
  env: {
    node: true,
  },
  ignorePatterns: [
    "node_modules/",
    "test_data/",
  ],
};
