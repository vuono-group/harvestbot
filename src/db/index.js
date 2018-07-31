import Datastore from '@google-cloud/datastore';

export default () => {
  const datastore = new Datastore({
    projectId: process.env.GCLOUD_PROJECT,
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
