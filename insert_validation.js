const fs = require('fs'); 
const path = require('path'); 
// Read the original file 
const filePath = path.join(__dirname, 'admin-submission-detail.html'); 
const content = fs.readFileSync(filePath, 'utf8'); 
console.log('Original file loaded, length:', content.length); 
// Read the validation code 
const validationCode = fs.readFileSync('validation_fix.js', 'utf8'); 
console.log('Validation code loaded, length:', validationCode.length); 
// Find the insertion point 
const insertPoint = "console.log('Calling Edge Function with payload:', edgeFunctionPayload);"; 
// Insert the validation code before the insertion point 
const newContent = content.replace(insertPoint, validationCode + "\n                " + insertPoint); 
console.log('Validation code inserted.'); 
// Write the updated content back to the file 
fs.writeFileSync(filePath, newContent); 
console.log('Changes saved to', filePath); 
