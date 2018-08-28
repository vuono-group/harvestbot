'use strict';

var _cli = require('./cli');

var _cli2 = _interopRequireDefault(_cli);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const config = await (0, _settings2.default)().getConfig();
  (0, _cli2.default)(config, _http2.default).start();
})();