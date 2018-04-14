import { create } from 'axios';

export default (baseURL, headers = {}) => {
  const api = create({
    baseURL,
    headers,
  });

  const getJson = async (url) => {
    const response = await api.get(url);
    return response.data;
  };

  return { getJson };
};
