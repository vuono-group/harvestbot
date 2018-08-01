import { Observable } from 'rxjs';
import 'rxjs/add/operator/mergeMap';

// import logger from './log';

export default (config, http, responseUrl) => {
  const api = http(
    'https://slack.com/api',
    {},
  );

  const getUserEmailForId = userId =>
    api.getJson(`/users.info?user=${userId}&token=${config.slackBotToken}`)
      .mergeMap(({ user: { profile: { email } } }) => Observable.of(email))
      .toPromise();

  const postResponse = (messageArray, message = Array.isArray(messageArray) ? messageArray.join('\n') : messageArray) =>
    api.postJson(responseUrl, { text: message }).toPromise();

  return { getUserEmailForId, postResponse };
};
