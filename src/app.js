const express = require('express')
const cookieParser = require('cookie-parser')



const app = express()

app.use(express.json())
app.use(cookieParser())

//Routes Import
const authRouter = require('./routes/auth.routes.js')
const  accountRouter = require('./routes/account.route.js')
const transactionRouter = require('./routes/transaction.route.js') 

//use Routes
app.use('/api/auth', authRouter)
app.use('/api/account', accountRouter)
app.use('/api/transactions', transactionRouter)
module.exports = app