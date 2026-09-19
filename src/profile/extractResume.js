const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractResumeText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);

  const parser = new pdfParse.PDFParse({
    data: dataBuffer,
  });

  const result = await parser.getText();

  await parser.destroy();

  return result.text;
}

module.exports = {
  extractResumeText,
};