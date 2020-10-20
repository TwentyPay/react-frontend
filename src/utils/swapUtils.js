'use strict'
const HDWalletProvider = require('@truffle/hdwallet-provider');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');

const API_QUOTE_URL = 'https://api.0x.org/swap/v1/quote';
const MNEMONIC = 'walnut mutual phone police nut tribe cross coast donate early urban target';
const RPC_URL = 'http://localhost:7545';

function createQueryString(params) {
    return Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
}

// Wait for a web3 tx `send()` call to be mined and return the receipt.
function waitForTxSuccess(tx) {
    return new Promise((accept, reject) => {
        try {
            tx.on('error', err => reject(err));
            tx.on('receipt', receipt => accept(receipt));
        } catch (err) {
            reject(err);
        }
    });
}

function createProvider() {
    console.info('MNEMONIC is ' + MNEMONIC)
    console.info('RPC_URL is ' + RPC_URL)
    const provider = /^ws?:\/\//.test(RPC_URL)
        ? new Web3.providers.WebsocketProvider(RPC_URL)
        : new Web3.providers.HttpProvider(RPC_URL);
    console.log("provider is " + provider)
    if (!MNEMONIC) {
        return provider;
    }
    return new HDWalletProvider({ mnemonic: MNEMONIC, providerOrUrl: provider });
}

function createWeb3() {
    return new Web3(createProvider());
}

function etherToWei(etherAmount) {
    return new BigNumber(etherAmount)
        .times('1e18')
        .integerValue()
        .toString(10);
}

function weiToEther(weiAmount) {
    return new BigNumber(weiAmount)
        .div('1e18')
        .toString(10);
}

module.exports = {
    etherToWei,
    weiToEther,
    createWeb3,
    createQueryString,
    waitForTxSuccess,
    createProvider,
};
