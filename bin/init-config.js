"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _config = _interopRequireDefault(require("config"));

var _keyRing = _interopRequireDefault(require("./cloud/key-ring"));

/* eslint-disable import/no-extraneous-dependencies */

/* eslint-enable import/no-extraneous-dependencies */
const config = {
  inGoogleCloud: false,
  projectId: process.env.GCLOUD_PROJECT,
  region: process.env.FUNCTION_REGION
};
const {
  encryptSecret
} = (0, _keyRing.default)(config); // This utility is used the first time configuration is created to cloud

encryptSecret(JSON.stringify(_config.default));