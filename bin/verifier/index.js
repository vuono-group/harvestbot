"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _log = _interopRequireDefault(require("../log"));

var _default = config => {
  const logger = (0, _log.default)(config);
  const REQUEST_MAX_AGE_SECS = 5 * 60;

  const timestampWithinRange = timestamp => config.currentTime - timestamp < REQUEST_MAX_AGE_SECS;

  const signatureOk = (rawBody, timestamp, signature) => {
    const data = `v0:${timestamp}:${rawBody}`;
    logger.info(`Request: ${data}`);

    const hmac = _crypto.default.createHmac('sha256', config.slackSigningSecret).update(data).digest('hex');

    logger.info(`Comparing hmac to signature: ${hmac}, ${signature}`);
    return `v0=${hmac}` === signature;
  };

  const verifySlackRequest = (req, timestamp = req.header('X-Slack-Request-Timestamp'), signature = req.header('X-Slack-Signature')) => timestampWithinRange(timestamp) ? signatureOk(req.rawBody, timestamp, signature) : false;

  return {
    verifySlackRequest
  };
};

exports.default = _default;