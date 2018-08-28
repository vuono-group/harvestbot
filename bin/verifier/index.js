'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = config => {
  const logger = (0, _log2.default)(config);
  const REQUEST_MAX_AGE_SECS = 5 * 60;

  const timestampWithinRange = timestamp => config.currentTime - timestamp < REQUEST_MAX_AGE_SECS;

  const signatureOk = (rawBody, timestamp, signature) => {
    const data = `v0:${timestamp}:${rawBody}`;
    logger.info(`Request: ${data}`);
    const hmac = _crypto2.default.createHmac('sha256', config.slackSigningSecret).update(data).digest('hex');
    logger.info(`Comparing hmac to signature: ${hmac}, ${signature}`);
    return `v0=${hmac}` === signature;
  };

  const verifySlackRequest = (req, timestamp = req.header('X-Slack-Request-Timestamp'), signature = req.header('X-Slack-Signature')) => timestampWithinRange(timestamp) ? signatureOk(req.rawBody, timestamp, signature) : false;

  return {
    verifySlackRequest
  };
};