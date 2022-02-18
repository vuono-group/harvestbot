"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = require("fs");

var _mail = _interopRequireDefault(require("@sendgrid/mail"));

var _default = config => {
  // TODO: error handling
  const sendExcelFile = async (email, subject, message, filePath, fileName) => {
    _mail.default.setApiKey(config.sendGridApiKey);

    const excelFile = (0, _fs.readFileSync)(filePath);
    const msg = {
      to: email,
      from: `harvestbot@${config.emailDomains[0]}`,
      subject,
      text: message,
      attachments: [{
        content: Buffer.from(excelFile).toString('base64'),
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: fileName,
        disposition: 'attachment'
      }]
    };
    return _mail.default.send(msg);
  };

  return {
    sendExcelFile
  };
};

exports.default = _default;