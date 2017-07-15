var inquirer   = require('inquirer');
var mysql      = require('mysql');
var Table      = require('cli-table');
var keys       = require('./keys.js');

var connection = mysql.createConnection({
  host     : "localhost",
  port     : 8889,
  user     : keys.id,
  password : keys.pwd,
  database : keys.db
});

var table = new Table({
    head: ['Item ID', 'Product Name', 'Price', 'Dept.','Quantity'], 
    colWidths: [10, 30, 10, 22, 10]
});

var totalSpent = 0;

let sql = "SELECT * FROM products";

let end = false;

connection.connect(function(err){
    if (err) throw err;
    console.log("connected as thread id " + connection.threadId);
});

displayTable(sql, end);

function displayTable(sql, end) {

    connection.query(sql, (err, res) => {
            if (err) throw err;
        
            res.forEach(makeTable);
            console.log("\n\n");
            console.log(table.toString());
            console.log("\n\n");

            table = new Table({
                head: [ 'Item ID', 'Product Name', 
                        'Price', 'Dept.','Quantity'], 
                colWidths: [10, 30, 10, 22, 10]
            });
          
            if (!end) {
                makeOrder();
            }
            else {
                connection.end();
            }
    });
};
 
function makeTable(row) {
    table.push(
        [
            row.item_id, 
            row.product_name, 
            row.price, 
            row.department_name,
            row.stock_quantity
        ]
    );
};

function makeOrder() {

    inquirer
      .prompt([
        {
          type: "input",
          message: "To place an order, please choose item's ID",
          name: "productID",
          validate: function(answer) {
            if (!isNaN(answer)) {
                return true;
            }
            else {
            return console.log(
                '\n\n----------------------------------'
                + '\n please input a number for the ID'
                + '\n----------------------------------\n\n');
            }
          }
        },    
        {
          type: "input",
          message: "How many items would you like to buy?",
          name: "orderQty",
          validate: function(answer) {
            if (!isNaN(answer)) {
                return true;
            }
            else {
            return console.log(
                '\n\n----------------------------------'
                + '\n please input a number for the qty'
                + '\n----------------------------------\n\n');
            }
          }
        }
      ])
        .then(function(resp) {
            var id = parseInt(resp.productID);
            var qty = parseInt(resp.orderQty);

            placeOrder(id, qty);
        });
}

function placeOrder(id, qty) {

    connection.query('SELECT * FROM products WHERE item_id = ?', 
                     [id], (err, res) => {
            if (err) throw err;

            let purchase = parseFloat(res[0].price);
            let stockQty = res[0].stock_quantity;
            let totalSales = res[0].product_sales;

            if (stockQty >= qty) {
                stockQty -= qty;
                updateQty(stockQty, id, totalSales, qty, purchase)              
            }
            else {
                console.log(
                    '\n\n----------------------------------'
                    + '\n     Insufficient Quantity!'
                    + '\n----------------------------------\n\n');
                makeOrder();
            }
            
    });
}
 
function updateQty(stockQty, id, prodSales, qty, purchase) {

    let expense = (qty * purchase);
    prodSales += expense;

    connection.query('UPDATE products SET stock_quantity = ?, ' + 
                    "product_sales = ? " + 
                    "WHERE item_id = ?", 
                    [stockQty, prodSales, id], (err, res) => {
                        if (err) throw err;
 
                        endProgram(expense);
                });
}


function endProgram(exp) {

    console.log('\n\n----------------------------------'
                + '\n your total expense is: $' 
                + exp
                + '\n----------------------------------\n\n');
    setTimeout(function() {
        sql = "SELECT * FROM products"
        let end = true;
        displayTable(sql, end);
    }, 2000);
}