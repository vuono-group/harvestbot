'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rxjs = require('rxjs');

require('rxjs/add/operator/mergeMap');

// import logger from './log';

exports.default = (config, http, responseUrl) => {
  const api = http('https://slack.com/api', {});

  const getUserEmailForId = userId => api.getJson(`/users.info?user=${userId}&token=${config.slackBotToken}`).mergeMap(({ user: { profile: { email } } }) => _rxjs.Observable.of(email)).toPromise();

  const postResponse = (messageArray, message = Array.isArray(messageArray) ? messageArray.join('\n') : messageArray) => api.postJson(responseUrl, { text: message }).toPromise();

  return { getUserEmailForId, postResponse };
};