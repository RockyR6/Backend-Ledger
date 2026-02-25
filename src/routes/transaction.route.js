const { Router } = require('express');
const transactionController = require('../controllers/transaction.controller.js');
const { authMiddleware, authSystemUserMiddleware } = require('../middleware/auth.middleware.js');


const transactionRouter = Router();

/**
 * @route POST /api/transactions
 * @desc Create a new transaction
 */
transactionRouter.post('/',authMiddleware ,transactionController.createTransaction);

/*
    Post /api/transactions/suste,/initial-funds
    Create initial funds transaction form system user
*/
transactionRouter.post('/system/initial-funds', authSystemUserMiddleware, transactionController.createInitialFundsTransaction);


module.exports = transactionRouter;