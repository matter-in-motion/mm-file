'use strict';
const unidecode = require('unidecode');

const rxWhiteSpace = /[\s]+/g;
const rxDots = /\.{2,}/g;
const rxRemove = /{([^}]+)}|[^_a-z0-9./\\]+/gi;
const rxFSUPattern = /^{[_a-z0-9.-]*#+[_a-z0-9.-]*}$/;

const sanitize = function(filename, limit) {
  const sanitized = unidecode(filename)
    .replace(rxWhiteSpace, '_')
    .replace(rxDots, '')
    .replace(rxRemove, match => (rxFSUPattern.test(match) ? match : ''))
    .toLowerCase();

  return sanitized.substr(0, limit || 250);
};

const render = function(string, data) {
  const re = /{([^}#_]+)}/;
  let match;
  while (match = re.exec(string)) {
    string = string.replace(match[0], data[match[1]])
  }
  return string;
};

module.exports = { sanitize, render };
