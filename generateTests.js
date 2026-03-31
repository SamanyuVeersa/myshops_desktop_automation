const fs = require("fs");

const testCases = JSON.parse(fs.readFileSync("filteredTestCases.json"));

let output = `
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? '';
if (!BASE_URL) {
  throw new Error('Set BASE_URL in .env (e.g. BASE_URL=https://your-uat-site.example/)');
}

`;

testCases.forEach((tc, index) => {
  const name = tc["Test Case"] || `Test ${index}`;
  const title = `${name} [${index}]`;

  output += `
test(${JSON.stringify(title)}, async ({ page }) => {
  await page.goto(BASE_URL);

  // TODO: Implement steps
  console.log(${JSON.stringify(tc)});
});
`;
});

fs.writeFileSync("tests/generated.spec.ts", output);

console.log("Tests generated!");