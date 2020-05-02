const web3 = require("./ethereum")
const redis = require('./redis')
const queue = require('./queue')

/**
 * Listen to new commands from the queue
 */
async function listen_to_commands() {
  const queue_consumer = queue.consumer('eth.wallet.manager.commands', ['command'])
  // process messages
  queue_consumer.on('message', async function (topic_message) {
    try {
      const message = JSON.parse(topic_message.value)
      // create the new address with some reply metadata to match the response to the request
      const resp = await create_address(message.meta)
      // if successful then post the response to the queue
      if (resp) {
        await queue_producer.send('address.created', [resp])
      }
    } catch (err) {
      // in case something goes wrong catch the error and send it back in the 'errors' topic
      console.error(topic_message, err)
      queue_producer.send('errors', [{type: 'command', request: topic_message, error_code: err.code, error_message: err.message, error_stack: err.stack}])
    }
  })
  return queue_consumer
}

/**
 * Create a new ethereum address and return the address
 */
async function create_account(meta = {}) {
  // generate the address
  const account = await web3.eth.accounts.create()

  // disable checksum when storing the address
  const address = account.address.toLowerCase()

  // save the public address in Redis without any transactions received yet
  await redis.setAsync(`eth:address:public:${address}`, JSON.stringify({}))

  // Store the private key in a vault.
  // For demo purposes we use the same Redis instance, but this should be changed in production
  await redis.setAsync(`eth:address:private:${address}`, account.privateKey)

  return Object.assign({}, meta, {address: account.address})
}

module.exports.listen_to_commands = listen_to_commands