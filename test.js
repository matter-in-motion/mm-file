'use strict';
const path = require('path');
const test = require('ava');
const del = require('del');
const extension = require('./index');
const { createApp, createClient, getToken } = require('mm-test');

process.env.NODE_ENV = 'production';

test.after.always(() => del([ './uploads' ]));

const app = createApp({
  extensions: [ extension ],

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
}, { auth: 'user' });

const mm = createClient();
const sendFile = (files, meta) => mm('file.process', { job: 'test' }, { files, meta })

test.skip('fails to send unauthorized request', t => sendFile([ 'assets/test.jpg' ])
  .then(() => t.fail())
  .catch(err => t.is(err.code, 4100))
);

test('fails to send too many files', t => getToken(app, { provider: 'user' })
  .then(token => sendFile([
    'assets/test.jpg',
    './readme.md',
    './LICENSE.md'
  ], token.token))
  .then(() => t.fail())
  .catch(err => t.is(err.code, 4220))
);

test('checks the file parser', t => getToken(app, { provider: 'user' })
  .then(token => sendFile([
    'assets/test.jpg',
    './readme.md'
  ], token.token))
  .then(res => {
    t.truthy(res);
    const first = res[0];
    t.is(first.copy.url, '2018/test_copy.jpg');
    t.is(first.secondcopy.url, '2018/test_secondcopy.jpg');
    const second = res[1];
    t.is(second.copy.url, '2018/readme_copy.md');
    t.is(second.secondcopy.url, '2018/readme_secondcopy.md');
  })
);
