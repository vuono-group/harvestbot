"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _rxjs = require("rxjs");

var _default = (baseURL, headers = {}) => {
  const api = _axios.default.create({
    baseURL,
    headers
  });

  const createObservable = request => new _rxjs.Observable(subscriber => request.then(response => {
    subscriber.next(response.data);
    subscriber.complete();
  }).catch(err => {
    subscriber.error(err);
    subscriber.complete();
  }));

  const getJson = url => createObservable(api.get(url));

  const postJson = (url, payload) => createObservable(api.post(url, payload));

  return {
    getJson,
    postJson
  };
};

exports.default = _default;