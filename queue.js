const kafka = require('kafka-node')
const config = require('../../config')

// configure how the consumers should connect to the broker/servers
// each consumer creates his own connecto to a broker

const default_options = {
  host: config.kafka_zookeeper_uri,
  autoCommit: true,
  fromOffset: 'earliest',
}

module.exports.consumer = (group_id = "ethereum_wallet_manager_consumer", topics = [], opts = {}) => {
  const options = Object.assign({ groupId: group_id }, default_options, opts)
  const consumer = new kafka.ConsumerGroup(options, topics)
  return consumer
}

// configure how the producer connects to the Apache Kafka broker

// initiate the connection to the kafka client
const client = new kafka.Client(config.kafka_zookeeper_uri, config.kafka_client_id)
module.exports.client = client
const producer = new kafka.Producer(client)

// add a listener to the ready event
async function on_ready(cb) {
  producer.on('ready', cb)
}

// define a method to send multiple messages to the given topic
// this will return a promise that will resolve with the response from Kafka
// messages are converted to JSON strings before they are added in the queue
async function send(topic, messages) {
  return new Promise((resolve, reject) => {
    // convert objects to JSON strings
    messages = messages.map(JSON.stringify)
    // add the messages to the given topic
    producer.send([{ topic, messages}], function (err, data) {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

// expose only these methods to the rest of the application and abstract away
// the implementation of the producer to easily change it later
module.exports.on_ready = on_ready
module.exports.send = send