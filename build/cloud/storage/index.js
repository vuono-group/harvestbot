'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _storage = require('@google-cloud/storage');

var _storage2 = _interopRequireDefault(_storage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = () => {
  const secretsBucketName = 'harvestbot-secret-storage';
  const storage = new _storage2.default();

  const uploadSecret = filePath => storage.bucket(secretsBucketName).upload(filePath);

  const downloadSecret = (fileName, destinationPath) => storage.bucket(secretsBucketName).file(fileName).download({
    destination: destinationPath
  });

  return {
    uploadSecret,
    downloadSecret
  };
};