import { readFileSync } from 'fs';
import sgMail from '@sendgrid/mail';

export default (config) => {
  // TODO: error handling
  const sendExcelFile = async (email, subject, message, filePath, fileName) => {
    sgMail.setApiKey(config.sendGridApiKey);
    const excelFile = readFileSync(filePath);
    const msg = {
      to: email,
      from: `noreply@${config.emailDomains[0]}`,
      subject,
      text: message,
      attachments: [{
        content: Buffer.from(excelFile).toString('base64'),
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: fileName,
        disposition: 'attachment',
      }],
    };
    return sgMail.send(msg);
  };

  return {
    sendExcelFile,
  };
};
