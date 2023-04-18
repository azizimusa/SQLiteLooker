const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const fs = require('fs');

const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );

const formidable = require('express-formidable');
const gemmaDBDestinationPath = __dirname + '/uploadedDB/gemma.db';
let gemmaData = [];
let gemmaDataColumn = [];
let mineName = [];
let wholeDB = [];
let tableName = "TransactionModel";

app.use(formidable());

function initDB() {
  // Open a database connection
  let db = new sqlite3.Database(gemmaDBDestinationPath);

  if (db != null) {
    db.all('SELECT * FROM sqlite_sequence ORDER BY name ASC', [], (err, rows) => {

      if (err) {
        throw err;
      } else {
        wholeDB = rows;
      }

    });

    db.all('SELECT * FROM SitesModel LIMIT 1', [], (err, rows) => {
      if (err) {
        throw err;
      } else {
        mineName = rows[0];
      }

    });

    db.all('PRAGMA table_info(TransactionModel)', (err, rows) => {
      if (err) {
        console.error(err.message);
      } else {
        gemmaDataColumn = rows;
        // rows.forEach(row => {
        //   console.log(row.name);
        // });
      }
    });


// Execute a SELECT query to read data from a table
    db.all('SELECT * FROM TransactionModel LIMIT 10', (err, rows) => {
      if (err) {
        console.error(err.message);
      } else {
        gemmaData = rows;
      }

    });

    db.close();

  }

}

function queryTableColumnInfo(tableInfo) {

  return new Promise((resolve, reject) => {
    let db = new sqlite3.Database(gemmaDBDestinationPath);

    db.all('PRAGMA table_info (' + tableInfo + ')', (err, rows) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        // gemmaData = rows;
        console.log(rows[0]);
        db.close();

        resolve(rows);
      }

    });
  })

}
function queryTableInfo(tableInfo) {

  return new Promise((resolve, reject) => {
    let db = new sqlite3.Database(gemmaDBDestinationPath);

    db.all('SELECT * FROM ' + tableInfo + ' LIMIT 10', (err, rows) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        // gemmaData = rows;
        console.log(rows[0]);
        db.close();

        resolve(rows);
      }

    });
  })

}

app.set('view engine', 'ejs');
// Serve static files from the "public" directory
// app.use(express.static('web'));
app.use(express.static(__dirname + '/web'));
app.use((req, res, next) => {
  fs.access(gemmaDBDestinationPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log("file not exist");
    } else {
      initDB();
    }

    next();
  });
})
// serve the homepage
app.get('/', (req, res) => {

  res.render('index', { wholeDB, gemmaDataColumn, gemmaData, mineName, tableName });
});

app.get('/index.html', (req, res) => {
  res.sendFile(__dirname + '/web/index.html');
});

app.get('/table/:tableName', async (req, res) => {

  if (req.url.includes('/table/')) {
    const urlPath = req.url.replace("table/", "");
    const tableName = urlPath.replace(/^\/+|\/+$/g, '');

    const gemmaData = await queryTableInfo(tableName);
    const gemmaDataColumn = await queryTableColumnInfo(tableName);

    res.send([gemmaData, gemmaDataColumn]);

  } else {
    // res.send("didnt implement yet (" + req.url);
  }

})

// Define a route to handle the button click event
app.get('/gg', (req, res) => {
  console.log('Button clicked!');
  res.send('Button clicked!');
});

app.post('/copydb', (req, res) => {

  if (!req.files || Object.keys(req.files).length === 0) {
    console.log(Object.keys(req));
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "myFile") is used to retrieve the uploaded file
  const myFile = req.files.gemmadb;

  const sourcePath = myFile.path;
  fs.copyFile(sourcePath, gemmaDBDestinationPath, (err) => {
    if (err) {
      console.error('Error copying file:', err);
    } else {
      console.log('File copied successfully.');
      initDB();
      res.send('File copied success');
    }
  });

});

// Start the server
app.listen(8080, () => {
  console.log('Server started on port 8080');
});
