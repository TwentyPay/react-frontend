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
    const newArgs = {
        deployedAddress: '0x5721931aa166C5d3631a7715F9bE6BE3AE729333',
        sellAmount: '0.1'
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
        const web3 = createWeb3();
        console.log("web3 instance created and the sellAmount is " + newArgs.sellAmount)
        const contract = new web3.eth.Contract(ABI, newArgs.deployedAddress);
        console.log("contract assigned!!")
        const [owner] = await web3.eth.getAccounts();
        console.log("accounts retrieved and assigned to owner!")

        // Convert sellAmount from token units to wei.
        const sellAmountWei = etherToWei(newArgs.sellAmount);
        console.log("sellAmountWei assigned")

        // Deposit some WETH into the contract. This function accepts ETH and
        // wraps it to WETH on the fly.
        console.log(`Depositing ${newArgs.sellAmount} ETH (WETH) into the contract at ${newArgs.deployedAddress}...`);
        await waitForTxSuccess(contract.methods.depositETH().send({
            value: sellAmountWei,
            from: owner,
        }));

        // Get a quote from 0x-API to sell the WETH we just deposited into the contract.
        console.log(`Fetching swap quote from 0x-API to sell ${newArgs.sellAmount} WETH for DAI...`);
        const qs = createQueryString({
            sellToken: 'WETH',
            buyToken: 'DAI',
            sellAmount: sellAmountWei,
        });
        const quoteUrl = `${PROXY_URL + API_QUOTE_URL}?${qs}`;
        console.info(`Fetching quote ${quoteUrl.bold}...`);
        const response = await fetch(quoteUrl);
        const quote = await response.json();
        console.info(`Received a quote with price ${quote.price}`);

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
        const boughtAmount = weiToEther(receipt.events.BoughtTokens.returnValues.boughtAmount);
        console.info(`${'✔'.bold.green} Successfully sold ${newArgs.sellAmount.toString().bold} WETH for ${boughtAmount.bold.green} DAI!`);
        // The contract now has `boughtAmount` of DAI!
    }

    return (
        <Button
            color="secondary"
            className="test0x"
            onClick={awaitRun}
        >
            Test 0x
        </Button>
    )

}

export default SwapContract;
