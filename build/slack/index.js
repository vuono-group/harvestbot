'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('rxjs/add/operator/mergeMap');

// import logger from './log';

exports.default = http => {
  const api = http('https://slack.com/api', {});

  const getUserEmailForId = userId => api.getJson(`/users.info?user=${userId}&token=${process.env.SLACK_BOT_TOKEN}`).mergeMap(({ user: { profile: { email } } }) => email).toPromise();

  return { getUserEmailForId };
};