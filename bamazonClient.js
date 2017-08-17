//initialize dependencies
require("dotenv").config();
var mysql = require("mysql");
var inquirer = require("inquirer");
var colors = require("colors");
var Table = require("cli-table");

//create connection to sql db
var connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: "bamazon"
})

//on connection, run the menu function
connection.connect(function(err){
  if(err) throw err;
  menu();
})

//-------------Functions----------------//
/*
  menu function runs an inquirer prompt to allow the user to login as a different user type
*/
function menu(){
  inquirer.prompt([
    {
      type: "list",
      message: "How do you want to login?\n",
      choices: ["Customer", "Manager", "Supervisor", "Exit"],
      name: "choice"
    }
  ]).then(function(answer){
    //on the different cases, runs the appropriate functions
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

/*
  customerMenu is the menu that will display if a user chooses the Customer user type
  It queries our db and returns all products available to purchase, in a table format
  User is prompted to select which item to buy and the quantity.  The db is updated
  with the new quantity number once the user confirms his/her purchase
*/

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

            //if the user chooses too many items, send them back to the customer menu
            console.log("There isn't enough in stock to accomodate that request.");
            setTimeout(customerMenu, 1000);
          } else {

            //otherwise run the reduceInv function to update the db
            console.log("Updating the quantity of item " + answer.choice + "...");
            reduceInv(answer.choice, answer.quant, res[i].stock_quantity);
          }
        }//end for loop
      })
    })
  })//end connection query
}//end customerMenu function

/*
  managerMenu displays the options that are available to a manager.  On the different cases, run the appropriate
  mananger functions
*/
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

/*
  prodList is a function that queries the db and returns all items from the produts table
*/
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

/*
  lowInv function queries the db and returns all items from the products table,
  where the stock_quantity is less than 5.  If it is less than five, create a table object
  and display the details in the appropriate columns.
*/
function lowInv(){
  connection.query("SELECT * FROM products GROUP BY stock_quantity HAVING count(*) < 5", function(err, res){
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

/*
  addInv function updates the stock_quantity of a specific product name
*/
function addInv(){
  var table = new Table({
    head: ["ID", "Name", "Department", "Price", "Inventory"]
  }) //create table object

  //build table with all products
  connection.query("SELECT * FROM products", function(err, res){
    if (err) throw (err);
    for (var i = 0; i < res.length; i++) {
      table.push([
        res[i].item_ID, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity
      ])
    }//end for loop to create table

    //display that table to the manager
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

        //hold the existing quantity + our added quantity in a variable
        newAmount = parseInt(newQuant) + parseInt(answer.amount);
        var query = "UPDATE products SET stock_quantity = ? WHERE item_ID = ?";

        //update the id chosen with our new quantity amount
        connection.query(query, [newAmount, answer.id], function(err, res){
          console.log("Added " + answer.amount + " to item number: " + answer.id + ". New inventory: " + newAmount);
          backToMenu();
        })
      })
    })//end inquirer prompt
  })//end first query to get all prods
}//end addInv function

/*
  addProd function allows a manager to add a new product to our product table
  Prompts with inquirer to fill in all applicable column data and then use Insert Into
  to add the new product to our table
*/
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

/*
  reduceInv function takes 3 parameters and reduces the stock_quantity in our products table
  by the amount purchased by the customer.

  @id = the value assigned to answer.choice in customerMenu function
  @change = value assigned to answer.quant in customerMenu function
*/
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

/*
  backToMenu function asks the user if he/she wants to return to menu function
*/
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
}//end backToMenu function
