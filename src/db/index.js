import Datastore from '@google-cloud/datastore';

export default (config) => {
  const userKind = 'user';
  const datastore = new Datastore({
    projectId: config.projectId,
  });

  const storeUserData = (id, email) =>
    datastore.save({
      key: datastore.key([userKind, id]),
      data: {
        id,
        email,
      },
    });

  const fetchUserIds = new Promise(resolve =>
    datastore.runQuery(datastore.createQuery(userKind)).then(res =>
      resolve(res[0].map(({ id }) => id))));

  return { storeUserData, fetchUserIds };
};
