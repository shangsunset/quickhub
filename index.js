
const exec = require('child_process').exec;
const fs = require('fs');

const fetch = require('node-fetch');
const Promise = require('bluebird');
const read = require('read');


function getUserInfo() {

  const configPath = `${process.env.HOME}/.quickhub`;

  return new Promise((resolve, reject) => {

    fs.stat(configPath, (error, stats) => {
      // if file doesnt exist
      if (error) {

        getCredentials((username, password) => {

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

function getCredentials(cb) {
  
  read({prompt: 'github username: '}, (error, username) => {
    read({prompt: 'github password: ', silent: true}, (error, password) => {
      cb(username, password)
    });
  });
}

function initGit(projectName) {
  
  return new Promise((resolve, reject) => {

    const dir = exec(`mkdir ${projectName}`, (error, stdout, stderr) => {
      if (stderr) {
        reject(stderr);
      }
      const git = exec('git init', {cwd: `${process.cwd()}/${projectName}`}, (error, stdout, stderr) => {

        if (stderr) {
          reject(stderr);
        }
        resolve(stdout);
      });
    });
  });
}

function deleteDir(projectName, resolve, reject) {
  
  const dir = exec(`rm -rf ${projectName}`, (error, stdout, stderr) => {

    if (stderr) reject(stderr);
  });
}

function createRepo(credentials, projectName) {

  const url = 'https://' + credentials.username + ':' + credentials.password + '@api.github.com/user/repos';

  const project = {
    'name': projectName,
    'private': false,
    'has_issues': true,
    'has_wiki': true,
    'has_downloads': true
  };

  return new Promise((resolve, reject) => {

    fetch(url, {
      method: 'post',
      headers: {
        'User-Agent': 'quickhub'
      },
      body: JSON.stringify(project)
    })
    .then((res) => {

      if (res.status === 201) {
        resolve();
      } else if (res.status === 422) {
        deleteDir(projectName, resolve, reject);
        reject('Repository already exists on Github.');
      } else if (res.status === 401) {
        reject('Bad credentials');
      } else {
        reject('Somethings is wrong');
        process.exit();
      } 
    })
    .catch(error => {
      console.error(error);
    });
  });
}

function addRemote(username, projectName) {
  return new Promise((resolve, reject) => {

    const command = `
      echo "# ${projectName}" >> README.md
      git add README.md
      git commit -m "first commit"
      git remote add origin https://github.com/${username}/${projectName}.git
      git push -u origin master
    `
    const remote = exec(command, {cwd: `${process.cwd()}/${projectName}`}, (error, stdout, stderr) => {
      resolve(stdout);
      if (error) reject(error);
      if (stderr) {
        reject(stderr);
      }
    });
  });
}

module.exports = function(projectName) {

  return new Promise((resolve, reject) => {

    if (!projectName) {
      reject('Missing argument project name.');
    } else {

      return Promise.join(getUserInfo(), initGit(projectName), (credentials, initResponse) => {
      
        createRepo(credentials, projectName)
          .then(() => addRemote(credentials.username, projectName))
          .then(addRemoteResponse => {

            const response = initResponse + '\n' + addRemoteResponse;
            resolve({
              ok: true,
              text: response
            });
          })
          .catch(error => reject(error));
      });
    }
  });
}
