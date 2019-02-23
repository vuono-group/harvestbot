"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pubsub = require("@google-cloud/pubsub");

var _default = config => {
  const topics = {
    flextime: 'flextime',
    stats: 'stats'
  };
  const pubsubClient = new _pubsub.PubSub({
    projectId: config.projectId
  });

  const enqueueFlexTimeRequest = data => pubsubClient.topic(topics.flextime).publish(Buffer.from(JSON.stringify(data)));

  const enqueueStatsRequest = data => pubsubClient.topic(topics.stats).publish(Buffer.from(JSON.stringify(data)));

  return {
    enqueueFlexTimeRequest,
    enqueueStatsRequest
  };
};

exports.default = _default;