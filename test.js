'use strict';
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const test = require('ava');
const del = require('del');
const extension = require('./index');
const { createApp, getToken } = require('mm-test');
const getRawBody = require('raw-body');

process.env.NODE_ENV = 'production';

test.after.always(() => del([ './uploads' ]));

const app = createApp({
  extensions: [
    'http',
    extension
  ],

  http: {
    port: 3333
  },

  file: {
    defaults: {
      root: path.join(__dirname, 'uploads'),
      path: '{year}',
      limit: 2
    },

    test: {
      accept: [
        'image/jpeg',
        'text/markdown'
      ],

      to: '{filename}_{name}{_#}{ext}',
      do: [
        { 'fs:copy': { name: 'copy' } },
        { 'fs:copy': { name: 'secondcopy' } }
      ]
    }
  }
});

const sendFile = function(files, opts = {}) {
  const form = new FormData();
  form.append('job', 'test');
  form.append('some', 'data');

  for (const i in files) {
    form.append(i, fs.createReadStream(files[i]));
  }

  const headers = { 'MM': '{"call":"file.process"}' };
  if (opts.auth) {
    headers.Authorization = 'Bearer ' + opts.auth;
  }

  return new Promise((resolve, reject) => {
    form.submit({
      host: 'localhost',
      port: 3333,
      path: '/api',
      headers
    }, (err, res) => {
      if (err) {
        return reject(err);
      }

      const status = res.statusCode;
      if (status >= 400) {
        return reject({
          status: res.statusCode,
          message: res.statusMessage
        });
      }

      getRawBody(res, (err, string) => {
        if (err) {
          return reject(err);
        }

        return resolve(JSON.parse(string));
      });
    });
  });
}

test('fails to send unauthorized request', t => sendFile([ 'assets/test.jpg' ])
  .then(res => {
    const err = res[0];
    t.is(err.code, 4100);
    t.falsy(res[1]);
  })
);

test('fails to send too many files', t => getToken(app)
  .then(token => sendFile([
    'assets/test.jpg',
    './readme.md',
    './LICENSE.md'
  ], { auth: token.token }))
  .then(res => {
    const err = res[0];
    t.is(err.code, 4220);
    t.falsy(res[1]);
  })
);

test('checks the file parser', t => getToken(app)
  .then(token => sendFile([
    'assets/test.jpg',
    './readme.md'
  ], { auth: token.token }))
  .then(res => {
    t.is(res[0], '');
    t.truthy(res[1]);
    const first = res[1][0];
    t.is(first.copy.url, '2018/test_copy.jpg');
    t.is(first.secondcopy.url, '2018/test_secondcopy.jpg');
    const second = res[1][1];
    t.is(second.copy.url, '2018/readme_copy.md');
    t.is(second.secondcopy.url, '2018/readme_secondcopy.md');
    t.pass();
  })
);
