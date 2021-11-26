const express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user');
const app = express();
const https =  require('https');
const fs1 =  require('fs');

const path1 = require('path');     //used for file path

const sslserver = https.createServer(
  {
    key: fs1.readFileSync(path1.join(__dirname,'cert','key.pem')),
    cert:fs1.readFileSync(path1.join(__dirname,'cert','cert.pem')),
  },app).listen(443)


var path = require('path'),
	busboy = require("then-busboy"),
	fileUpload = require('express-fileupload');





// -------------------------------------------------------------------------------------------------------------

const session = require('express-session');
const http = require('https').Server(app);

let bodyParser = require("body-parser");
const { dirname } = require('path');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.param('id', function (req, res, next, name) {
  req.id = name;
  next();
});

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 100 * 3600000 }
}))




app.get('/', routes.index);//call for main index page
// app.get('/signup', user.signup);//call for signup page
// app.post('/signup', user.signup);//call for signup post 
app.get('/login', routes.index);//call for login page
app.post('/login', user.login2);//call for login post
// app.get('/home/logout', user.logout);//call for logout
app.post("/myaction", function (request, response) {
  console.log("Gender is:", request.body.gender);
  response.sendStatus(200)
});
// app.get('/login', user.login);//call for login post
app.get('/all', user.all_vehicle);//call for login post
app.get('/card', user.all_cards);//call for login post
app.get('/not_alloc', user.not_alloc);//call for login post
app.get('/user_list', user.user_list);//call for login post
app.get('/rpt_emp_vehicle', user.rpt_emp_vehicle);//call for login post
app.get('/rpt_mntn_summery', user.rpt_mntn_summery);//call for login post
app.get('/rpt_gps_monthly', user.rpt_gps_monthly);//call for login post
app.get('/rpt_emp_wo_vehicle', user.rpt_emp_wo_vehicle);//call for login post
app.get('/rpt_gps_hourly', user.rpt_gps_hourly);//call for login post
app.get('/rpt_fuels', user.rpt_fuels);//call for login post
app.get('/rpt_excep_monthly_entries', user.rpt_excep_monthly_entries);//call for login post
app.get('/excel_import', user.excel_import);//call for login post
app.get('/dash', user.dash);//
app.get('/dash2', user.dash2);//
app.get('/dash3', user.dash3);//
app.get('/map', user.map);//
app.get('/geo', user.geo);//
app.get('/manage_roles', user.manage_roles);//
app.get('/sidebar', user.sidebar);//call for login post
app.get('/forms', user.forms);//call for login post
app.get('/updateVehicle/:id', user.updateVehicle);//call for login post
app.get('/area', user.area);// to render Create Station
app.get('/school', user.school);// to render Create Station
app.get('/update_allocation', user.update_allocation);// to render Create Station
app.get('/update_basicInfo', user.update_basicInfo);// to render Create Station
app.get('/fuelInfo', user.fuelInfo);// to render Create Station
app.get('/nav', user.userlist2);// to render Create Station
app.get('/run/:id', user.run);
app.get('/data', user.data);// to render Create Station
app.get('/logout', user.logout);//call for logout
app.get('/listdata', user.listdata);//call for logout
app.get('/createRole', user.createRole);// to render Create Station
app.get('/assign_role', user.assign_role);// to render Create Station
app.get('/assign_vehicle', user.assign_vehicle);// to render assign vehicle
app.get('/vehicleAssign', user.vehicleAssign);// to Assign Vehicle
 app.get('/excel', user.excelq);//to  Excel import
app.get('/vehicleTagDept', user.vehicleTagDept);//to  Excel import
app.get('/vehicleDept', user.vehicleDept);//to  Excel import
app.get('/hcm', user.hcm);//to  Excel import
app.get('/userDrpt', user.userDrpt);//to  Excel import
app.get('/user_Dpt', user.user_Dpt);//to  Excel import
app.get('/getUser', user.getUser);//to  Excel import
app.get('/facultyUpdate', user.facultyUpdate);//to 
app.get('/excelImporter', user.excelImporter);//  Excel import
app.get('/assign_driver', user.assign_driver);//  Excel import
app.get('/stolenInfo', user.stolenInfo);//  Excel import
app.post('/add_vehicle', user.add_vehicle);//  Excel import
app.post('/add_vehicle_make', user.add_vehicle_make);//  Excel import
app.post('/update_vehicle_make', user.update_vehicle_make);//  Excel import
app.get('/petrol_cash', user.petrol_cash);//  Excel import
app.get('/petrol_cng_cash', user.petrol_cng_cash);//  Excel import
app.get('/diesel', user.diesel);//  Excel import
app.get('/excel_data', user.excel_data);//  Excel import
app.get('/delete_emp_faculty', user.delete_emp_faculty);//  Excel import
app.get('/deletes_alloc', user.deletes_alloc);//  Excel import
app.get('/deletes_alloc1', user.deletes_alloc1);//  Excel import
app.get('/email_node', user.email_node);//  Excel import
app.get('/test_table', user.test_table);//  Excel import
app.get('/Vehicle_make', user.Vehicle_make);//  Excel import
app.get('/delete_make', user.delete_make);//  Excel import
app.get('/edit_make', user.edit_make);//  Excel import
app.get('/fleet_cart', user.fleet_cart);//  Excel import
app.post('/add_fleet_card', user.add_fleet_card);//  Excel import
app.get('/delete_fleet_cart', user.delete_fleet_cart);//  Excel import
app.get('/edit_fleet_cart', user.edit_fleet_cart);//  Excel import
app.post('/update_fleet_card', user.update_fleet_card);//  Excel import
app.get('/fuel_rate_profile', user.fuel_rate_profile);//  Excel import
app.post('/add_fuel_rate', user.add_fuel_rate);//  Excel import
app.get('/delete_fuel_rate', user.delete_fuel_rate);//  Excel import
app.get('/edit_fuel_rate', user.edit_fuel_rate);//  Excel import
app.post('/update_fuel_rate', user.update_fuel_rate);//  Excel import
app.get('/get_capacity', user.get_capacity);//  Excel import
app.get('/delete_assign_role', user.delete_assign_role);//  Excel import
app.get('/delete_roles', user.delete_roles);//  Excel import
app.get('/update_active', user.update_active);//  Excel import
app.get('/check_fuel_rate', user.check_fuel_rate);//  Excel import
app.get('/line', user.line);//  Excel import
app.get('/yesterday', user.yesterday);//  Excel import
app.get('/line_three', user.line_three);//  Excel import
app.get('/custom_route/:id', user.custom_route);//  Excel import
app.get('/custom_line', user.custom_line);//  Excel import
app.get('/hour_report', user.hour_reports);//  Excel import
app.get('/hour_report1', user.hour_reports1);//  Excel import
app.get('/vehicle_monthly', user.vehicle_monthly);//  Excel import
app.get('/region_monthly', user.region_monthly);//  Excel import
app.get('/area_monthly', user.area_monthly);//  Excel import
app.get('/edit_rols/:id', user.edit_rols);//  Excel import
app.get('/edit___roles', user.edit___roles);//  Excel import
app.get('/update__Role', user.update__Role);//  Excel import
app.get('/excel_log', user.excel_log);//  Excel import
app.get('/excel1_log', user.excel1_log);//  Excel import
app.get('/excel2_view', user.excel2_view);//  Excel import
app.get('/excel1_view', user.excel1_view);//  Excel import
app.get('/delete_excel2', user.delete_excel2);//  Excel import
app.get('/delete_excel1', user.delete_excel1);//  Excel import
app.get('/update_log', user.update_log);//  Excel import
app.get('/responsible', user.responsible);//  Excel import
app.get('/card_history', user.card_history);//  Excel import
app.get('/rpt_dept', user.rpt_dept);//  Excel import
app.get('/gross', user.gross);//  Excel import
app.get('/add__roles', user.add__roles);//  Excel import












const sql = require('mssql');
const readXlsxFile = require('read-excel-file/node');
const { response } = require('express');
const fileUpload1 = require('express-fileupload');
var Busboy = require('busboy')
//var busboy = require('connect-busboy'); //middleware for form/file upload
var path = require('path');     //used for file path
var fs = require('fs-extra'); 



app.get('/exceel', function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
  res.write('<input type="file" name="filetoupload"><br>');
  res.write('<input type="submit">');
  res.write('</form>');
  return res.end();
})

app.post('/fileupload', function (req, res) {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  var busboy = new Busboy({ headers: req.headers });
  console.log("samad")
  sampleFile = req.files.filetoupload;
  uploadPath = __dirname + '/public/uploads/' + sampleFile.name;
  console.log("SOmi" + uploadPath);
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function (err) {
    if (err)
      return res.status(500).send(err);
      importExcelData2MySQL(uploadPath)
      
      res.redirect('/excelImporter')
  });
  function importExcelData2MySQL(filePath) {
    // File path.
    readXlsxFile(filePath).then((rows) => {
      // `rows` is an array of rows
      // each row being an array of cells.	 
      console.log(rows);


      /**
      [ [ 'Id', 'Name', 'Address', 'Age' ],
      [ 1, 'Jack Smith', 'Massachusetts', 23 ],
      [ 2, 'Adam Johnson', 'New York', 27 ],
      [ 3, 'Katherin Carter', 'Washington DC', 26 ],
      [ 4, 'Jack London', 'Nevada', 33 ],
      [ 5, 'Jason Bourne', 'California', 36 ] ] 
      */
      const config = {
        authentication: { type: 'default', options: { userName: 'fmsuat.user', password: 'Bh%3K2@9j7R+' } },
        server: "APPUAT",
        database: 'FMSUAT',
        port: 1433,
        dialect: "node-mssql",
        options: {
          encrypt: false,
          enableArithAbort: true
          // Use this if you're on Windows Azure
        }
      };
      let tutorials = [];

      var company_id = req.body.c_name;
      let r = (Math.random() + 1).toString(36).substring(7);
        console.log("random", r);
        var file_naming=sampleFile.name;
        var currentdate = new Date();

        var datetime = currentdate.getDate() + "-"
            + (currentdate.getMonth() + 1) + "-"
            + currentdate.getFullYear() + " "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();
        console.log("han date " + datetime);

      // Remove Header ROW
      rows.shift();
      rows.forEach((row) => {
        let tutorial = {
          del_date: row[0],
          v_number: row[1],
          quantity: row[2],
          unit: row[3],
          gross: row[4],
          card: row[5],
          fuel: row[6],

        };
        sql.connect(config, function (err) {
          if (err) {
            console.error(err);
          } else {
            var card_number = row[5];
            card_number = card_number.replace("'", "");
            console.log(card_number);
            var request = new sql.Request();

            console.log("SELECT * FROM fuel_consumption1 where del_date='"+ row[0] +"' and v_number='"+row[1]+"'");
            request.query("SELECT * FROM fuel_consumption1 where del_date='"+ row[0] +"' and v_number='"+row[1]+"'", function (err, recordset) {
              console.log(err || recordset)

              console.log(recordset["recordset"].length)
              if(recordset["recordset"].length>0)
              {
                console.log("not inserted")
              }
              else{
                 console.log("INSERT INTO fuel_consumption1 ([del_date],[v_number],[quantity],[unit_price],[gross_purchase],[card_number],[fuel-Type],[company_id],[file_random_id]) VALUES ('" + row[0] + "','" + row[1] + "','" + row[2] + "','" + row[3] + "','" + row[4] + "','" + card_number + "','" + row[6] + "','" + company_id + "','"+r+"')");

            request.query("INSERT INTO fuel_consumption1 ([del_date],[v_number],[qunatity],[unit_price],[gross_purchase],[card_number],[fuel_type],[company_id],[file_random_id]) VALUES ('" + row[0] + "','" + row[1] + "','" + row[2] + "','" + row[3] + "','" + row[4] + "','" + card_number + "','" + row[6] + "','" + company_id + "','"+r+"')", function (err, recordset) {
              console.log(err || recordset)
              console.log("inserted")
              
            });

              }
            });
            // console.log("INSERT INTO fuel_consumption1 ([del_date],[v_number],[quantity],[unit_price],[gross_purchase],[card_number],[fuel-Type],[company_id]) VALUES ('" + row[0] + "','" + row[1] + "','" + row[2] + "','" + row[3] + "','" + row[4] + "','" + card_number + "','" + row[6] + "','" + company_id + "')");

            // request.query("INSERT INTO fuel_consumption1 ([del_date],[v_number],[qunatity],[unit_price],[gross_purchase],[card_number],[fuel_type],[company_id]) VALUES ('" + row[0] + "','" + row[1] + "','" + row[2] + "','" + row[3] + "','" + row[4] + "','" + card_number + "','" + row[6] + "','" + company_id + "')", function (err, recordset) {
            //   console.log(err || recordset)
            // });

          }
        });
        tutorials.push(tutorial);

        

      });
      sql.connect(config, function (err) {
        if (err) {
          console.error(err);
        } else {
        
          var request = new sql.Request();
          
          console.log("INSERT INTO [dbo].[history_log_file_excel1]([userID],[created_on],[file_name],[file_random_id])VALUES('"+req.session.userId+"','"+datetime+"','"+file_naming+"','"+r+"')");
          request.query("INSERT INTO [dbo].[history_log_file_excel1]([userID],[created_on],[file_name],[file_random_id])VALUES('"+req.session.userId+"','"+datetime+"','"+file_naming+"','"+r+"')", function (err, recordset) {
            console.log(err || recordset)
            console.log("inserted file log")
          });
        }
      });

     

    })
  }
   
});






app.post('/fileupload2', function (req, res) {  
  let sampleFile;
    let uploadPath;
  
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
  
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.filetoupload;
    uploadPath = __dirname + '/public/uploads/' + sampleFile.name;
    console.log("SOmi" + uploadPath);
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
      if (err)
        return res.status(500).send(err);
  
      importData2SQL(uploadPath);
  
      res.redirect('/excel')
    });
    function importData2SQL(filePath) {
      readXlsxFile(filePath).then((rows) => {
        console.log(rows);
        const config = {
          authentication: { type: 'default', options: { userName: 'fmsuat.user', password: 'Bh%3K2@9j7R+' } },
          server: "APPUAT",
          database: 'FMSUAT',
          port: 1433,
          dialect: "node-mssql",
          options: {
            encrypt: false,
            enableArithAbort: true
            // Use this if you're on Windows Azure
          }
        };
        let tutorials = [];
  
        var company_id = req.body.c_name;
        let r = (Math.random() + 1).toString(36).substring(7);
        console.log("random", r);
        var file_naming=sampleFile.name;
        var currentdate = new Date();

        var datetime = currentdate.getDate() + "-"
            + (currentdate.getMonth() + 1) + "-"
            + currentdate.getFullYear() + " "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();
        console.log("han date " + datetime);
  
        // Remove Header ROW
        rows.shift();
        rows.forEach((row) => {
          let tutorial = {
            ac_number: row[0],
            acc_name: row[1],
            ac_status: row[2],
            card_pan: row[3],
            vrn: row[4],
            d_name: row[5],
            cg_desc: row[6],
            cg_status: row[7],
            cg_program: row[8],
            trans_limit: row[9],
            daily_limit: row[10],
            weekly_limit: row[11],
            monthly_limit: row[12],
            annual_limit: row[13],
            life_limit: row[14],
            trans_m_limit: row[15],
            daily_m_limit: row[16],
            weekly_m_limit: row[17],
            month_m_limit: row[18],
            annual_m_limit: row[19],
            lifetime_m_limit: row[20],
            trans_m_limit: row[21],
            daily_c_limit: row[22],
            weekly_c_limit: row[23],
            monthly_c_limit: row[24],
            legal_number: row[25],
            legal_name: row[26],
  
          };
          sql.connect(config, function (err) {
            if (err) {
              console.error(err);
            } else {
            
              var request = new sql.Request();
              // console.log("INSERT INTO [dbo].[excelim]([Account Customer Number],[Account Name] ,[Account Status Description],[Card PAN],[Card VRN],[Card Driver Name],[Card Group Description],[Card Status],[Card Expiry Date],[Card Program Name],[Transaction Limit Volume],[Daily Limit Volume],[Weekly Limit Volume],[Monthly Limit Volume],[Annual Limit Volume],[Lifetime Limit Volume],[Transaction Monetary Limit Value],[Daily Monetary Limit Value],[Weekly Monetary Limit Value],[Monthly Monetary Limit Value],[Annual Monetary Limit Value],[Lifetime Monetary Limit Value],[Transaction Limit Count],[Daily Limit Count],[Weekly Limit Count],[Monthly Limit Count],[Legal Entity Number],[Legal Entity Name],[rondom_id]) VALUES('"+row[0]+"','"+row[1]+"','"+row[2]+"','"+row[3]+"','"+row[4]+"','"+row[5]+"','"+row[6]+"','"+row[7]+"','"+row[8]+"','"+row[9]+"','"+row[10]+"','"+row[11]+"','"+row[12]+"','"+row[13]+"','"+row[14]+"','"+row[15]+"','"+row[16]+"','"+row[17]+"','"+row[18]+"','"+row[19]+"','"+row[20]+"','"+row[21]+"','"+row[22]+"',"+row[23]+","+row[24]+","+row[25]+","+row[26]+",'"+row[27]+"','"+r+"')");
              //alert("samad");
              
              request.query("INSERT INTO [dbo].[excelim]([Account Customer Number],[Account Name] ,[Account Status Description],[Card PAN],[Card VRN],[Card Driver Name],[Card Group Description],[Card Status],[Card Expiry Date],[Card Program Name],[Transaction Limit Volume],[Daily Limit Volume],[Weekly Limit Volume],[Monthly Limit Volume],[Annual Limit Volume],[Lifetime Limit Volume],[Transaction Monetary Limit Value],[Daily Monetary Limit Value],[Weekly Monetary Limit Value],[Monthly Monetary Limit Value],[Annual Monetary Limit Value],[Lifetime Monetary Limit Value],[Transaction Limit Count],[Daily Limit Count],[Weekly Limit Count],[Monthly Limit Count],[Legal Entity Number],[Legal Entity Name],[rondom_id]) VALUES('"+row[0]+"','"+row[1]+"','"+row[2]+"','"+row[3]+"','"+row[4]+"','"+row[5]+"','"+row[6]+"','"+row[7]+"','"+row[8]+"','"+row[9]+"','"+row[10]+"','"+row[11]+"','"+row[12]+"','"+row[13]+"','"+row[14]+"','"+row[15]+"','"+row[16]+"','"+row[17]+"','"+row[18]+"','"+row[19]+"','"+row[20]+"','"+row[21]+"','"+row[22]+"',"+row[23]+","+row[24]+","+row[25]+",'"+row[26]+"','"+row[27]+"','"+r+"')", function (err, recordset) {
                console.log(err || recordset)
                console.log("inserted")
              });
            }
          });
          tutorials.push(tutorial);
        });
        sql.connect(config, function (err) {
          if (err) {
            console.error(err);
          } else {
          
            var request = new sql.Request();
            
            console.log("INSERT INTO [dbo].[history_log_file]([userID],[created_on],[file_name],[file_random_id])VALUES('"+req.session.userId+"','"+datetime+"','"+file_naming+"','"+r+"')");
            request.query("INSERT INTO [dbo].[history_log_file]([userID],[created_on],[file_name],[file_random_id])VALUES('"+req.session.userId+"','"+datetime+"','"+file_naming+"','"+r+"')", function (err, recordset) {
              console.log(err || recordset)
              console.log("inserted file log")
            });
          }
        });
  
      })
    }
   
});

app.get('*',function(req,res){
  console.log('https:443//'+req.headers.host+req.url );
  res.redirect('https:443//'+req.headers.host+req.url )
})



var http1 = require('http');
http1.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);
// app.listen(8081,"172.23.12.27");