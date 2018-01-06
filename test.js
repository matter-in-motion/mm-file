'use strict';
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const test = require('ava');
const del = require('del');
const extension = require('./index');
const createApp = require('mm-test').createApp;
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
      path: '../{year}'
    },

    test: {
      accept: [
        'image/jpeg',
        'text/markdown'
      ],

      do: [
        { 'fs:copy': { name: 'copy', to: '{filename}_copy{_#}{ext}' } },
        { 'fs:copy': { name: 'secondcopy', to: '{filename}_copy{_#}{ext}' } }
      ]
    }
  }
});

const sendFile = function(file) {
  const form = new FormData();
  form.append('job', 'test');
  form.append('some', 'data');
  form.append('0', fs.createReadStream(file));
  form.append('test', fs.createReadStream('./README.md'));

  return new Promise((resolve, reject) => {
    form.submit({
      host: 'localhost',
      port: 3333,
      path: '/api',
      headers: { 'MM': '{"call":"file.process"}' }
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

test('checks the file parser', t => sendFile('assets/test.jpg')
  .then(res => {
    t.is(res[0], '');
    t.truthy(res[1]);
    const first = res[1][0];
    t.is(first.copy.url, '2018/test_copy.jpg');
    t.is(first.secondcopy.url, '2018/test_copy_1.jpg');
    const second = res[1][1];
    t.is(second.copy.url, '2018/readme_copy.md');
    t.is(second.secondcopy.url, '2018/readme_copy_1.md');
    t.pass();
  })
);
