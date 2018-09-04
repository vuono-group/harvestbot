"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _xlsx = _interopRequireDefault(require("xlsx"));

var _default = () => {
  const CHAR_CODE_A = 65; // TODO: error handling

  const writeSheet = (filePath, sheets) => {
    const book = _xlsx.default.utils.book_new();

    sheets.map(({
      rows,
      title,
      headers,
      columns
    }) => {
      const sheet = _xlsx.default.utils.json_to_sheet(rows);

      headers.map((label, index) => {
        sheet[String.fromCharCode(CHAR_CODE_A + index) + 1].v = label;
        return true;
      });

      if (!sheet['!cols']) {
        sheet['!cols'] = [];
      }

      columns.map(({
        index,
        width
      }) => {
        sheet['!cols'][index] = {
          wch: width
        };
        return index;
      });
      return _xlsx.default.utils.book_append_sheet(book, sheet, title);
    });

    _xlsx.default.writeFile(book, filePath);
  };

  return {
    writeSheet
  };
};

exports.default = _default;