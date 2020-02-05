import axios from 'axios';
import { Observable } from 'rxjs';

export default (baseURL, headers = {}) => {
  const api = axios.create({
    baseURL,
    headers,
  });

  const createObservable = (request) => new Observable((subscriber) => request
    .then((response) => {
      subscriber.next(response.data);
      subscriber.complete();
    }).catch((err) => {
      subscriber.error(err);
      subscriber.complete();
    }));

  const getJson = (url) => createObservable(api.get(url));

  const postJson = (url, payload) => createObservable(api.post(url, payload));

  return { getJson, postJson };
};
