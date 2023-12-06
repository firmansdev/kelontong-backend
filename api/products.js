const express = require("express")
const connection = require("../config/connections")
const {transactionProcess, sqlUpsertBuilder, authChecker} = require("../config/common-logic")
const router = express.Router();
// const jwt = require('jsonwebtoken');
const escape = require('sqlutils/pg/escape');
const { v4: uuidv4 } = require('uuid');

async function getData(search = ''){
    return new Promise(async (resolve, reject) => {
        try {
            let params = {}
            params.query    = "SELECT id, name, description, price, stock, category_id, weight, width, length, height, image, sku FROM mas_products WHERE 1=1 "
            if(search) {
                params.query += " AND sku LIKE "+escape("%"+search+"%")+" OR id LIKE "+escape("%"+search+"%")+" OR name LIKE "+escape("%"+search+"%")+" OR description LIKE "+escape("%"+search+"%")
            }
            const result = await transactionProcess(params)
            resolve(result.data)
        } catch(error) {
            console.log("error", error)
            resolve(error)
        }
    })
}
router.get('/', async(req, res, next)=>{
    try {
        const authPayload = {
            token : req.headers['authorization']
        }
        await authChecker(authPayload)

        let result = await getData()
        res.status(200).json({
            status  : 'OK',
            data    : result,
            message : 'Success fetch data'
        })
    } catch(error) {
        var statusCode = 500
        var messages   = "Something Wrong Happened"
        if (error.name === 'TokenExpiredError') {
            messages = 'Token has expired!'
            statusCode = 401
        } else if(error.name === 'JsonWebTokenError') {
            messages = 'Invalid token!'
            statusCode = 401
        }
        res.status(statusCode).json({
            status  :  'Failed',
            data    :  error.message,
            message :  messages
        })
    }
})

router.get('/:id', async(req, res, next)=>{
    try {
        const authPayload = {
            token : req.headers['authorization']
        }
        await authChecker(authPayload)
        const filter = req.params.id
        let result = await getData(filter)
        res.status(200).json({
            status  : 'OK',
            data    : result,
            message : 'Success fetch data'
        })
    } catch(error) {
        var statusCode = 500
        var messages   = "Something Wrong Happened"
        if (error.name === 'TokenExpiredError') {
            messages = 'Token has expired!'
            statusCode = 401
        } else if(error.name === 'JsonWebTokenError') {
            messages = 'Invalid token!'
            statusCode = 401
        }
        res.status(statusCode).json({
            status  : 'Failed',
            data    :  error,
            message :  messages
        })
    }
})

router.delete('/:id', async(req, res, next)=>{
    try {

        const authPayload = {
            token : req.headers['authorization']
        }
        await authChecker(authPayload)

        let params = {}
        const id = req.params.id
        if(!id) {
            res.status(400).json({
                message : "ID must be filled"
            })
        } 
        params.query    = "DELETE FROM mas_products WHERE "
        params.query += "id = "+escape(id)
        const result = await transactionProcess(params)
        res.status(200).json({
            status  : 'OK',
            data    : result,
            message : 'Success delete data'
        })
    } catch(error) {
        var statusCode = 500
        var messages   = "Something Wrong Happened"
        if (error.name === 'TokenExpiredError') {
            messages = 'Token has expired!'
            statusCode = 401
        } else if(error.name === 'JsonWebTokenError') {
            messages = 'Invalid token!'
            statusCode = 401
        }
        console.log("error", error)
        res.status(statusCode).json({
            status  : 'Failed',
            data    :  error,
            message :  messages
        })
    }
})

router.post('/', async(req, res, next)=>{
    const userInput = req.body
    try {
        const authPayload = {
            token : req.headers['authorization']
        }
        await authChecker(authPayload)
        
        if(!userInput.created_by) {
            res.status(400).json({
                message : "The creator must be filled"
            })
        } 
        const insertParams = {
            type: "insert",
            tableName: "mas_products",
            ignoreInsert: false, 
            payload: {
              id: uuidv4(),
              name: userInput.name,
              description  : userInput.description,
              price        : userInput.price,
              category_id  : userInput.category_id,
              weight       : userInput.weight,
              width        : userInput.width,
              length       : userInput.length,
              height       : userInput.height,
              image        : userInput.image,
              sku          : userInput.sku,
              created_by   : userInput.created_by,
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
    } catch(error) {
        let errorMessages = 'Something Wrong'
        let statusCode    = 500
        if (error.name === 'TokenExpiredError') {
            errorMessages = 'Token has expired!'
            statusCode = 401
        } else if(error.name === 'JsonWebTokenError') {
            errorMessages = 'Invalid token!'
            statusCode = 401
        }

        if (error.code === '23503') {
            statusCode = 422
            const cleanField = error.constraint.substring(3);
            errorMessages = "This Field `"+cleanField+ "` with value `"+userInput[cleanField]+"` doesn't exists in database."
        }
        res.status(statusCode).json({
            status  : 'Failed',
            // data    : error.detail,
            message : errorMessages
        })
    }
})

router.put('/:id', async(req, res, next)=>{
    try {
        let date = new Date()
        let param = {}
        const id = req.params.id
        const userInput = req.body
        const authPayload = {
            token : req.headers['authorization']
        }
        await authChecker(authPayload)

        if(!userInput.updated_by) {
            res.status(400).json({
                message : "The creator must be filled"
            })
        } 
        const updateParams = {
            type: "update",
            tableName: "mas_products",
            payload: {
                name: userInput.name,
                description  : userInput.description,
                updated_by   : userInput.updated_by,
                price        : userInput.price,
                category_id  : userInput.category_id,
                weight       : userInput.weight,
                width        : userInput.width,
                length       : userInput.length,
                height       : userInput.height,
                image        : userInput.image,
                sku          : userInput.sku,
                updated_date : date
            },
            where: {
                id: id
            },
            operator: [], // Optional: Array of operators like AND/OR for multiple conditions
            condition: [] // Optional: Array of conditions like =, <, > for multiple conditions
        };
        param.query = sqlUpsertBuilder(updateParams);
        const result = transactionProcess(param.query)
        console.log(result)
        res.status(200).json({
            status  : 'OK',
            message : 'Success update data'
        })

    } catch(error) {
        var statusCode = 500
        var messages   = "Something Wrong Happened"
        if (error.name === 'TokenExpiredError') {
            messages = 'Token has expired!'
            statusCode = 401
        } else if(error.name === 'JsonWebTokenError') {
            messages = 'Invalid token!'
            statusCode = 401
        }
        res.status(statusCode).json({
            status  : 'Failed',
            data    :  error,
            message :  messages
        })
    }
})




module.exports = router;