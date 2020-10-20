import React, { useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Fab from '@material-ui/core/Fab'
import AddIcon from '@material-ui/icons/Add'
import RemoveIcon from '@material-ui/icons/Remove'
import Typography from '@material-ui/core/Typography'
import { connect } from 'react-redux'
import { increment, decrement } from '../src/actions'
import SwapContract from './swap-contract.js'

import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Box from '@material-ui/core/Box'
import Grid from '@material-ui/core/Grid'
import Container from '@material-ui/core/Container'
import Autocomplete from '@material-ui/lab/Autocomplete'

import { useRouter } from 'next/router'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: 14
  }
})

function _isNumericString(s) {
    return parseFloat(s) == s // XXX quickie
}

// pass in whole query object where .accepts is one member.
// returns [] on error.
// returns [{code: 'WETH', amount: 1.5}, {code: 'USDC', amount: 420.1}, ...]
function _validateTokensMerchantAccepts(query) {
  if (typeof query.accepts === 'undefined') {
    console.log('missing accepts')
    return []
  }

  if (query.accepts.filter(s => s.indexOf(':') == -1).length > 0) {
    console.log('token:amount missing the :')
    return []
  }

  let tokens = query.accepts.map(x => x.split(':'))
  if (tokens.filter(x => ! _isNumericString(x[1])).length > 0) {
    console.log(':amount was not numeric enough')
    return []
  }
  tokens = tokens.map(t => ({ code: t[0], amount: parseFloat(t[1]) }))
  return tokens
}

const Index = (props) => {
  const {
    counter,
    increment,
    decrement
  } = props

  const router = useRouter()

  const Web3 = require('web3');
  var ethereum, web3; /* XXX */
  const [address, setAddress] = useState('Not set');
  const receiver = '0x8afB142655d14b2840489Aa512e798FC9deeFBC0';
  const [senderBal, setSenderBal] = useState('');
  const [receiverBal, setReceiverBal] = useState('');

  const classes = useStyles()
  const tokenOptions = [ { code: 'DAI' }, { code: 'UNI' }, { code: 'WETH' } ]
  const merchantAccepts = _validateTokensMerchantAccepts(router.query)

  const [chosenMerchantToken, setChosenMerchantToken] = useState('DAI')
  const [chosenMerchantTokenAmount, setChosenMerchantTokenAmount] = useState(0)

  const componentDidMount = () => {
    ethereum = window.ethereum; /* XXX */
    web3 = new Web3(ethereum);
    window.addEventListener('load', async () => {
      try {
        ethereum.on('accountsChanged', async function (accounts) {
          console.log("Account was changed!");
          setAddress(accounts[0]);
          setSenderBal(await web3.eth.getBalance(accounts[0]));
          setReceiverBal(await web3.eth.getBalance(receiver));
        });

        // wrote this code in a reagular react app and was able to get the list of accepted 0x API tokens in console
        // Was unable to get this to show the list in this file, not sure how the index file is used
        // let usableTokens = []
        // const defaultOption = usableTokens[0];
        // var url = 'https://api.0x.org/swap/v1/tokens'
        // fetch(url).then((response) => response.json())
        //           .then(function(data) {
        //             data.records.forEach(element => {
        //               usableTokens.push(element.symbol)
        //             })
        //           console.log(usableTokens)})
        //           .catch((error) => console.log(error));

      } catch {
        console.log("User denied account access");
      }
    });
  }

  async function getAccount() {
    /* XXX */
    if (typeof web3 === 'undefined') {
      ethereum = window.ethereum;
      web3 = new Web3(ethereum);
    }
    if (web3) {
      console.log('Web3 is enabled')
      await ethereum.enable()
      web3.eth.getAccounts((err, res) => {
        if (err) {
          console.log('getAccounts callback error: ', err);
        } else {
          const accounts = res;
          console.log('is accounts defiined? ', accounts);
          console.log('accounts[0] in getAccounts is ' + accounts[0])
          if (typeof setAddress !== 'undefined') {
            setAddress(accounts[0]);
            console.log('address is now: ', address);
            setSenderBal(web3.eth.getBalance(accounts[0]));
            setReceiverBal(web3.eth.getBalance(receiver));
          }
        }
      })
    }
  }
  function sendETH() {
      web3.eth.sendTransaction({
        from: address,
        to: receiver,
        value: web3.utils.toHex(web3.utils.toWei('0.1')),
      })
      .then(async () => setSenderBal(await web3.eth.getBalance(address)))
      .then(async () => setReceiverBal(await web3.eth.getBalance(receiver)))
      .then((txHash) => console.log(txHash))
      .catch((error) => console.error);
  }

  function handleChangeAccepts(e) {
      e.preventDefault()
      const sym = e.target.innerText
      setChosenMerchantToken(sym)
      setChosenMerchantTokenAmount(merchantAccepts.find(x => x.code === sym).amount)
  }


  return (
    <Card className={classes.card}>
      <CardContent>
        <form className={classes.root} noValidate autoComplete="off">
         <Button color="secondary">Your address: {typeof address !== 'undefined' ? address : 'Connect Metamask'}</Button>
         <Button
          className="enableEthereumButton"
          onClick={getAccount}
         >
          Enable Ethereum
         </Button>

         <Container>
          <Grid container space={3}>
            <Grid item xs={3}><TextField id="standard-basic" label="Amount" /></Grid>
            <Grid item xs={3}>
            <Button variant="contained" color="primary">
                DAI
      <svg width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
            </Button>
            </Grid>
            <Grid item xs={3}>
              <Autocomplete
                id="combo-box-demo"
                options={tokenOptions}
                getOptionLabel={(option) => option.code}
                style={{ width: 250 }}
                renderInput={(params) => <TextField {...params} label="Token box" variant="outlined" />}
              />
            </Grid>
          </Grid>

        </Container>
         <Container>
          <Grid container space={3}>
            <Grid item xs={3}><TextField id="standard-basic" label="Receives" value={chosenMerchantTokenAmount} /></Grid>
            <Grid item xs={3}>
            <Button variant="contained" color="primary">
                {chosenMerchantToken}
      <svg width="12" height="7" viewcontainer="0 0 12 7" fill="none" ><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
            </Button>
            </Grid>
            <Grid item xs={3}>
              <Autocomplete
                id="combo-box-demo"
                options={merchantAccepts}
                getOptionLabel={(option) => option.code}
                getOptionSelected={(option, value) => option.code === value.code}
                onChange={handleChangeAccepts}
                style={{ width: 250 }}
                renderInput={(params) => <TextField {...params} label="Token Merchant Accepts" variant="outlined" />}
              />
            </Grid>
          </Grid>
        </Container>
        <Grid container space={3}>
            <Grid item xs={6}>
                <Button>Find optimal trade!</Button>
                <SwapContract/>
            </Grid>
        </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

Index.getInitialProps = ({ store, isServer }) => {
  store.dispatch(increment(isServer))

  return { isServer }
}

const mapStateToProps = state => {
  return {
    counter: state
  }
}

const mapDispatchToProps = dispatch => ({
  //increment: () => dispatch(increment()),
  //decrement: () => dispatch(decrement())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Index)
