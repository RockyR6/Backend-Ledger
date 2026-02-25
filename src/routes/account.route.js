const express = require('express')
const authMiddleware = require('../middleware/auth.middleware.js')
const accountController = require('../controllers/account.controller.js')



const router = express.Router()


//Post /api/accounts/(create a new account)(protected Route)
router.post('/', authMiddleware.authMiddleware, accountController.createAccountcontroller)

/*
    GET /api/accounts
    Get all accounts of the logged-in
    Protected Route
*/
router.get('/', authMiddleware.authMiddleware, accountController.getUserAccountsController)

/*
    GET /api/accounts/balance/:accountId
    Get the balance of a specific account
    Protected Route
*/

router.get('/balance/:accountId', authMiddleware.authMiddleware, accountController.getAccountBalanceController)

module.exports = router