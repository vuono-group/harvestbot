'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xlsx = require('xlsx');

var _xlsx2 = _interopRequireDefault(_xlsx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = () => {
  const CHAR_CODE_A = 65;

  // TODO: error handling
  const writeSheet = (data, filePath, title, labels = []) => {
    const sheet = _xlsx2.default.utils.json_to_sheet(data);
    labels.map((label, index) => {
      sheet[String.fromCharCode(CHAR_CODE_A + index) + 1].v = label;
      return true;
    });
    const book = _xlsx2.default.utils.book_new();
    _xlsx2.default.utils.book_append_sheet(book, sheet, title);
    _xlsx2.default.writeFile(book, filePath);
  };

  return {
    writeSheet
  };
};