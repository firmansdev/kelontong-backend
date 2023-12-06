// author : Firman Susanto (Firman Bun)
// this is for SQL common logic 
// actually you can use ORM library but i prefer using mine.

const connection = require("./connections")
const escape = require('sqlutils/pg/escape');
const jwt = require('jsonwebtoken');

const sqlUpsertBuilder = function (params) {
    // why i accept params ?
    // because if this template continue to be used, i want to set loggin in this function, all of the endpoint come through this global function
    // so i dont need to fix the args, i just simply add new properties in the object and set some constraints if exist what i do or else.
    let cleanSQL = ""
    if (params.type == "insert") {
        let baseSQLHeader = ""
        if (params.ignoreInsert === true) {
            baseSQLHeader = " INSERT IGNORE INTO " + params.tableName + " ("
        } else {
            baseSQLHeader = " INSERT INTO " + params.tableName + " ("
        }
        let baseSQLValues = " VALUES("
        let baseValues = []
        let counter = 0
        let sizePayload = Object.keys(params.payload).length
        for (const item of Object.keys(params.payload)) {
            counter += 1
            if (sizePayload == counter) {
                baseSQLHeader += item + ")"
                baseSQLValues += escape(params.payload[item])+")"
            } else {
                baseSQLHeader += item + ","
                baseSQLValues += escape(params.payload[item])+","
            }
        }
        cleanSQL = baseSQLHeader + baseSQLValues, baseValues
    } else if (params.type == "update") {
        if (params.where == "") {
            return ({
                status  : "failed"
            })
        }
        let baseSQLHeader = " UPDATE " + params.tableName + " SET "
        let baseSQLWhere = " WHERE "
        let baseValues = []
        let counter = 0
        let sizePayload = Object.keys(params.payload).length
        let sizePayloadWhere = Object.keys(params.where).length
        for (const item of Object.keys(params.payload)) {
            counter += 1
            if(typeof params.payload[item] === 'object' && params.payload[item] !== null) {
                for (const itemDetail of Object.keys(params.payload[item])) {
                    if (sizePayload == counter) {
                        baseSQLHeader += item + " = "+itemDetail+" +  " + escape(params.payload[item][itemDetail])
                    } else {
                        baseSQLHeader += item + " = "+itemDetail+" + "+escape(params.payload[item][itemDetail])+", "
                    }
                }
            } else {
                if (sizePayload == counter) {
                    baseSQLHeader += item + " = "+ escape(params.payload[item])
                } else {
                    baseSQLHeader += item + " = "+ escape(params.payload[item])+","
                }
            }
        }
        counter = 0
        for (const item of Object.keys(params.where)) {
            let condition = "="
            let operatorSingle = "AND"
            if (params.operator) {  
                if (params.operator.length > 0) {
                    operatorSingle = params.operator[counter]
                }
            }
            if (params.condition) {
                if (params.condition.length > 0) {
                    condition = params.condition[counter]
                }
            }
            counter += 1
            if (sizePayloadWhere == counter) {
                baseSQLWhere += item + " " + condition + " " + escape(params.where[item]) + " "
            } else {
                baseSQLWhere += item + " " + condition + " "+  escape(params.where[item]) + " " + operatorSingle + " "
            }
        }
        cleanSQL = baseSQLHeader + baseSQLWhere, baseValues
    } else {
        return {
            status  : "failed",
            query   : ""
        }
    }
    return {
      status: "success",
      query: cleanSQL + ";"
    }
}
const authChecker = async function (params) {
    // why i encapsulated jwt.verify to this function ?
    // because if there is any changes regarding authentication checking, i just need alter this function.
    return new Promise(async (resolve, reject) => {
        try {
            const token = params.token.split(' ')[1]; 
            const result = jwt.verify(token, process.env.SECRET_KEY);
            resolve(result)
        } catch(error) {
            console.log(error)
            reject(error)
        }
    })
}
const transactionProcess = async function (params) {
    return new Promise(async (resolve, reject) => {
        try{
            await connection.query('BEGIN');
            let result = await connection.query(params.query)
            await connection.query('COMMIT');
            resolve({
                data   : result.rows
            })
        } catch(error) {
            await connection.query('ROLLBACK');
            reject(error)
        }
    })
}
  

module.exports.sqlUpsertBuilder = sqlUpsertBuilder
module.exports.transactionProcess = transactionProcess
module.exports.authChecker = authChecker
