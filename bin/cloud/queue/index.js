"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pubsub = _interopRequireDefault(require("@google-cloud/pubsub"));

var _default = config => {
  const topics = {
    flextime: 'flextime',
    stats: 'stats'
  };
  const pubsubClient = new _pubsub.default({
    projectId: config.projectId
  });

  const enqueueFlexTimeRequest = data => pubsubClient.topic(topics.flextime).publisher().publish(Buffer.from(JSON.stringify(data)));

  const enqueueStatsRequest = data => pubsubClient.topic(topics.stats).publisher().publish(Buffer.from(JSON.stringify(data)));

  return {
    enqueueFlexTimeRequest,
    enqueueStatsRequest
  };
};

exports.default = _default;