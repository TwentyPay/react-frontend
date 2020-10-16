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

import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Box from '@material-ui/core/Box'
import Grid from '@material-ui/core/Grid'
import Container from '@material-ui/core/Container'
import Autocomplete from '@material-ui/lab/Autocomplete'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: 14
  }
})



const Index = (props) => {
  const {
    counter,
    increment,
    decrement
  } = props

  const Web3 = require('web3');
  var ethereum, web3; /* XXX */
  const [address, setAddress] = useState('Not set');
  const receiver = '0x8afB142655d14b2840489Aa512e798FC9deeFBC0';
  const [senderBal, setSenderBal] = useState('');
  const [receiverBal, setReceiverBal] = useState('');

  const classes = useStyles()
  const tokenOptions = [ { code: 'DAI' }, { code: 'UNI' }, { code: 'WETH' } ]

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
                style={{ width: 150 }}
                renderInput={(params) => <TextField {...params} label="Token box" variant="outlined" />}
              />
            </Grid>
          </Grid>

        </Container>
         <Container>
          <Grid container space={3}>
            <Grid item xs={3}><TextField id="standard-basic" label="Receives" /></Grid>
            <Grid item xs={3}>
            <Button variant="contained" color="primary">
                UNI
      <svg width="12" height="7" viewcontainer="0 0 12 7" fill="none" ><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
            </Button>
            </Grid>
            <Grid item xs={3}>
              <Autocomplete
                id="combo-box-demo"
                options={tokenOptions}
                getOptionLabel={(option) => option.code}
                style={{ width: 150 }}
                renderInput={(params) => <TextField {...params} label="Pay Token" variant="outlined" />}
              />
            </Grid>
          </Grid>
        </Container>
        <Grid container space={3}>
            <Grid item xs={6}>
                <Button>Find optimal trade!</Button>
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
