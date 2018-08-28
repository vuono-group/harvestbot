'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _mail = require('@sendgrid/mail');

var _mail2 = _interopRequireDefault(_mail);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = config => {
  // TODO: error handling
  const sendExcelFile = async (email, subject, message, filePath, fileName) => {
    _mail2.default.setApiKey(config.sendGridApiKey);
    const excelFile = (0, _fs.readFileSync)(filePath);
    const msg = {
      to: email,
      from: `noreply@${config.emailDomains[0]}`,
      subject,
      text: message,
      attachments: [{
        content: Buffer.from(excelFile).toString('base64'),
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: fileName,
        disposition: 'attachment'
      }]
    };
    return _mail2.default.send(msg);
  };

  return {
    sendExcelFile
  };
};