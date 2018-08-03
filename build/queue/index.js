'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pubsub = require('@google-cloud/pubsub');

var _pubsub2 = _interopRequireDefault(_pubsub);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = config => {
  const topicName = 'flextime';
  const pubsubClient = new _pubsub2.default({
    projectId: config.projectId
  });

  const enqueue = data => pubsubClient.topic(topicName).publisher().publish(Buffer.from(JSON.stringify(data)));

  return { enqueue };
};