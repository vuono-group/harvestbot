"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _xlsx = _interopRequireDefault(require("xlsx"));

var _default = () => {
  const CHAR_CODE_A = 65; // TODO: error handling

  const writeSheet = (data, filePath, title, labels = []) => {
    const sheet = _xlsx.default.utils.json_to_sheet(data);

    labels.map((label, index) => {
      sheet[String.fromCharCode(CHAR_CODE_A + index) + 1].v = label;
      return true;
    });

    const book = _xlsx.default.utils.book_new();

    _xlsx.default.utils.book_append_sheet(book, sheet, title);

    _xlsx.default.writeFile(book, filePath);
  };

  return {
    writeSheet
  };
};

exports.default = _default;