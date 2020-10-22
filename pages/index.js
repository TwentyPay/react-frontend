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

  const classes = useStyles()

  const tokenOptions = [ { code: '0xBTC' }, { code: 'AION' }, { code: 'AMPL' }, { code: 'ANT' }, { code: 'AST' }, { code: 'BAL' }, { code: 'BAT' }, { code: 'BNT' }, { code: 'BOOTY' }, { code: 'BZRX' }, { code: 'CELR' }, { code: 'COMP' }, { code: 'CRV' }, { code: 'CVL' }, { code: 'DAI' }, { code: 'DGD' }, { code: 'DNT' }, { code: 'DTH' }, { code: 'ENJ' }, { code: 'ENTRP' }, { code: 'FOAM' }, { code: 'FUN' }, { code: 'GEN' }, { code: 'GNO' }, { code: 'GNT' }, { code: 'GST2' }, { code: 'GUSD' }, { code: 'ICN' }, { code: 'ICX' }, { code: 'KEEP' }, { code: 'KNC' }, { code: 'LEND' }, { code: 'LINK' }, { code: 'LOOM' }, { code: 'LPT' }, { code: 'LRC' }, { code: 'MANA' }, { code: 'MATIC' }, { code: 'MKR' }, { code: 'MLN' }, { code: 'NMR' }, { code: 'OMG' }, { code: 'PAX' }, { code: 'POWR' }, { code: 'RDN' }, { code: 'REN' }, { code: 'REP' }, { code: 'REQ' }, { code: 'RLC' }, { code: 'SAI' }, { code: 'SNT' }, { code: 'SNX' }, { code: 'SPANK' }, { code: 'STORJ' }, { code: 'SUSD' }, { code: 'SUSHI' }, { code: 'SWRV' }, { code: 'TUSD' }, { code: 'UBT' }, { code: 'UMA' }, { code: 'UNI' }, { code: 'USDC' }, { code: 'USDT' }, { code: 'WBTC' }, { code: 'WETH' }, { code: 'YFI' }, { code: 'ZIL' }, { code: 'ZRX' }, { code: 'bUSD' }, { code: 'cBAT' }, { code: 'cDAI' }, { code: 'cETH' }, { code: 'cREP' }, { code: 'cSAI' }, { code: 'cUSDC' }, { code: 'cZRX' }, { code: 'mUSD' }, { code: 'renBTC' }, { code: 'sBTC' }, { code: 'swUSD' }, { code: 'yDAI' }, { code: 'yTUSD' }, { code: 'yUSD' }, { code: 'yUSDC' }, { code: 'yUSDT' }, { code: 'ybCRV' } ]

  const merchantAccepts = _validateTokensMerchantAccepts(router.query)
  const payDescr = typeof router.query.payDescr === 'undefined' ? 'TwentyPay transaction' : router.query.payDescr
  const merchantDescr = typeof router.query.merchantDescr === 'undefined' ? 'Unknown TwentyPay merchant' : router.query.merchantDescr

  const [chosenMerchantToken, setChosenMerchantToken] = useState('DAI')
  const [chosenMerchantTokenAmount, setChosenMerchantTokenAmount] = useState(0)

  function handleChangeAccepts(e) {
      e.preventDefault()
      const sym = e.target.innerText
      setChosenMerchantToken(sym)
      const codeAmount = merchantAccepts.find(x => x.code === sym)
      if (codeAmount) {
        setChosenMerchantTokenAmount(codeAmount.amount)
      }
  }


  return (
    <Card className={classes.card}>
      <CardContent>
        <Box color="text.primary">You are purchasing from: {merchantDescr}</Box>
        <Box color="text.primary">Item description: {payDescr}</Box>
        <form className={classes.root} noValidate autoComplete="off">

         <Container>
          <Grid container space={3}>
            <Grid item xs={3}><TextField id="standard-basic" label="Amount" /></Grid>
            <Grid item xs={1}>
              <Button variant="contained" color="primary">
                DAI
              </Button>
            </Grid>
            <Grid item xs={3}>
              <Autocomplete
                id="combo-box-demo"
                options={tokenOptions}
                defaultValue={tokenOptions[0]}
                getOptionLabel={(option) => option.code}
                style={{ width: 250 }}
                renderInput={(params) => <TextField {...params} label="Spend Token" variant="outlined" />}
              />
            </Grid>
          </Grid>

        </Container>
         <Container>
          <Grid container space={3}>
            <Grid item xs={3}><TextField id="standard-basic" label="Receives" value={chosenMerchantTokenAmount} /></Grid>
            <Grid item xs={1}>
              <Button variant="contained" color="primary">
                {chosenMerchantToken}
              </Button>
            </Grid>
            <Grid item xs={3}>
              <Autocomplete
                id="combo-box-demo"
                defaultValue={'DAI'}
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
