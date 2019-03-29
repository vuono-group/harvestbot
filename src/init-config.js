/* eslint-disable import/no-extraneous-dependencies */
import configuration from 'config';
/* eslint-enable import/no-extraneous-dependencies */

import encrypter from './cloud/key-ring';

const config = {
  inGoogleCloud: false,
  projectId: process.env.GCLOUD_PROJECT,
  region: process.env.FUNCTION_REGION,
};

const { encryptSecret } = encrypter(config);

// This utility is used the first time configuration is created to cloud
encryptSecret(JSON.stringify(configuration));
