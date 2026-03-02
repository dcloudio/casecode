'use strict';

const {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getUserKey,
  setUserKey,
  removeUserKey,
  getEncryptKey,
  setEncryptKey,
  removeEncryptKey,
  getTicket,
  setTicket,
  removeTicket
} = require('uni-open-bridge-common')

const {
  Command
} = require('./basic.js');

const {
  OpenBridgeConfig
} = require('./config.js')

const openBridgeConfig = new OpenBridgeConfig()

class MainFrame extends Command {

  constructor() {
    super()

    MainFrame.Commands.forEach((name) => {
      this.register(name, this[name].bind(this))
    })
  }

  async getAccessToken(parameters) {
    return await getAccessToken(parameters)
  }

  async setAccessToken(parameters) {
    return await setAccessToken(parameters, parameters.value, parameters.expiresIn)
  }

  async removeAccessToken(parameters) {
    return await removeAccessToken(parameters)
  }

  async getUserKey(parameters) {
    return await getUserKey(parameters, null)
  }

  async setUserKey(parameters) {
    return await setUserKey(parameters, parameters.value, parameters.expiresIn)
  }

  async removeUserKey(parameters) {
    return await removeUserKey(parameters)
  }

  async getTicket(parameters) {
    return await getTicket(parameters, null)
  }

  async setTicket(parameters) {
    return await setTicket(parameters, parameters.value, parameters.expiresIn)
  }

  async removeTicket(parameters) {
    return await removeTicket(parameters)
  }

  checkIP(ip) {
    return openBridgeConfig.inWhitelist(ip)
  }
}

MainFrame.Commands = [
  'getAccessToken',
  'setAccessToken',
  'removeAccessToken',
  'getUserKey',
  'setUserKey',
  'removeUserKey',
  'getTicket',
  'setTicket',
  'removeTicket'
];

const commands = new MainFrame();

module.exports = commands;
