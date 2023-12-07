const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const cors = require("cors")
const products = require("./api/products")
const category = require("./api/category")
const login = require("./api/login")
const register = require("./api/register")

app.use(bodyParser.json({ limit: "50MB" }))
app.use(cors({
    origin: '*',
}));
app.use(bodyParser.urlencoded({ extended: false }))
app.use("/products", products)
app.use("/category", category)
app.use("/login", login)
app.use("/register", register)

module.exports = app
