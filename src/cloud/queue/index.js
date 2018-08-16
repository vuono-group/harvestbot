import PubSub from '@google-cloud/pubsub';

export default (config) => {
  const topicName = 'flextime';
  const pubsubClient = new PubSub({
    projectId: config.projectId,
  });

  const enqueue = data => pubsubClient
    .topic(topicName).publisher().publish(Buffer.from(JSON.stringify(data)));

  return { enqueue };
};
