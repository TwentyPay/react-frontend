# react-frontend

Install dependencies.
```
yarn install

Serve with hot reload at http://localhost:3000.
```
yarn dev
```

Or run on other ports:
```
yarn build
yarn start --port 3001
```


Load this URL in your browser: http://localhost:3003/?&accepts=DAI:400&accepts=WETH:2.5

For the Ox integration: Just load localhost:3003 normally. Then click the "Test 0x" button. You will see the output in the developer console in your browser.

You'll need to replace the "deployedAddress" field in swap-contract.js (found in the pages folder) with the address that you got from the 0xintegration project. When the SimpleTokenSwap contract got deployed, it should have returned a "contract address" field. 
