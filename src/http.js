import { Rxios } from 'rxios';

export default (baseURL, headers = {}) => {
  const api = new Rxios({
    baseURL,
    headers,
  });

  const getJson = url => api.get(url);
  const postJson = (url, payload) => api.post(url, payload);

  return { getJson, postJson };
};
