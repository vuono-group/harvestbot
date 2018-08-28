import cli from './cli';
import http from './http';

import settings from './settings';

(async () => {
  const config = await settings().getConfig();
  cli(config, http).start();
})();
