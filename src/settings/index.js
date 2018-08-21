import logger from '../log';
import { DEFAULT_COLUMN_HEADERS } from './defaults';
import decrypter from '../cloud/key-ring';

export default () => {
  const getEnvParam = param => (process.env[param]
    ? process.env[param]
    : logger.error(`Environment variable ${param} missing.`));
  const baseConfig = {
    projectId: getEnvParam('GCLOUD_PROJECT'),
    region: getEnvParam('FUNCTION_REGION'),
  };
  const { decryptSecret } = decrypter(baseConfig);

  const getConfig = async () => {
    const secretConfigString = await decryptSecret();
    const secretConfig = JSON.parse(secretConfigString);
    return {
      ...baseConfig,
      ...secretConfig,
      ignoreTaskIds: secretConfig.ignoreTaskIds
        ? secretConfig.ignoreTaskIds.split(',').map(id => parseInt(id, 10))
        : [],
      emailDomains: secretConfig.emailDomains
        ? secretConfig.emailDomains.split(',')
        : [],
      statsColumnHeaders: secretConfig.statsColumnHeaders
        ? secretConfig.statsColumnHeaders.split(',')
        : DEFAULT_COLUMN_HEADERS,
      taskIds: {
        publicHoliday: parseInt(secretConfig.taskIds.publicHoliday, 10),
        vacation: parseInt(secretConfig.taskIds.vacation, 10),
        unpaidLeave: parseInt(secretConfig.taskIds.unpaidLeave, 10),
        sickLeave: parseInt(secretConfig.taskIds.sickLeave, 10),
        flexLeave: parseInt(secretConfig.taskIds.flexLeave, 10),
      },
      currentTime: new Date().getTime() / 1000,
    };
  };

  return {
    getConfig,
  };
};
