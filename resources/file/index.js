'use strict';
const fs = require('./fs');
const api = require('./api');
const Controller = require('./controller');

module.exports = () => ({
  api,
  controller: new Controller(),
  processors: {
    __extend: true,
    fs
  }
});
