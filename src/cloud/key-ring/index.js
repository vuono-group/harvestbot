import { google } from 'googleapis';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';

import logger from '../../log';
import storage from '../storage';

export default ({ projectId, region }) => {
  const fileName = 'harvestbot-config.encrypted';
  const secretStorage = storage();

  const authorise = async () => {
    const authClient = await google.auth.getClient({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    if (authClient) {
      return google.cloudkms({
        version: 'v1',
        auth: authClient,
      });
    }
    logger.error('Unable to create cloudkms service.');
    return null;
  };

  const encryptSecret = async (plainText) => {
    const cloudkms = await authorise();
    if (cloudkms) {
      const request = {
        name: `projects/${projectId}/locations/${region}/keyRings/harvestbot-keyring/cryptoKeys/harvestbot-encryption-key`,
        resource: {
          plaintext: Buffer.from(plainText).toString('base64'),
        },
      };
      try {
        const response = await cloudkms.projects.locations.keyRings.cryptoKeys.encrypt(request);
        if (response) {
          const filePath = `${tmpdir()}/${fileName}`;
          writeFileSync(filePath, Buffer.from(response.data.ciphertext, 'base64'));
          logger.info(`Written encrypted config to file: ${filePath}`);
          secretStorage.uploadSecret(filePath);
          logger.info('Uploaded encrypted file to storage.');
          return filePath;
        }
      } catch (error) {
        logger.error(`Error in file encryption: ${error}`);
      }
    }
    return null;
  };

  return {
    encryptSecret,
    // decryptSecret
  };
};
