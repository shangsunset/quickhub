#!/usr/bin/env node

const execSync = require('child_process').execSync;
const fs = require('fs');
const read = require('read');
const argv = require('minimist')(process.argv.slice(2));

const quickhub = require('./index')

const projectName = argv['_'][0];
const configPath = `${process.env.HOME}/.quickhub`;

function getUserCredentials() {

  return new Promise((resolve, reject) => {

    fs.stat(configPath, (error, stats) => {
      // if file doesnt exist
      if (error) {

        getCredentialsFromPrompt((username, password) => {

          if (!username || !password) {
            process.exit();
          }
          const credentials = { username, password };
          fs.writeFile(configPath, JSON.stringify(credentials, null, 2), (error) => {

            if (error) reject(error);
            resolve(credentials);
          });
        });
      } else {

        fs.readFile(configPath, (error, data) => {
          if (error) reject(error);

          resolve(JSON.parse(data));
        });
      }
    });
  });
}

function getCredentialsFromPrompt(cb) {
  
  console.log('Please enter your github credentials.');
  read({prompt: 'github username: '}, (error, username) => {
    read({prompt: 'github password: ', silent: true}, (error, password) => {
      cb(username, password)
    });
  });
}

function deleteConfigFile() {

  fs.stat(configPath, (error, stats) => {
    if (!error) {
      
      const file = execSync(`rm ${configPath}`)

    }
  });
}

if (!projectName) {

  console.error('Missing project name. e.g. quickhub <awesomeProject>');
  process.exit();

} else {

  getUserCredentials().then(credentials => {
    
    quickhub(projectName, {
      username: credentials.username,
      password: credentials.password
    })
    .then(response => {
        console.log(response);
    })
    .catch(error => {
      if (typeof error === 'string') {
        error = error.trim();
      }
      if (error.toLowerCase() === 'bad credentials') {
        deleteConfigFile();
      }
      console.log(error);
    })
  })
  .catch(error => console.log(error))
}
