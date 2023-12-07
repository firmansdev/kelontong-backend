const express = require("express")
const {transactionProcess, sqlUpsertBuilder} = require("../config/common-logic")
const router = express.Router();
const escape = require('sqlutils/pg/escape');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();



router.post('/', async (req, res, next) => {
    try {
        const { v4: uuidv4 } = require('uuid');
        router.post('/register', async (req, res) => {
        try {   
            params.query  = `SELECT user_id, username, email, password_hash, jwt_token FROM mas_users WHERE (
                email = `+escape(inputUser.username)+` 
                OR username = `+escape(inputUser.username)+`)`;
            const validator = await transactionProcess(params); 
            if (validator.data && validator.data.length > 0) {
                return res.status(400).json({ message: 'User with this email or username already exists' });
            }
            const { username, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertParams = {
                type: "insert",
                tableName: "mas_users",
                ignoreInsert: false, 
                payload: {
                  id: uuidv4(),
                  username  : username,
                  email  : email,
                  password_hash : hashedPassword,
                  jwt_token  : '',
                }
            };
            let param = {}
            param.query = await sqlUpsertBuilder(insertParams);
            const result = await transactionProcess(param.query)
            console.log(result)
            res.status(200).json({
                status  : 'OK',
                message : 'Success saving data'
            })
        } catch (error) {
            console.log("kesini ??")
            console.error('Error:', error);
            res.status(500).json({ message: 'Something went wrong' });
        }
        });

    } catch (error) {
        console.log("kesini ??")
        console.error('Error:', error);
        res.status(500).json({
            status: 'Failed',
            message: 'Something went wrong'
        });
    }
});
module.exports = router;