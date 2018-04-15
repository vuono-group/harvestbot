'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rcloadenv = require('@google-cloud/rcloadenv');

var _rcloadenv2 = _interopRequireDefault(_rcloadenv);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = () => {
  const applyConfig = () => _rcloadenv2.default.getAndApply('harvestbot-config').then(() => {}).catch(err => {
    _log2.default.error(err);
  });

  return { applyConfig };
};