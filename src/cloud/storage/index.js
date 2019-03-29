import { Storage } from '@google-cloud/storage';
import log from '../../log';

export default ({ projectId, ...config }) => {
  const secretsBucketName = `${projectId}-secret-storage`;
  const storage = new Storage();
  const logger = log(config);

  const uploadSecret = (filePath) => {
    logger.info(`Uploading configuration to ${secretsBucketName}`);
    return storage.bucket(secretsBucketName).upload(filePath);
  };

  const downloadSecret = (fileName, destinationPath) => storage
    .bucket(secretsBucketName)
    .file(fileName)
    .download({
      destination: destinationPath,
    });

  return {
    uploadSecret,
    downloadSecret,
  };
};
