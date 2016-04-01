#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const quickhub = require('./index')

const projectName = argv['_'][0];

if (!projectName) {

  console.error('Missing project name. e.g. quickhub <awesomeProject>');
  process.exit();

} else {
  quickhub(projectName).then(response => {
      console.log(response.text);
    })
    .catch(error => {
      console.log('Oops...' + error.trim());
    })
}
