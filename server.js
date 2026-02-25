require('dotenv').config()

const app = require('./src/app.js')
const connectDB = require('./src/config/db.js')


connectDB()

app.listen(4000, () => {
    console.log('Server is runnding on port 4000')
})