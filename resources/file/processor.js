'use strict';
const path = require('path');
const Q = require('queueue');
const Promise = require('bluebird');
const { renderTemplate, sanitize, padNumber } = require('./util');

const Processor = function(processors, job, data) {
  this.processors = processors;
  this.job = job;
  this.data = data;

  this.error = undefined;
  this.result = [];
  this.resCounter = {};
  this.index = 0;
};

Processor.prototype.start = function(files) {
  return new Promise((resolve, reject) => {
    this.q = new Q(1)
      .on('done', (res, next) => this.done(res, next))
      .on('error', err => {
        this.error = err;
        this.q.abort();
      })
      .on('drain', () => {
        if (this.error) {
          reject(this.error);
        } else {
          resolve(this.result);
        }
      });

    files.forEach(file => this.push(file));
  });
};

Processor.prototype.push = function(file) {
  const id = file.id !== undefined ? file.id : this.index;
  const res = this.result;
  if (!res[id]) {
    res[id] = {};
    this.resCounter[id] = 0;
  }

  this.job.do.forEach(job => {
    for (const name in job) {
      const p = name.split(':');
      this._push(p[0], p[1], {
        id,
        root: this.job.root,
        src: file,
        dst: this.getDestination(job[name], file.field, file.filename, file.ext),
        data: this.data
      });
    }
  });

  this.index++;
  this.q.push({ method: cb => {
    file.cleanup();
    cb();
  } });
};

Processor.prototype._push = function(processor, method, args) {
  this.q.push({
    ctx: this.processors[processor],
    method: method,
    args: [ args ]
  });
};

Processor.prototype.done = function(result, next) {
  if (result) {
    let res = this.result[result.id][result.name || this.resCounter[result.id]] = result.data || {};

    if (result.relative) {
      res.url = result.relative.replace('\\', '/');
    }

    this.resCounter[result.id]++;
  }

  next && this.push(next);
};

Processor.prototype.getDestination = function(job, fieldname, filename, ext) {
  const fullPath = this.pathRender(job.to || this.job.to, { name: job.name }, this.data, {
    fieldname, filename, ext
  });
  //cleanup from unsecured unwanted symbols and makes path absolute
  return Object.assign({}, job, { to: path.join(this.job.root, sanitize(fullPath)) });
};

Processor.prototype.pathRender = function(string, ...args) {
  const today = new Date();
  const data = Object.assign({
    year: today.getFullYear(),
    month: padNumber(today.getMonth() + 1),
    day: padNumber(today.getDate())
  }, ...args);
  return renderTemplate(string, data);
};


module.exports = Processor;
