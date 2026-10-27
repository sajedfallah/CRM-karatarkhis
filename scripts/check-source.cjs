const fs = require('node:fs');
const vm = require('node:vm');
new vm.Script(fs.readFileSync('src/apps-script/Code.gs', 'utf8'));
console.log('Apps Script syntax OK');

