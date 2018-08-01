import Datastore from '@google-cloud/datastore';

export default (config) => {
  const datastore = new Datastore({
    projectId: config.projectId,
  });

  const storeUserData = (id, email) => {
    datastore.save({
      key: datastore.key('user'),
      data: {
        id,
        email,
      },
    });
  };

  return { storeUserData };
};
