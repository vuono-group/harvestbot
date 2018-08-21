import Storage from '@google-cloud/storage';

export default () => {
  const secretsBucketName = 'harvestbot-secret-storage';
  const storage = new Storage();

  const uploadSecret = filePath => storage.bucket(secretsBucketName).upload(filePath);

  const downloadSecret = () => {};

  return {
    uploadSecret,
    downloadSecret,
  };
};
