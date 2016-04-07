const exec = require('child_process').exec;
const fetch = require('node-fetch');
const Promise = require('bluebird');


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
        resolve({
          ok: true,
          text: stdout
        });
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
        deleteDir(projectName, resolve, reject);
        reject('Bad credentials');
      } else {
        deleteDir(projectName, resolve, reject);
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
      resolve({
        ok: true,
        text: stdout
      });
      if (error) reject(error);
      if (stderr) {
        reject(stderr);
      }
    });
  });
}

module.exports = function(projectName, credentials) {

  if (typeof credentials === 'undefined') {
    credentials = null;
  }
  return new Promise((resolve, reject) => {

    if (!projectName) {
      reject('Missing argument project name.');
    } else if (!credentials || (!credentials.username || !credentials.password)) {

      reject('Bad credentials')
    } else {

      const git = initGit(projectName);
      const repo = git.then(response => {
        if (response.ok) {

          createRepo(credentials, projectName)
        }
      });
      const remote = repo.then(() => addRemote(credentials.username, projectName));

      return Promise.join(git, repo, remote,  (initResponse, repoResponse, remoteResponse) => {
      
        const response = initResponse.text + '\n' + remoteResponse.text;
        resolve(response);
      })
      .catch(error => reject(error))
    }
  });
}

