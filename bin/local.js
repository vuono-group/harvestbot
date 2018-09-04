"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _cli = _interopRequireDefault(require("./cli"));

var _http = _interopRequireDefault(require("./http"));

var _settings = _interopRequireDefault(require("./settings"));

(async () => {
  const config = await (0, _settings.default)().getConfig();
  (0, _cli.default)(config, _http.default).start();
})();