'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _googleapis = require('googleapis');

var _fs = require('fs');

var _os = require('os');

var _log = require('../../log');

var _log2 = _interopRequireDefault(_log);

var _storage = require('../storage');

var _storage2 = _interopRequireDefault(_storage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

exports.default = (_ref) => {
  let { projectId, region } = _ref,
      config = _objectWithoutProperties(_ref, ['projectId', 'region']);

  const logger = (0, _log2.default)(config);
  const fileName = 'harvestbot-config.encrypted';
  const localFilePath = `${(0, _os.tmpdir)()}/${fileName}`;
  const secretStorage = (0, _storage2.default)();
  const keyName = `projects/${projectId}/locations/${region}/keyRings/harvestbot-keyring/cryptoKeys/harvestbot-encryption-key`;

  const authorise = async () => {
    const authClient = await _googleapis.google.auth.getClient({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    if (authClient) {
      return _googleapis.google.cloudkms({
        version: 'v1',
        auth: authClient
      });
    }
    logger.error('Unable to create cloudkms service.');
    return null;
  };

  const encryptSecret = async plainText => {
    const cloudkms = await authorise();
    if (cloudkms) {
      const request = {
        name: keyName,
        resource: {
          plaintext: Buffer.from(plainText).toString('base64')
        }
      };
      try {
        const response = await cloudkms.projects.locations.keyRings.cryptoKeys.encrypt(request);
        if (response) {
          (0, _fs.writeFileSync)(localFilePath, Buffer.from(response.data.ciphertext, 'base64'));
          logger.info(`Written encrypted config to file: ${localFilePath}`);
          await secretStorage.uploadSecret(localFilePath);
          logger.info('Uploaded encrypted file to storage.');
          return localFilePath;
        }
      } catch (error) {
        logger.error(`Error in file encryption: ${error}`);
      }
    }
    return null;
  };

  const decryptSecret = async () => {
    const cloudkms = await authorise();
    if (cloudkms) {
      await secretStorage.downloadSecret(fileName, localFilePath);
      const fileContent = (0, _fs.readFileSync)(localFilePath);
      (0, _fs.unlinkSync)(localFilePath);
      const request = {
        name: keyName,
        resource: {
          ciphertext: Buffer.from(fileContent).toString('base64')
        }
      };
      try {
        const response = await cloudkms.projects.locations.keyRings.cryptoKeys.decrypt(request);
        return Buffer.from(response.data.plaintext, 'base64');
      } catch (error) {
        logger.error(`Error in file decryption: ${error}`);
      }
    }
    return null;
  };

  return {
    encryptSecret,
    decryptSecret
  };
};