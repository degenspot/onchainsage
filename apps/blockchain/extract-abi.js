// Save as extract-abi.js in apps/blockchain/
const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, 'target/dev/strk_payment_handler_STRKPaymentHandler.contract_class.json');
const outputPath = path.resolve(__dirname, '../../apps/backend/blockchain/contract_abi.json');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
fs.writeFileSync(outputPath, JSON.stringify(data.abi, null, 2));
console.log('ABI extracted to:', outputPath);