const XLSX = require("xlsx");
const fs = require("fs");

// Read workbook
const workbook = XLSX.readFile("MyShops Desktop.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to array of arrays (keeps row numbers intact)
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Extract header separately
const headers = rawData[0];

// Function to convert Excel row numbers → indices
const excelRows = [
  ...range(2,5), 7, ...range(9,17), 19,
  ...range(23,27), 29, 32, 37, 47, 48, 52,
  ...range(55,59), ...range(61,63), ...range(66,67),
  ...range(69,76), ...range(78,86), ...range(88,99),
  103, 105
];

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// Convert Excel rows → actual data
const filtered = excelRows.map(rowNum => {
  const row = rawData[rowNum - 1]; // Excel row → index
  if (!row) return null;

  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = row[i];
  });

  return obj;
}).filter(Boolean);

// Save output
fs.writeFileSync("filteredTestCases.json", JSON.stringify(filtered, null, 2));

console.log("✅ Correct rows extracted!");