const transactionModel = require("../Models/transaction.model");
const ledgerModel = require("../Models/ledger.model");
const accountModel = require("../Models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");
/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

async function createTransaction(req, res) {
  // 1.Validate request
  const { fromAccount, toAccount, amount, idempotencykey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencykey) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount and idempotencykey are required",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  //2.Validate idempotency key
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencykey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already processed",
        transaction: isTransactionAlreadyExists,
      });
    }
    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still processing",
      });
    }
    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction processing failed, please retry",
      });
    }
    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(200).json({
        message: "Transaction was reverseded, please retry",
      });
    }
  }

  //3.Check account status
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message:
        "Both fromAccount and toAccount must be ACTIVE to process transaction",
    });
  }

  //4.Derive sender balance from ledger
  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
    });
  }

  let transactionArr;
  try {
    //5. Create transaction (PENDING) with transaction safety
    const session = await mongoose.startSession();
    session.startTransaction();

     transactionArr = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey: idempotencykey,
          status: "PENDING",
        },
      ],
      { session },
    );
    const transaction = Array.isArray(transactionArr)
      ? transactionArr[0]
      : transactionArr;

    await ledgerModel.create(
      [
        {
          account: fromAccount,
          transaction: transaction._id,
          type: "DEBIT",
          amount,
        },
      ],
      { session },
    );

    await ledgerModel.create(
      [
        {
          account: toAccount,
          transaction: transaction._id,
          type: "CREDIT",
          amount,
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    //Send email notification
    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      toUserAccount,
    );
    return res.status(200).json({
      message: "Transaction processed successfully",
      transaction,
    });
  } catch (error) {
    // await session.abortTransaction();
    return res.status(500).json({
      message: "Transaction failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencykey } = req.body;

  if (!toAccount || !amount || !idempotencykey) {
    return res.status(400).json({
      message: "toAccount, amount and idempotencykey are required",
    });
  }
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });
  if (!toUserAccount) {
    return res.status(400).json({
      message: "Invalid toAccount",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });
  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System account not found for the user",
    });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  const transaction = await transactionModel.create(
    [
      {
        fromUserAccount,
        toAccount,
        amount,
        idempotencykey,
        status: "PENDING",
      },
    ],
    { session },
  );

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        transaction: transaction._id,
        type: "DEBIT",
        amount,
      },
    ],
    { session },
  );

  await (() => {
    return new Promise((resolve) => setTimeout(resolve, 100 * 1000));
  })();

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        transaction: transaction._id,
        type: "CREDIT",
        amount,
        transaction: transaction._id,
      },
    ],
    { session },
  );

  await transactionModel.findOneAndUpdate(
    { _id: transaction._id },
    { status: "COMPLETED" },
    { session },
  );

  await session.commitTransaction();
  session.endSession();

  return res.status(200).json({
    message: "Initial funds transaction processed successfully",
    transaction: transaction,
  });
}
module.exports = {
  createTransaction,
  createInitialFundsTransaction,
};
