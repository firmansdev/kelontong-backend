const express = require("express")
const {transactionProcess, sqlUpsertBuilder} = require("../config/common-logic")
const router = express.Router();
const escape = require('sqlutils/pg/escape');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();



router.post('/', async (req, res, next) => {
    try {
        var params = {}
        const inputUser = req.body;
        params.query  = `SELECT user_id, username, email, password_hash, jwt_token FROM mas_users WHERE (
            email = `+escape(inputUser.username)+` 
            OR username = `+escape(inputUser.username)+`)`;
        const result = await transactionProcess(params); 
        if (result.data && result.data.length > 0) {
            const hashedPasswordFromDB = result.data[0].password_hash;
            const enteredPassword = req.body.password;
            bcrypt.compare(enteredPassword, hashedPasswordFromDB, async (err, isMatch) => {
                if (err) {
                    console.error('Error:', err);
                    res.status(500).json({
                        status: 'Failed',
                        message: 'Error comparing passwords'
                    });
                } else if (isMatch) {
                    const secretKey   = process.env.SECRET_KEY;
                    const payloadBody = {}
                    const timer       = {}

                    payloadBody['id']  = result.data[0].user_id
                    timer['expiresIn'] = 176400 
                    var token = jwt.sign(payloadBody, secretKey, timer) 
                    const updateParams = {
                        type: "update",
                        tableName: "mas_users",
                        payload: {
                            jwt_token: token
                        },
                        where: {
                            user_id: result.data[0].user_id
                        },
                        operator: [], // Optional: Array of operators like AND/OR for multiple conditions
                        condition: [] // Optional: Array of conditions like =, <, > for multiple conditions
                    };
                    params.query = sqlUpsertBuilder(updateParams);
                    const updateQueryResult = await transactionProcess(params.query)

                    res.status(200).json({
                        status: 'OK',
                        data: {
                            token : token
                        },
                        message: 'Success fetch data'
                    });
                } else {
                    console.log('Username and Password do not match');
                    res.status(401).json({
                        status: 'Unauthorized',
                        message: 'Username and Password do not match'
                    });
                }
            });
        } else {
            console.log('User not found');
            res.status(404).json({
                status: 'Not Found',
                message: 'User not found'
            });
        }
    } catch (error) {
        // console.error('Error:', error);
        res.status(500).json({
            status: 'Failed',
            message: 'Something went wrong'
        });
    }
});
module.exports = router;