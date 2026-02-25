const mongoose = require('mongoose')

function connectDB() {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => {
        console.log('server is connected to DataBase')
      })
      .catch(err => {
        console.log('Error connecting to DB')
        process.exit(1)
      })
}

module.exports = connectDB