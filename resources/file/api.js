'use strict';
const errors = require('mm-errors');

module.exports = {
  __expose: true,

  process: function() {
    return {
      auth: {
        provider: 'user',
        required: true
      },
      title: 'File',
      description: 'Processes various types of files',
      raw: true,
      request: this.getRequestSchema(),
      response: this.getResponseSchema(),

      call: (req, auth) => this.parse(req)
        .then(data => this.validate(auth, data.job, data.fields, data.files))
        .then(data => this.process(auth, data.job, data.fields, data.files))
        .catch(errors.ifError('BadRequest'))
    }
  }
};
