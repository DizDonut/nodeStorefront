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
            console.log("Opening customer portal...\n".bgBlue.yellow);
            setTimeout(customerMenu, 1500);
            break;
      case "Manager":
            console.log("Opening manager portal...\n".bgGreen.white);
            setTimeout(managerMenu, 1500);
            break;
      case "Supervisor":
            console.log("Opening supervisor portal...\n".bgMagenta.grey);
            console.log("We're sorry, the supervisor portal is currently under construction.".inverse);
            menu();
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

// ------ User Menu Functions -------- //

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
            reduceInv(answer.choice, answer.quant, res[i].stock_quantity);
          }
        }//end for loop
      })
    })
  })//end connection query
}//end customerMenu function

function managerMenu(){
  inquirer.prompt([
    {
      type: "list",
      message: "Hey boss, what would you like to do?\n",
      choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Back to Main Menu", "Exit"],
      name: "choice"
    }
  ]).then(function(ans){
    switch (ans.choice) {
      case "View Products for Sale":
            console.log("Items for sale...");
            setTimeout(prodList, 1500);
            break;
      case "View Low Inventory":
            console.log("Low inventory...");
            setTimeout(lowInv, 1500);
            break;
      case "Add to Inventory":
            console.log("Okay boss, let's add some inventory...");
            setTimeout(addInv, 1500);
            break;
      case "Add New Product":
            console.log("Alright, a brand new product!");
            setTimeout(addProd, 1500);
            break;
      case "Back to Main Menu":
            menu();
            break;
      case "Exit":
            console.log("Later, jefecito!");
            return;
            break;
      default:
            console.log("Sorry boss, I don't recognize that command");
            setTimeout(menu, 1000)
            break;
    }//end switch statement
  })//end inquirer prompt
}//end managerMenu function

function prodList(){
  connection.query("SELECT * FROM products", function(err, res){
    if (err) throw err;
    var table = new Table({
      head: ["Item ID", "Product Name", "Price", "Quantity Available"]
    });
    for (var i = 0; i < res.length; i++) {
      table.push([res[i].item_ID, res[i].product_name, res[i].price, res[i].stock_quantity]);
    }
    console.log(table.toString());
    backToMenu();
  })//end query
}//end prodList function

function lowInv(){
  connection.query("SELECT product_name FROM products GROUP BY stock_quantity HAVING count(*) < 5", function(err, res){
    if (err) throw err;
    var table = new Table({
      head: ["Item ID", "Product Name", "Price", "Inventory"]
    });
    for (var i = 0; i < res.length; i++) {
      if (res[i].stock_quantity < 5) {
        table.push([res[i].item_ID, res[i].product_name, res[i].price, res[i].stock_quantity]);
      }
    }
    if (table.length === 0) {
      console.log("No items with a low inventory");
    } else {
      console.log(table.toString());
    }
    backToMenu();
  })//end query
}//end lowInv function

function addInv(){
  var table = new Table({
    head: ["ID", "Name", "Department", "Price", "Inventory"]
  }) //create table object

  connection.query("SELECT * FROM products", function(err, res){
    if (err) throw (err);
    for (var i = 0; i < res.length; i++) {
      table.push([
        res[i].item_ID, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity
      ])
    }//end for loop to create table

    console.log(table.toString());

    inquirer.prompt([
      {
        type: "input",
        message: "What would you like to add?",
        name: "id"
      },
      {
        type: "input",
        message: "How much inventory would you like to add?",
        name: "amount"
      }
    ]).then(function(answer){
      connection.query("SELECT stock_quantity FROM products WHERE item_ID = ?", [answer.id], function(err, res){
        if(err) throw err;
        var newAmount = 0;
        for (var i = 0; i <= res.length; i++) {
          var newQuant = res[0].stock_quantity;
        }

        newAmount = parseInt(newQuant) + parseInt(answer.amount);
        var query = "UPDATE products SET stock_quantity = ? WHERE item_ID = ?";
        connection.query(query, [newAmount, answer.id], function(err, res){

          console.log("Added " + answer.amount + " to item number: " + answer.id + ". New inventory: " + newAmount);
        })
        backToMenu();
      })
    })//end inquirer prompt
  })//end first query to get all prods
}//end addInv function

function addProd(){
  inquirer.prompt([
    {
      type: "input",
      message: "Enter the name of your product: ",
      name: "product"
    },
    {
      type: "input",
      message: "Enter product department: ",
      name: "department"
    },
    {
      type: "input",
      message: "Set the intial price: ",
      validate: function(value){
        if(isNaN(value) === false){
          return true;
        }
        return false;
      }, //end validate statement
      name: "price"
    },
    {
      type: "input",
      message: "Set the product inventory: ",
      validate: function(value){
        if(isNaN(value) === false){
          return true;
        }
        return false;
      }, //end validate statement
      name: "inventory"
    }
  ]).then(function(answers){
    connection.query("INSERT INTO products SET ?",
    {
      product_name: answers.product,
      department_name: answers.department,
      price: answers.price,
      stock_quantity: answers.inventory
    },
      function(err){
        if (err) throw err;
        console.log(answers.product + " has been added to the database.");
        inquirer.prompt([
          {
            type: "list",
            message: "Any more products to add?\n",
            choices: ["Yes", "No"],
            name: "choice"
          }
        ]).then(function(choice){
          if(choice.choice === "Yes"){
            addProd();
          } else {
            backToMenu();
          }
        })
      })
  })//end first inquirer prompt
}//end addProd function

function reduceInv(id, change, stock){
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
