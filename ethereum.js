const config = require('../../config')
const Web3 = require('web3')
module.exports = new Web3(config.uri)