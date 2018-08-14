const express = require('express');
const cors = require('cors');
const metadata = require('../routes/metadata');
const dashboard = require('../routes/dashboard');
var fs = require('fs');

module.exports = function (app) {
    app.use(cors());
    app.use(express.json());
    /*app.get('/',(req, res)=>{
        res.send('Hello from Sentiment Analysis')
    })*/
    app.get('/',function (req, resp) { 
        fs.readFile("Index.htm", function (error, pgResp) {
            if (error) {
                resp.writeHead(404);
                resp.write('Contents you are looking are Not Found');
            } else {
                resp.writeHead(200, { 'Content-Type': 'text/html' });
                resp.write(pgResp);
            }
             
            resp.end();
        }); 
 
    });
    app.use('/api/metadata', metadata);
    app.use('/api/dashboard', dashboard);   
    
}
