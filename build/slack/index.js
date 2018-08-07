'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rxjs = require('rxjs');

require('rxjs/add/operator/mergeMap');

// import logger from './log';

exports.default = (config, http, responseUrl) => {
  const api = http('https://slack.com/api', {
    Authorization: `Bearer ${config.slackBotToken}`
  });

  const getUserEmailForId = userId => api.getJson(`/users.info?user=${userId}&token=${config.slackBotToken}`).mergeMap(({ user: { profile: { email } } }) => _rxjs.Observable.of(email)).toPromise();

  const postResponse = (header, messageArray) => api.postJson(responseUrl, { text: header, attachments: messageArray ? [{ text: messageArray.join('\n') }] : [] }).toPromise();

  const postToChannel = (imId, userId, { header, messages }) => api.postJson('/chat.postEphemeral', {
    channel: imId, text: header, attachments: [{ text: messages.join('\n') }], as_user: false, user: userId
  }).toPromise();

  const postMessage = (userId, { header, messages }) => responseUrl ? postResponse(header, messages) : postToChannel(config.notifyChannelId, userId, { header, messages });

  return {
    getUserEmailForId, postMessage
  };
};