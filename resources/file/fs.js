'use strict';
const fs = require('fs');
const path = require('path');
const fsu = require('fsu');

const copy = (o, cb) => {
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
      })
    });
};

const move = (o, cb) => {
  copy(o, (er, res) => {
    if (er) {
      cb(er);
    } else {
      fs.unlink(o.src.file, err => cb(err, res));
    }
  });
};

module.exports = {
  copy, move,
  delete: (o, cb) => fs.unlink(o.src.file, cb)
};
