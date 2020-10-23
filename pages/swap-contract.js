'use strict'
require('colors');
import Button from '@material-ui/core/Button';
import React, { useEffect } from 'react';

function SwapContract() {
    const fetch = require('node-fetch');
    const process = require('process');
    const { createWeb3, createQueryString, etherToWei, waitForTxSuccess, weiToEther } = require('../src/utils/swapUtils.js');

    const PROXY_URL = '';
    const API_QUOTE_URL = 'https://api.0x.org/swap/v1/quote';
    // Need to hardcode this abi file in the frontend after contract changes
    const { abi: ABI } = require('../src/abi.json');
    const erc20ABI = require('../src/erc20ABI.json');
    const tokenAddressUNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
    const tokenAddressDAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const tokenHolderUNI = '0x69C5888Ecd21287FBdac5a43D1558Bf73c51E38B';
    const newArgs = {
        deployedAddress: '0x5721931aa166C5d3631a7715F9bE6BE3AE729333',
        roughSellAmount: '1.67',
        buyAmount: '5',
        setupRoughSellAmount: '2',
        setupBuyAmount: '100'
    }
    const Web3 = require('web3');
    var owner = 'owner not set';
    var merchant = '0xe083437A8FD52A9A4B6B3CAbec0279Db5dAD8043';
    var ethereum = undefined;
    var web3 = undefined;
    var contract = undefined;
    var contractUNI = undefined;

    useEffect(() => {
        console.log("Loading web3 and MetaMask")
        ethereum = window.ethereum;
        console.log('ethereum is ' + ethereum);
        web3 = new Web3(ethereum);
        console.log('web3 is ' + web3);
        getMetaMaskAccount()
        window.addEventListener('load', async () => {
          try {
            ethereum.on('accountsChanged', async function (accounts) {
              console.log("Account was changed!");
              owner = accounts[0];
            });
            } catch {
                console.log("User denied account access");
            }
        });

        // initialize our 0x smart contract
        contract = new web3.eth.Contract(ABI, newArgs.deployedAddress);
        console.log("0x contract assigned");

        // initialize UNI contract for permissioning
        contractUNI = new web3.eth.Contract(erc20ABI, tokenAddressUNI);

    });

    async function setup() {
        try {
            await getERC20Token(newArgs);
            // process.exit(0);
        } catch (err) {
            console.error(err);
            // process.exit(1);
        }
    }

    async function getMetaMaskAccount() {
        if (web3) {
          console.log('Web3 is enabled');
          await ethereum.enable();
          await web3.eth.getAccounts((err, res) => {
            if (err) {
              console.log('getAccounts callback error: ', err);
            } else {
              const accounts = res;
              console.log('is accounts defined? ', accounts);
              console.log('accounts[0] in getAccounts is ' + accounts[0]);
              owner = accounts[0];
              console.log('owner is now: ', owner);
            }
          })
      } else {
          console.log("no web3 detected in getMetaMaskAccount function");
      }
    }

    async function getERC20Token(newArgs) {

        // Checking our ETH account balance
        // const [owner] = await web3.eth.getAccounts();
        // console.log("owner account is " + owner)
        let ownerBal = weiToEther(parseInt(await web3.eth.getBalance(owner)));
        console.log("owner ETH account balance is " + ownerBal)

        // Convert setupRoughSellAmount and setupBuyAmount from token units to wei.
        const setupRoughSellAmountWei = etherToWei(newArgs.setupRoughSellAmount);
        const setupBuyAmountWei = etherToWei(newArgs.setupBuyAmount);
        console.log("setupRoughSellAmountWei is " + setupRoughSellAmountWei);
        console.log("setupBuyAmountWei is " + setupBuyAmountWei);

        // Deposit some WETH into the contract. This function accepts ETH and
        // wraps it to WETH on the fly.
        console.log(`Depositing ${newArgs.setupRoughSellAmount} ETH (WETH) into the contract at ${newArgs.deployedAddress}...`);
        await waitForTxSuccess(contract.methods.depositETH().send({
            value: setupRoughSellAmountWei,
            from: owner,
        }));

        // Get a quote from 0x-API to sell the WETH we just deposited into the contract.
        console.log(`Fetching swap quote from 0x-API to buy ${newArgs.setupBuyAmount} UNI for WETH...`);
        const qs = createQueryString({
            sellToken: 'WETH',
            buyToken: 'UNI',
            buyAmount: setupBuyAmountWei,
        });
        const quoteUrl = `${PROXY_URL + API_QUOTE_URL}?${qs}`;
        console.info(`Fetching quote ${quoteUrl}...`);
        const response = await fetch(quoteUrl);
        const quote = await response.json();
        console.info(`Received a quote with price ${quote.price}`);

        // Have the contract fill the quote, selling its own WETH.
        console.info(`Filling the quote through the contract at ${newArgs.deployedAddress}...`);
        const receipt = await waitForTxSuccess(contract.methods.fillQuote(
                quote.sellTokenAddress,
                quote.buyTokenAddress,
                quote.allowanceTarget,
                quote.to,
                quote.data,
            ).send({
                from: owner,
                value: quote.value,
                gasPrice: quote.gasPrice,
            }));
        // console.log('receipt is ' + JSON.stringify(receipt.events))
        const boughtAmount = weiToEther(receipt.events.SwappedTokens.returnValues.boughtAmount);
        const soldAmount = weiToEther(receipt.events.SwappedTokens.returnValues.soldAmount);
        console.info(`${'✔'.bold.green} Successfully sold ${soldAmount} WETH for ${boughtAmount} UNI!`);
        console.log(`We asked for ${newArgs.setupBuyAmount} tokens originally`);

        // Get UNI balance in contract
        contractUNI.methods.balanceOf(newArgs.deployedAddress).call((error, balance) => {
                console.log(`Contract now has ${weiToEther(balance.toString())} UNI`);
        });
        console.log(`We are asking for ${newArgs.setupBuyAmount} UNI`);

        await waitForTxSuccess(contract.methods.withdrawToken(
            quote.buyTokenAddress,
            setupBuyAmountWei,
        ).send({
            from: owner,
        }));

        // Check UNI balance of our account
        contractUNI.methods.balanceOf(owner).call((error, balance) => {
                console.log(`Owner address now has ${weiToEther(balance.toString())} UNI`);
        });
    }

    async function awaitRun() {
        try {
            await run(newArgs);
            // process.exit(0);
        } catch (err) {
            console.error(err);
            // process.exit(1);
        }
    }

    async function run(newArgs) {
        // const web3 = createWeb3()
        // const contract = new web3.eth.Contract(ABI, newArgs.deployedAddress);

        // const [owner, merchant] = await web3.eth.getAccounts();
        // console.log("owner account is " + owner);
        // console.log("merchant account is " + merchant);

        // Convert roughSellAmount and buyAmount from token units to wei.
        const roughSellAmountWei = etherToWei(newArgs.roughSellAmount);
        const buyAmountWei = etherToWei(newArgs.buyAmount);
        console.log("roughSellAmountWei is " + roughSellAmountWei);
        console.log("buyAmountWei is " + buyAmountWei);

        const contractUNI = new web3.eth.Contract(erc20ABI, tokenAddressUNI);
        await waitForTxSuccess(contractUNI.methods.approve(newArgs.deployedAddress, roughSellAmountWei)
            .send({from: owner}));

        // Deposit some WETH into the contract. This function accepts ETH and
        // wraps it to WETH on the fly.
        console.log(`Depositing ${newArgs.roughSellAmount} UNI into the contract at ${newArgs.deployedAddress}...`);
        await waitForTxSuccess(contract.methods.depositToken(
            tokenAddressUNI,
            roughSellAmountWei,
        ).send({
            from: owner,
        }));

        // Check DAI balance of merchant account
        const contractDAI = new web3.eth.Contract(erc20ABI, tokenAddressDAI);
        contractDAI.methods.balanceOf(merchant).call((error, balance) => {
                console.log(`Merchant address before swap has ${balance.toString()} DAI`);
        });

        // Get a quote from 0x-API to sell the UNI we just deposited into the contract.
        console.log(`Fetching swap quote from 0x-API to buy ${newArgs.buyAmount} DAI for UNI...`);
        const qs = createQueryString({
            sellToken: 'UNI',
            buyToken: 'DAI',
            buyAmount: buyAmountWei,
        });
        const quoteUrl = `${PROXY_URL + API_QUOTE_URL}?${qs}`;
        console.info(`Fetching quote ${quoteUrl.bold}...`);
        const response = await fetch(quoteUrl);
        const quote = await response.json();
        console.info(`Received a quote with price ${quote.price}`);

        //placholder for old allowance code

        // Have the contract fill the quote, selling its own WETH.
        console.info(`Filling the quote through the contract at ${newArgs.deployedAddress.bold}...`);
        const receipt = await waitForTxSuccess(contract.methods.fillMerchantQuote(
                quote.sellTokenAddress,
                quote.buyTokenAddress,
                quote.allowanceTarget,
                quote.to,
                quote.data,
            ).send({
                from: owner,
                value: quote.value,
                gasPrice: quote.gasPrice,
            }));
        // console.log('receipt is ' + JSON.stringify(receipt.events))
        const boughtAmount = weiToEther(receipt.events.SwappedTokens.returnValues.boughtAmount);
        const soldAmount = weiToEther(receipt.events.SwappedTokens.returnValues.soldAmount);
        console.info(`${'✔'.bold.green} Successfully sold ${soldAmount} UNI for ${boughtAmount} DAI!`);
        console.log(`We asked for ${newArgs.buyAmount} tokens originally`);
        // console.log("Success!!!")

        // Get DAI balance in contract
        contractDAI.methods.balanceOf(newArgs.deployedAddress).call((error, balance) => {
                console.log(`Contract now has ${weiToEther(balance.toString())} DAI`);
        });

        // await waitForTxSuccess(contract.methods.withdrawToken(
        //     quote.buyTokenAddress,
        //     buyAmountWei,
        // ).send({
        //     from: merchant,
        // }));

        // Check DAI balance of our account
        contractDAI.methods.balanceOf(merchant).call((error, balance) => {
                console.log(`Merchant address now has ${weiToEther(balance.toString())} DAI`);
        });
    }

    return (
        <div>
            <Button
                color="secondary"
                className="test0x"
                onClick={awaitRun}
                style={{ width:250 }}
            >
                Complete Purchase
            </Button>
            <Button
                className="setup"
                onClick={setup}
            >

            </Button>
        </div>
    )

}

export default SwapContract;
