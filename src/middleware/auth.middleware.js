const userModel = require('../Models/user.model.js')
const jwt = require('jsonwebtoken')
const tokenBlackListModel = require("../Models/blackList.model.js");


async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

    if(!token){
        return res.status(401).json({
            message: 'Unauthorized access, token is missing'
        })
    }

    const isBlackListed = await tokenBlackListModel.findOne({ token })

    if(isBlackListed){
        return res.status(401).json({
            message: 'Unauthorized access, token is blacklisted'
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId)

        req.user = user

        return next()

    } catch (error) {
        return res.status(401).json({
            message: 'Unauthorized access, token is invalid'
        })
    }
}

async function authSystemUserMiddleware(req, res, next){
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

    const isBlackListed = await tokenBlackListModel.findOne({ token })

    if(isBlackListed){
        return res.status(401).json({
            message: 'Unauthorized access, token is blacklisted'
        })
    }

    if(!token){
        return res.status(401).json({
            message: 'Unauthorized access, token is missing'
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId).select('+systemUser')

        if(!user.systemUser){
            return res.status(403).json({
                message: 'Forbidden access, user is not a system user'
            })
        }
        req.user= user;

        return next()

        
    } catch (error) {
        return res.status(401).json({
            message: 'Unauthorized access, token is invalid'
        })
    }
}



module.exports = {
    authMiddleware,
    authSystemUserMiddleware,
}