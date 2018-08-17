import xlsx from 'xlsx';

export default () => {
  const CHAR_CODE_A = 65;

  // TODO: error handling
  const writeSheet = (data, filePath, title, labels = []) => {
    const sheet = xlsx.utils.json_to_sheet(data);
    labels.map((label, index) => {
      sheet[String.fromCharCode(CHAR_CODE_A + index) + 1].v = label;
      return true;
    });
    const book = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(book, sheet, title);
    xlsx.writeFile(book, filePath);
  };

  return {
    writeSheet,
  };
};
