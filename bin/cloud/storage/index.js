"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _storage = require("@google-cloud/storage");

var _log = _interopRequireDefault(require("../../log"));

var _default = (_ref) => {
  let {
    projectId
  } = _ref,
      config = (0, _objectWithoutProperties2.default)(_ref, ["projectId"]);
  const secretsBucketName = `${projectId}-secret-storage`;
  const storage = new _storage.Storage();
  const logger = (0, _log.default)(config);

  const uploadSecret = filePath => {
    logger.info(`Uploading configuration to ${secretsBucketName}`);
    return storage.bucket(secretsBucketName).upload(filePath);
  };

  const downloadSecret = (fileName, destinationPath) => storage.bucket(secretsBucketName).file(fileName).download({
    destination: destinationPath
  });

  return {
    uploadSecret,
    downloadSecret
  };
};

exports.default = _default;