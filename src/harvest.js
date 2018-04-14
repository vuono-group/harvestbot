import http from './http';

const api = http(
  'https://api.harvestapp.com/v2/',
  {
    Authorization: `Bearer ${process.env.HARVEST_ACCESS_TOKEN}`,
    'Harvest-Account-Id': process.env.HARVEST_ACCOUNT_ID,
  },
);

export default () => {
  const getUsers = async () => {
    const data = await api.getJson('/users');
    return data.users.map(({ email }) => ({ email }));
  };

  return { getUsers };
};
