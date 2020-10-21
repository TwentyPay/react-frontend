'use strict'
require('colors');
import Button from '@material-ui/core/Button'

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
    const tokenHolderUNI = '0x69C5888Ecd21287FBdac5a43D1558Bf73c51E38B';
    const newArgs = {
        deployedAddress: '0x5721931aa166C5d3631a7715F9bE6BE3AE729333',
        roughSellAmount: '1',
        buyAmount: '5',
        setupRoughSellAmount: '2',
        setupBuyAmount: '100'
    }

    async function setup() {
        try {
            await getERC20Token(newArgs);
            // process.exit(0);
        } catch (err) {
            console.error(err);
            // process.exit(1);
        }
    }

    async function getERC20Token(newArgs) {
        const web3 = createWeb3()
        const contract = new web3.eth.Contract(ABI, newArgs.deployedAddress);
        console.log("0x contract assigned")

        // Checking our ETH account balance
        const [owner] = await web3.eth.getAccounts();
        console.log("owner account is " + owner)
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
        console.log(`We asked for ${newArgs.setupBuyAmount} tokens originally`)

        // Get UNI balance in contract
        const contractUNI = new web3.eth.Contract(erc20ABI, tokenAddressUNI);
        contractUNI.methods.balanceOf(newArgs.deployedAddress).call((error, balance) => {
                console.log(`Contract now has ${balance.toString()} UNI`);
        });
        console.log(`We are asking for ${newArgs.setupBuyAmount} UNI`)

        await waitForTxSuccess(contract.methods.withdrawToken(
            quote.buyTokenAddress,
            setupBuyAmountWei,
        ).send({
            from: owner,
        }));

        // Check UNI balance of our account
        contractUNI.methods.balanceOf(owner).call((error, balance) => {
                console.log(`Owner address now has ${balance.toString()} UNI`);
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
        const web3 = createWeb3()
        const contract = new web3.eth.Contract(ABI, newArgs.deployedAddress);
        console.log("0x contract assigned")

        const [owner] = await web3.eth.getAccounts();
        console.log("owner account is " + owner)

        // Convert roughSellAmount and buyAmount from token units to wei.
        const roughSellAmountWei = etherToWei(newArgs.roughSellAmount);
        const buyAmountWei = etherToWei(newArgs.buyAmount);
        console.log("roughSellAmountWei is " + roughSellAmountWei);
        console.log("buyAmountWei is " + buyAmountWei);

        // Deposit some WETH into the contract. This function accepts ETH and
        // wraps it to WETH on the fly.
        console.log(`Depositing ${newArgs.roughSellAmount} ETH (WETH) into the contract at ${newArgs.deployedAddress}...`);
        await waitForTxSuccess(contract.methods.depositETH().send({
            value: roughSellAmountWei,
            from: owner,
        }));

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

        const contractUNI = new web3.eth.Contract(erc20ABI, tokenAddressUNI);
        await waitForTxSuccess(contractUNI.methods.approve(quote.allowanceTarget, quote.sellAmount)
            .send({from: owner}));

        // Have the contract fill the quote, selling its own WETH.
        console.info(`Filling the quote through the contract at ${newArgs.deployedAddress.bold}...`);
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
        console.info(`${'✔'.bold.green} Successfully sold ${soldAmount} UNI for ${boughtAmount} DAI!`);
        console.log(`We asked for ${newArgs.buyAmount} tokens originally`)
        // console.log("Success!!!")
    }

    return (
        <div>
            <Button
                color="secondary"
                className="setup"
                onClick={setup}
            >
                Setup
            </Button>
            <Button
                className="test0x"
                onClick={awaitRun}
            >
                Test 0x
            </Button>
        </div>
    )

}

export default SwapContract;
