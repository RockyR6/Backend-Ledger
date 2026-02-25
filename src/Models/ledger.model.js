const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: [true, 'Ledger must be associated with an account'],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required for creating a ledger entry'],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transaction',
        required:[true, 'Ledger must be associated with a transaction'],
        index: true,
        immutable: true
    },
    type:{
        type: String,
        enum: {
            values: ['CREDIT', 'DEBIT'],
            message: 'Type can be either CREDIT or DEBIT',
        },
        required: true,
        immutable: true
    }
})

function preventLedgerModification(){
    throw new Error('Ledger entries are immutable and connot be modified or deleted')
}

[
  "findOneAndUpdate",
  "updateOne",
  "deleteOne",
  "remove",
  "deleteMany",
  "updateMany",
  "findOneAndDelete",
  "findOneAndReplace"
].forEach(method => ledgerSchema.pre(method, preventLedgerModification));





const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel