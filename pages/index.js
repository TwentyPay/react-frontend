import React from 'react'
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

  const classes = useStyles()
  const tokenOptions = [ { code: 'DAI' }, { code: 'UNI' }, { code: 'WETH' } ]

  return (
    <Card className={classes.card}>
      <CardContent>
        <form className={classes.root} noValidate autoComplete="off">
         <Button color="secondary">Connect Metamask</Button>
         <Container>
          <Grid container space={3}>
            <Grid item xs={3}><TextField id="standard-basic" label="Amount" /></Grid>
            <Grid item xs={3}>
            <Button variant="contained" color="primary">
                DAI
      <svg width="12" height="7" viewBox="0 0 12 7" fill="none" class="sc-iQtOjA eHcpXP"><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
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
      <svg width="12" height="7" viewContainer="0 0 12 7" fill="none" class="sc-iQtOjA eHcpXP"><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
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
