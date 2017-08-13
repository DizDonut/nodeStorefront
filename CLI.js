require("dotenv").config();
var mysql = require("mysql");
var inquirer = require("inquirer");
var colors = require("colors");
var table = require("cli-table");
var Customer = require("./bamazonCustomer.js");
var Manager = require("./bamazonManager.js");
var Supervisor = require("./bamazonSupervisor.js");

var connect = mysql.createConnection({
  
})
