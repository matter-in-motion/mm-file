'use strict';
const os = require('os');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const Promise = require('bluebird');
const errors = require('mm-errors');
const Busboy = require('busboy');
const Processor = require('./processor');

const Controller = function() {
  this.jobs = {};
  this.tmpdir = os.tmpdir();
};

Controller.prototype.__init = function(units) {
  const settings = units.require('core.settings').require('file');
  this.processors = units.require('processors');

  const defaults = Object.assign({ limit: 1 }, settings.defaults);
  for (let name in settings) {
    if (name === 'defaults') {
      continue;
    }

    this.jobs[name] = Object.assign({}, defaults, settings[name]);
  }
};

Controller.prototype.parse = function(req) {
  return new Promise((resolve, reject) => {
    let parser
    try {
      parser = new Busboy({ headers: req.headers, limits: this.limits });
    } catch (e) {
      reject(errors.UnsupportedMedia(e));
    }

    const result = {
      fields: {},
      files: []
    };

    let job;
    let counter = 0;

    parser
      .on('field', (name, val) => {
        if (name === 'job') {
          result.job = val;
          job = this.jobs[val];
        } else {
          result.fields[name] = val;
        }
      })
      .on('file', (field, file, filename, encoding, mime) => {
        if (!job || !job.accept) {
          reject(errors.NotFound(null, 'Job not found'));
          return req.resume();
        }

        if (!job.accept.includes(mime)) {
          reject(errors.UnsupportedMedia(null, `The '${result.job}' job does not accept '${mime}'`));
          return req.resume();
        }

        counter++;
        if (counter > job.limit) {
          reject(errors.RequestTooLarge(null, 'File limit exceeded'));
          return req.resume();
        }

        filename = this.parseFilename(filename);
        this.saveTmpFile(file, (err, file, cleanup) => {
          if (err) {
            reject(err);
            return req.resume();
          }

          result.files.push({
            field, file, mime, cleanup,
            filename: filename.name,
            ext: filename.ext
          });
        });
      })
      .on('finish', () => resolve(result));

    req.pipe(parser);
  });
};

Controller.prototype.saveTmpFile = function(file, cb) {
  tmp.file((err, path, fd, cleanupCallback) => {
    if (err) {
      return cb(err);
    }

    file
      .on('end', () => cb(null, path, cleanupCallback))
      .pipe(fs.createWriteStream(null, { fd }))
      .on('error', err => cb(err));
  });
};

Controller.prototype.validate = function(auth, job, fields, files) {
  return { job, fields, files };
};

Controller.prototype.process = function(auth, job, data, files) {
  return new Processor(this.processors, this.jobs[job], data)
    .start(files);
};

Controller.prototype.parseFilename = function(filename) {
  const parts = path.parse(filename);
  return {
    name: parts.name,
    ext: parts.ext
  }
};

Controller.prototype.getRequestSchema = function() {
  return {
    type: 'object'
  };
};

Controller.prototype.getResponseSchema = function() {
  return {
    type: 'object'
  };
};

module.exports = Controller;
