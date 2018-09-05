"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _storage = require("@google-cloud/storage");

var _default = () => {
  const secretsBucketName = 'harvestbot-secret-storage';
  const storage = new _storage.Storage();

  const uploadSecret = filePath => storage.bucket(secretsBucketName).upload(filePath);

  const downloadSecret = (fileName, destinationPath) => storage.bucket(secretsBucketName).file(fileName).download({
    destination: destinationPath
  });

  return {
    uploadSecret,
    downloadSecret
  };
};

exports.default = _default;