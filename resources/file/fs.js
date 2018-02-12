'use strict';
const fs = require('fs');
const path = require('path');
const fsu = require('fsu');

const copy = function(o, cb) {
  const dst = o.dst.to;
  fs.createReadStream(o.src.file)
    .on('error', cb)
    .pipe(fsu.createWriteStreamUnique(dst, { force: true }))
    .on('error', cb)
    .on('finish', function() {
      cb(null, {
        id: o.id,
        name: o.dst.name,
        absolute: this.path,
        relative: path.relative(o.root, this.path)
      });
    });
};

const move = function(o, cb) {
  copy(o, function(er, res) {
    if (er) {
      cb(er);
    } else {
      fs.unlink(o.src.file, function(err) {
        cb(err, res);
      });
    }
  });
};

module.exports = {
  copy, move,
  delete: function(o, cb) {
    fs.unlink(o.src.file, cb);
  }
};
