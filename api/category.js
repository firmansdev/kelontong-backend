const express = require("express")
const connection = require("../config/connections")
const {transactionProcess, sqlUpsertBuilder} = require("../config/common-logic")
const router = express.Router();
// const jwt = require('jsonwebtoken');
const escape = require('sqlutils/pg/escape');
const { v4: uuidv4 } = require('uuid');

async function getData(search = ''){
    return new Promise(async (resolve, reject) => {
        try {
            let params = {}
            params.query    = "SELECT id, name, description, created_date, created_by, updated_by, updated_date FROM mas_category WHERE 1=1 "
            if(search) {
                params.query += " AND id LIKE "+escape("%"+search+"%")+" OR name LIKE "+escape("%"+search+"%")+" OR description LIKE "+escape("%"+search+"%")
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
        let result = await getData()
        res.status(200).json({
            status  : 'OK',
            data    : result,
            message : 'Success fetch data'
        })
    } catch(error) {
        res.status(500).json({
            status  : 'Failed',
            data    :  error,
            message : 'Something wrong happened'
        })
    }
})

router.get('/:id', async(req, res, next)=>{
    try {
        const filter = req.params.id
        let result = await getData(filter)
        res.status(200).json({
            status  : 'OK',
            data    : result,
            message : 'Success fetch data'
        })
    } catch(error) {
        res.status(500).json({
            status  : 'Failed',
            data    :  error,
            message : 'Something wrong happened'
        })
    }
})


router.delete('/:id', async(req, res, next)=>{
    try {
        let params = {}
        const id = req.params.id
        if(!id) {
            res.status(400).json({
                message : "ID must be filled"
            })
        } 
        params.query    = "DELETE FROM mas_category WHERE "
        params.query += "id = "+escape(id)
        const result = await transactionProcess(params)
        res.status(200).json({
            status  : 'OK',
            data    : result,
            message : 'Success delete data'
        })
    } catch(error) {
        console.log("error", error)
        res.status(500).json({
            status  : 'Failed',
            data    :  error,
            message : 'Something wrong happened'
        })
    }
})

router.post('/', async(req, res, next)=>{
    const userInput = req.body
    try {
        if(!userInput.created_by) {
            res.status(400).json({
                message : "The creator must be filled"
            })
        } 
        const insertParams = {
            type: "insert",
            tableName: "mas_category",
            ignoreInsert: false, 
            payload: {
              id: uuidv4(),
              name: userInput.name,
              description  : userInput.description,
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
        let param = {}
        const id = req.params.id
        const userInput = req.body
        if(!userInput.updated_by) {
            res.status(400).json({
                message : "The creator must be filled"
            })
        } 
        const updateParams = {
            type: "update",
            tableName: "mas_category",
            payload: {
                name: userInput.name,
                description  : userInput.description,
                updated_by   : userInput.updated_by
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
        console.log("error", error)
        res.status(500).json({
            status  : 'Failed',
            data    :  error,
            message : 'Something wrong happened'
        })
    }
})




module.exports = router;