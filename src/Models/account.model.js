const mongoose = require("mongoose");
const ledgerModel = require('../Models/ledger.model.js')



const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated a user"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be either ACTIVE, FROZEN or CLOSED",
      },
      default: 'ACTIVE'
    },
    currency: {
      type: String,
      required: [true, "Currency is required for an account"],
      default: "INR",
    },
  },
  { timestamps: true },
);

accountSchema.index({ user: 1, status: 1 })


//Almost every aggregation follows this structure
// 1️⃣ FILTER data
// 2️⃣ GROUP data
// 3️⃣ CALCULATE values
// 4️⃣ FORMAT output
accountSchema.methods.getBalance = async function() {
  const balanceData = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group:{
        _id: null,
        totalDebit:{
          $sum:{
            $cond: [
              { $eq: ['$type', 'DEBIT'] },
              '$amount',// "Use the amount field from each ledger document"
              0
            ]
          }
        },
        totalCredit:{
          $sum: {
            $cond: [
              { $eq: ['$type', 'CREDIT'] },
              '$amount',
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ['$totalCredit', '$totalDebit'] }
      }
    }
  ])
  if(balanceData.length === 0) return 0

  return balanceData[0].balance
}

const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;
