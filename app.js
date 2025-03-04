const express = require('express');
const app = express();
const path = require('path');
const env = require('dotenv').config();
const db = require('./config/db');
const userRouter = require('./routes/userRouter')

db();

app.use(express.json());//middleware for json parson
app.use(express.urlencoded({extended:true}));

app.set('view engine','ejs');
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/adm')]);
app.use(express.static(path.join(__dirname, 'public')));


app.use('/',userRouter)


app.listen(process.env.PORT,()=>{
    console.log("server 3200 is running",`http://localhost:${process.env.PORT}`)
})


module.exports = app;