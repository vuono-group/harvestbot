"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rxios = require("rxios");

var _default = (baseURL, headers = {}) => {
  const api = new _rxios.Rxios({
    baseURL,
    headers
  });

  const getJson = url => api.get(url);

  const postJson = (url, payload) => api.post(url, payload);

  return {
    getJson,
    postJson
  };
};

exports.default = _default;