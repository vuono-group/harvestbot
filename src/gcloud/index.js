import rcloadenv from '@google-cloud/rcloadenv';

import logger from '../log';

export default () => {
  const applyConfig = () =>
    rcloadenv.getAndApply('harvestbot-config')
      .then(() => {})
      .catch((err) => {
        logger.error(err);
      });

  return { applyConfig };
};
