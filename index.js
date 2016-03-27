const exec = require('child_process').exec;
const fetch = require('node-fetch');
const Promise = require('promise');

const username = '';
const password = '';

const url = 'https://' + username + ':' + password + '@api.github.com/user/repos';

const data = {
  'name': 'hello-world',
  'description': 'This is your first repository',
  'private': false,
  'has_issues': true,
  'has_wiki': true,
  'has_downloads': true
};

function makeRequest(data) {

  return fetch(url, {
    method: 'post',
    headers: {
      'User-Agent': 'gittohub'
    },
    body: JSON.stringify(data)
  })
  .then((res) => {

    console.log(res);
    if (res.status === 201) {
      console.log('created');
    } else if (res.status === 442) {
      console.log('something wrong with the input. maybe project already exists.');
    } else if (res.status === 401) {
      console.log('bad credentials');
    } 
  })
  .catch(error => {
    console.error(error);
  });
}

function makeDir(newDir) {

  if (!newDir) {

    process.exit();

  } else {

    return new Promise((resolve, reject) => {

      const dir = exec(`mkdir ${newDir}`, (error, stdout, stderr) => {
        if (stderr) {
          reject(stderr);
        }
        resolve({newDir});

      });
    });

  }
}

function initGit(path) {
  return new Promise((resolve, reject) => {

    const git = exec('git init', {cwd: path}, (error, stdout, stderr) => {

      if (stderr) {
        reject(stderr)
      }
      resolve(stdout)

    });
  });
}

makeDir('test').then(res => {
  
  const path = `${__dirname}/${res.newDir}`
  return initGit(path);

}).then(res => {
  console.log(res);
})
.catch(error => {
  console.log(error);
})
