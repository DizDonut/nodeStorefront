require("dotenv").config();
var mysql = require("mysql");
var inquirer = require("inquirer");
var colors = require("colors");
var Table = require("cli-table");

var connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: "bamazon"
})

connection.connect(function(err){
  if(err) throw err;
  menu();
})

//-------------Functions----------------//

function menu(){
  inquirer.prompt([
    {
      type: "list",
      message: "How do you want to login?\n",
      choices: ["Customer", "Manager", "Supervisor", "Exit"],
      name: "choice"
    }
  ]).then(function(answer){
    switch (answer.choice) {
      case "Customer":
            console.log("Opening customer portal...".bgBlue.yellow);
            setTimeout(customerMenu, 1500);
            break;
      case "Manager":
            console.log("Opening manager portal...".bgGreen.white);
            setTimeout(managerMenu, 1500);
            break;
      case "Supervisor":
            console.log("Opening supervisor portal...".bgMagenta.grey);
            // setTimeout(supMenu, 1500);
            break;
      case "Exit":
            console.log("Goodbye!".inverse);
            return;
            break;
      default:
            console.log("I'm sorry, I don't understand that command.");
            console.log("Goodbye.");
            return;
            break;
    }//end switch statement
  })//end inquirer prompt
}//end menu function

function customerMenu(){
  var table = new Table({
    head: ["ID", "Name", "Department", "Price"]
  }) //create table object

  //query database and pull back all results
  connection.query("SELECT * FROM products", function(err, res){
    if (err) throw (err);
    for (var i = 0; i < res.length; i++) {
      table.push([
        res[i].item_ID, res[i].product_name, res[i].department_name, res[i].price
      ])
    }//end for loop to create table

    //display talbe to customer
    console.log(table.toString());

    inquirer.prompt([
      {
        name: "choice",
        type: "input",
        message: "Choose which item you would like to buy: ",
        validate: function(value){
          if(isNaN(value) === false){
            return true;
          }
          return false;
        }, //end validate statement
      },
      {
        name: "quant",
        type: "input",
        message: "How many would you like to buy?",
        validate: function(value){
          if(isNaN(value) === false){
            return true;
          }
          return false;
        }, //end validate statement
      }
    ]).then(function(answer){
      var query = "SELECT stock_quantity FROM products WHERE item_ID = ?";
      connection.query(query, [answer.choice], function(err, res){
        for (var i = 0; i < res.length; i++) {
          if(answer.quant > res[i].stock_quantity){
            console.log("There isn't enough in stock to accomodate that request.");
            setTimeout(customerMenu, 1000);
          } else {
            console.log("Updating the quantity of item " + answer.choice + "...");
            custUpdate(answer.choice, answer.quant, res[i].stock_quantity);
          }
        }//end for loop
      })
    })
  })//end connection query
}//end customerMenu function

function managerMenu(){

}//end managerMenu function

function custUpdate(id, change, stock){
  var newQuant = stock - change;
  var query = "UPDATE products SET stock_quantity = ? WHERE item_ID = ?";
  connection.query(query, [newQuant, id], function(err, res){
    if(err) throw err;
  })//end first connection query
  var query2 = "SELECT price FROM products WHERE item_ID = ?";
  connection.query(query2, [id], function(err, res){
    if(err) throw err;
    for (var i = 0; i < res.length; i++) {
      var total = res[i].price * change;
      console.log("Total amount owed: $" + total);
    }
    backToMenu();
  })//end second connection query
}//end custUpdate function

function backToMenu(){
  inquirer.prompt([
    {
      type: "list",
      message: "Would you like to go back to the main menu?",
      choices: ["Yes","No"],
      name: "answer"
    }
  ]).then(function(ans){
    if (ans.answer === "Yes") {
      menu();
    }else {
      console.log("Goodbye!");
      return;
    }
  })
}
