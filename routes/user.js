const { response } = require('express');
const { months } = require('moment');

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
    },
    requestTimeout: 300000
};
const moment = require("moment");

exports.login = function (req, res) {
    var json = JSON.parse('{"status":"OK"}')
    res.render('index', { somi: json });
};

exports.login2 = function (request, response) {
    message = '';
    const { ActiveDirectory } = require('node-ad-tools');

    const myADConfig = {
        url: 'ldap://pdcserver.thecitizensfoundation.org', // You can use DNS as well, like domain.local
        base: 'dc=thecitizensfoundation, dc=org'
    }

    const myAD = new ActiveDirectory(myADConfig);
    var username = request.body.user_name;

    var password = request.body.password;
    console.log(username)
    var email = username;
    var name = email.substring(0, email.lastIndexOf("@"));
    var domain = email.substring(email.lastIndexOf("@") + 1);
    name = 'TCF\\' + name;
    console.log(name);   // john.doe
    console.log(domain); // example.com

    myAD.loginUser(name, password)
        .then(res => {
            // If it failed to auth user find out why
            if (!res.success) {
                //console.log(res.message);
                return;
            }

            const user = ActiveDirectory.createUserObj(res.entry);
            console.log(user);
            const sql = require('mssql')
            var connection = new sql.connect(config, function (err) {
                if (err) console.log(err)
                var req = new sql.Request(connection);


                console.log("SELECT * FROM [fmsuat].[dbo].[fms_users2] WHERE email='" + username + "'");
                req.query("SELECT * FROM [fmsuat].[dbo].[fms_users2] WHERE email='" + username + "'", function (err, recordset) {
                    //console.log(recordset["recordset"]);

                    if (recordset["recordsets"][0].length > 0) {
                        request.session.loggedin = true;
                        request.session.username = username;
                        request.session.password = password;
                        request.session.userId = recordset["recordsets"][0][0]["userID"];
                        request.session.nameUser = recordset["recordsets"][0][0]["UserName"];
                        request.session.departId = recordset["recordsets"][0][0]["department_id"];
                        request.session.designationId = recordset["recordsets"][0][0]["designationId"];
                        console.log("aaayaay " + request.session.userId)
                        var currentdate = new Date();
                        var datetime = currentdate.getDate() + "/"
                            + (currentdate.getMonth() + 1) + "/"
                            + currentdate.getFullYear() + " "
                            + currentdate.getHours() + ":"
                            + currentdate.getMinutes() + ":"
                            + currentdate.getSeconds();
                        console.log("date time 1 " + currentdate);
                        console.log("INSERT INTO [dbo].[fms_login_log]([user_id],[last_login])VALUES('" + request.session.userId + "','" + datetime + "')")
                        req.query("INSERT INTO [dbo].[fms_login_log]([user_id],[last_login])VALUES('" + request.session.userId + "','" + datetime + "')", function (err, recordset) {
                            if (err) console.log(err)
                            console.log("UPDATE [dbo].[fms_users] SET [last_login] = '" + datetime + "' WHERE role=" + request.session.userId + "")
                            req.query("UPDATE [dbo].[fms_users] SET [last_login] = '" + datetime + "' WHERE role=" + request.session.userId + "", function (err, recordset) {
                                if (err) console.log(err)

                                // send records as a response
                                //console.log(recordset["recordsets"][0]);

                            });

                        });
                        response.redirect('/dash');

                    }
                    response.end();
                });

            });
        })
        .catch(err => console.error(err))

};

//------------------------------------logout functionality----------------------------------------------
exports.logout = function (req, res) {
    req.session.destroy(function (err) {
        res.redirect("/login");
    })
};

exports.all_vehicle = function (req, res) {

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        var connection = new sql.connect(config, function (err) {
            if (err) console.log(err)
            var request = new sql.Request(connection);
            console.log("SELECT top 1 * FROM [FMSUAT].[dbo].[fms_userheri] h inner join fmsuat.. fms_users2 u on h.userId = u.userID where h.userId = " + userId + " order by h.id desc ");
            request.query("SELECT top 1 * FROM [FMSUAT].[dbo].[fms_userheri] h inner join fmsuat.. fms_users2 u on h.userId = u.userID where h.userId = " + userId + " order by h.id desc ", function (err, recordset2) {
                //console.log(recordset2["recordset"][0]);
                var entityID = recordset2["recordset"][0]['entityID'];
                var entityCode = recordset2["recordset"][0]['entityCode'];
                req.session.entityID = entityID;
                req.session.entityCode = entityCode;

                if (entityID == 1) {

                    request.query('SELECT * FROM [FMSUAT].[dbo].[vehicle_all]', function (err, recordset) {
                        if (err) console.log(err)

                        // send records as a response
                        ////console.log(recordset["recordsets"][0]);
                        res.render('all_vehicles',{ data1: recordset["recordsets"][0] , moment: moment });


                    });
                }
                else if (entityID == 2) {

                    request.query('SELECT * FROM [FMSUAT].[dbo].[vehicle_all] where regionID=' + entityCode + '', function (err, recordset) {
                        if (err) console.log(err)

                        // send records as a response
                        //console.log(recordset["recordsets"][0]);
                        console.log("entity" + entityCode);
                        res.render('all_vehicles', { data1: recordset["recordsets"][0], moment: moment });


                    });

                }
                else if (entityID == 3) {

                    request.query('SELECT * FROM [FMSUAT].[dbo].[vehicle_all] where areaID=' + entityCode + '', function (err, recordset) {
                        if (err) console.log(err)

                        // send records as a response
                        //console.log(recordset["recordsets"][0]);
                        console.log("entity" + entityCode);
                        res.render('all_vehicles', { data1: recordset["recordsets"][0], moment: moment });


                    });

                }
                else {
                    res.redirect('/dash');
                }
                // request.query('select * from fms_vehicle as fv inner join fms_region as fr on fr.id = fv.r_state_id inner join fms_area1_ on fr.id = fms_area1_.id  inner join fms_fuel_type on fms_fuel_type.id = fv.fuel_type_id', function (err, recordset) {

            });
        });

    }
    else {
        res.redirect("/login");
    }


};
exports.all_cards = function (req, res) {
    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();

        request.query('SELECT distinct([Card VRN]) as allocated_to,[Card PAN] as card_number,[Daily Limit Volume] as daily_limit,[Weekly Limit Volume] as weekly_limit,[Monthly Limit Volume] as monthly_limit,f.company_name ,[Card Expiry Date] as allocation_date,card_limit FROM [FMSUAT].[dbo].[excelim] m inner join dbo.fuel_consumption1 s on s.card_number = m.[Card PAN] inner join dbo.fleet_card f on f.id = s.company_id inner join dbo.vehicle_all v on v.reg_number =  s.v_number', function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            ////console.log(recordset["recordsets"][0]);
            res.render('card_list', { data1: recordset["recordsets"][0] ,moment: moment});


        });
    });
    // res.render('card_list');
};
exports.not_alloc = function (req, res) {
    var sql = require("mssql");


    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();

        request.query('SELECT  [fuel_card_no],[company_name] FROM [view_fuel_card_not_allocated]', function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            ////console.log(recordset["recordsets"][0]);
            res.render('card_not_allocate', { data1: recordset["recordsets"][0] });


        });
    });

};
exports.user_list = function (req, res) {
    var sql = require("mssql");



    // connect to your database


    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[users_view]', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                ////console.log(recordset["recordsets"][0]);
                res.render('rpt_users', { data1: recordset["recordsets"][0] });


            });
        });

    }
    else {
        res.redirect("/login");
    }


};
exports.rpt_emp_vehicle = function (req, res) {
    var sql = require("mssql");



    // connect to your database

    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query("SELECT [emp_code],[empName],[shift],[schoolID],[school_name],[local_name],[area_name],[region_name],[reg_number],[Package_Name]  FROM [fmsuat].[dbo].[vw_fms_emp_vehicle_allocation] where region_name!=''", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                ////console.log(recordset["recordsets"][0]);
                res.render('rpt_emp_vehicle', { data1: recordset["recordsets"][0] });


            });
        });
    }
    else {
        res.redirect("/login");
    }

};

exports.rpt_mntn_summery = function (req, res) {
    var sql = require("mssql");

    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();

        request.query('SELECT distinct card_number FROM [FMSUAT].[dbo].[fuel_consumption1] ', function (err, recordset) {
            if (err) console.log("Nahi Chalunga " + err)
            
            // send records as a response
            console.log(recordset["recordsets"][0]);
            res.render('rpt_mntn_summery',{cards:recordset["recordsets"][0]});

        });
    });

};
exports.rpt_gps_monthly = function (req, res) {

    var sql = require("mssql");


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[vehicle_all] ', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('rpt_gps_monthly', { data1: recordset["recordsets"][0] });


            });
        });
    }
    else {
        res.redirect("/login");
    }

};
exports.rpt_emp_wo_vehicle = function (req, res) {
    var sql = require("mssql");



    // connect to your database


    // connect to your database

    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query("SELECT [emp_code],[empName],[shift],[schoolID],[school_name],[local_name],[area_name],[region_name],[Package_Name]  FROM [fmsuat].[dbo].[vw_emp_without_vehicle] where region_name!=''", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('rpt_emp_wo_vehicle', { data1: recordset["recordsets"][0] });


            });
        });
    }
    else {
        res.redirect("/login");
    }

};
exports.rpt_gps_hourly = function (req, res) {
    var sql = require("mssql");

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[vehicle_all] ', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('rpt_gps_hourly', { data1: recordset["recordsets"][0] });


            });
        });
    }
    else {
        res.redirect("/login");
    }

};
exports.rpt_fuels = function (req, res) {

    userId = req.session.userId;
    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[vehicle_all] ', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('rpt_fuels', { data1: recordset["recordsets"][0], moment: moment });


            });
        });
    }
    else {
        res.redirect("/login");
    }
};
exports.manage_roles = function (req, res) {

    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();
            console.log("hamza ")
            request.query('SELECT  [id],[designation] FROM [FMSUAT].[dbo].[hcm_designation] ', function (err, recordset) {
                if (err) console.log(err)

                request.query("SELECT * FROM [fmsuat].[dbo].[f_roles]", function (err, recordset2) {
                    if (err) console.log(err)

                    request.query("SELECT fr.id as role_assign_id, hd.designation,f_ass.r_name FROM [fmsuat].[dbo].[f_roles_assign] as fr inner join [fmsuat].[dbo].hcm_designation as hd on fr.[user_id] =hd.id inner join [fmsuat].[dbo].[f_roles] as f_ass on f_ass.id = fr.role_id", function (err, recordset3) {
                        if (err) console.log(err)

                        request.query("SELECT distinct [department_id],[DepartmentName]FROM [FMSUAT].[dbo].[fms_users2]", function (err, recordset4) {
                            if (err) console.log(err)

                            res.render('role', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0] });
                        });
                    });
                });
            });
        });
    }
    else {
        res.redirect("/login");
    }
};

exports.edit_rols = function (req, res) {

    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        // var sql = require("mssql");


        // sql.connect(config, function (err) {

        //     if (err) console.log(err);


        //     var request = new sql.Request();
        //     console.log("hamza ")
        //     request.query('SELECT  [id],[designation] FROM [FMSUAT].[dbo].[hcm_designation] ', function (err, recordset) {
        //         if (err) console.log(err)

        //         request.query("SELECT * FROM [fmsuat].[dbo].[f_roles]", function (err, recordset2) {
        //             if (err) console.log(err)

        //             request.query("SELECT fr.id as role_assign_id, hd.designation,f_ass.r_name FROM [fmsuat].[dbo].[f_roles_assign] as fr inner join [fmsuat].[dbo].hcm_designation as hd on fr.[user_id] =hd.id inner join [fmsuat].[dbo].[f_roles] as f_ass on f_ass.id = fr.role_id", function (err, recordset3) {
        //                 if (err) console.log(err)

        //                 request.query("SELECT distinct [department_id],[DepartmentName]FROM [FMSUAT].[dbo].[fms_users2]", function (err, recordset4) {
        //                     if (err) console.log(err)

                            // res.render('edit_rols', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0] });
                            res.render('edit_tab_role');

        //                 });
        //             });
        //         });
        //     });
        // });
    }
    else {
        res.redirect("/login");
    }
};

exports.add__roles = function (req, res) {

    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        
        res.render('add__roles');

  
    }
    else {
        res.redirect("/login");
    }
};

exports.geo = function (req, res) {

    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();

        request.query('SELECT sc.Latitude_Value,sc.Longitude_Value,ss.Name,ss.schoolID FROM [FMSUAT].[dbo].[sms_School] as ss join fmsuat..sms_Campus as sc on sc.id = ss.campusID', function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            //console.log(recordset["recordsets"][0]);
            res.render('geo', { data1: recordset["recordsets"][0] });


        });
    });
};

exports.map = function (req, res) {

    var sql = require("mssql");
    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();
            console.log("SELECT distinct(f_vehnum), max(f_reportingtime) AS f_time,max(id) AS f_id FROM fmsuat.dbo.fms_fvehicles GROUP BY f_vehnum  ORDER BY f_vehnum;");
            // request.query('SELECT  distinct(reg_number) FROM [fmsuat].[dbo].[fms_vehicle] order by reg_number desc', function (err, recordset) {
            // request.query('SELECT distinct(f_vehnum), max(f_reportingtime) AS f_time,max(id) AS f_id FROM fmsuat.dbo.fms_fvehicles GROUP BY f_vehnum  ORDER BY f_vehnum;', function (err, recordset) {
            request.query('SELECT f_veh.area_name,f_veh.region_name, fm_ud.[userid],fm_ud.[deviceid],fm_v.reg_number,fm_v.last_update_by,fm_l.f_reportingtime,fm_l.f_lat,fm_l.f_lng,fm_l.f_speed,fm_l.g_ignition FROM [FMSUAT].[dbo].[fms_user_device] as fm_ud inner join fmsuat.dbo.fms_vehicle as fm_v on fm_ud.deviceid = fm_v.id inner join FMSUAT.dbo.fms_fvehicles as fm_l on fm_v.last_update_by = fm_l.id inner join FMSUAT..all_vehicles as f_veh on f_veh.id = fm_ud.deviceid', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('map', { data1: recordset["recordsets"][0] });

            });
        });
    }
    else {
        res.redirect("/login");
    }
};
exports.dash = function (req, res) {
    message = '';
    name_area = '';
    role_name = '';
    message = req.session.nameUser;
    userId = req.session.userId;
    console.log('ddd=' + userId);
    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();
            console.log("SELECT top 1 * FROM [FMSUAT].[dbo].[fms_userheri] h inner join fmsuat.. fms_users2 u on h.userId = u.userID where h.userId = " + userId + " order by h.id desc ");
            request.query("SELECT top 1 * FROM [FMSUAT].[dbo].[fms_userheri] h inner join fmsuat.. fms_users2 u on h.userId = u.userID where h.userId = " + userId + " order by h.id desc ", function (err, recordset2) {
                console.log(recordset2["recordsets"][0].length);
                if(recordset2["recordsets"][0].length>0)
                {
                    var entityID = recordset2["recordset"][0]['entityID'];
                    var entityCode = recordset2["recordset"][0]['entityCode'];
                    req.session.entityID = entityID;
                    req.session.entityCode = entityCode;
    
                    if (entityID == 1) {
                        name_area = 'TCF';
                        request.query('SELECT  distinct(COUNT(reg_number))  as total_vehicle FROM [fmsuat].[dbo].[fms_vehicle] where is_active = 1', function (err, recordset) {
                            if (err) console.log(err)
    
    
                            request.query("SELECT COunt(*) as total_bolan FROM [fmsuat].[dbo].[fms_vehicle] Where make = 'Bolan' and is_active = 1", function (err, recordset2) {
                                if (err) console.log(err)
    
                                request.query("SELECT count(*) as pick fROM [fmsuat].[dbo].[vehicle_all] where make='Bolan' and type_name  like  '%Pick and Drop' and is_active = 1", function (err, recordset3) {
                                    if (err) console.log(err)
    
                                    request.query("SELECT count(*) as pana FROM [fmsuat].[dbo].[vehicle_all] where make = 'Panorama' and is_active = 1", function (err, recordset4) {
                                        if (err) console.log(err)
    
                                        request.query("SELECT TOP 12 round(avg(km_per_ltr_gps),2) as 'average', count(vehicle_id) as 'vehicles',DATENAME(MONTH,as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps] WHERE DATEDIFF(month,as_on, GETDATE()) <= 14  GROUP BY  MONTH(as_on),as_on order by Year(as_on),month(as_on)", function (err, recordset5) {
                                            if (err) console.log(err)
                                            ////console.log(recordset5["recordsets"][0])
    
                                            request.query("SELECT  count(*) as t_vehicle,count(*)*100/(SELECT  count(*)+1 FROM [fmsuat].[dbo].[hcm_employee]) as total FROM [fmsuat].[dbo].[fms_emp_vehicle_allocation]", function (err, recordset6) {
                                                if (err) console.log(err)
                                                ////console.log(recordset6["recordsets"][0])
    
                                                request.query("SELECT round(avg(km_per_ltr_gps),0) as 'average',month(as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps]  WHERE YEAR(as_on) = '2020' GROUP BY  MONTH(as_on) order by month1 asc", function (err, recordset7) {
                                                    if (err) console.log(err)
                                                    ////console.log(recordset7["recordsets"][0])
                                                    request.query("SELECT COUNT(*) as total_faculty FROM [FMSUAT].[dbo].[vw_active_faculty]", function (err, recordset8) {
                                                        if (err) console.log(err)
                                                        ////console.log(recordset8["recordsets"][0])
                                                        request.query("SELECT count(DISTINCT(card_number)) as total,fl.company_name FROM [FMSUAT].[dbo].[fuel_consumption1] fc join dbo.vehicle_all v on v.reg_number = fc.v_number join dbo.fleet_card fl on fc.company_id = fl.id  group by fl.company_name", function (err, recordset9) {
                                                            if (err) console.log(err)
                                                            ////console.log(recordset9["recordsets"][0])
                                                            request.query("SELECT * from fuel_cost_graph order by as_on asc;", function (err, recordset10) {
                                                                if (err) console.log(err)
                                                                ////console.log(recordset10["recordsets"][0])
                                                                request.query("SELECT top 100 percent COUNT(reg_number) AS vehicles, utilization_mor AS util FROM  fmsuat.dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama')  GROUP BY utilization_mor order by utilization_mor", function (err, recordset11) {
                                                                    if (err) console.log(err)
    
                                                                    request.query("SELECT [qty] as tt,[make]FROM [fmsuat].[dbo].[vehicle_make_count] where make != 'Bolan'", function (err, recordset12) {
                                                                        if (err) console.log(err)
    
                                                                        // request.query("select * from fmsuat.dbo.fms_vehicle as fv inner join fmsuat.dbo.fms_region as fr on fr.id = fv.r_state_id inner join fmsuat.dbo.fms_area1 on fr.id = fms_area1.id  inner join fmsuat.dbo.fms_fuel_type on fms_fuel_type.id = fv.fuel_type_id", function (err, recordset13) {
                                                                        request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_all] where active = 1", function (err, recordset13) {
                                                                            if (err) console.log(err)
    
                                                                            request.query("SELECT distinct(type_name),count(id) as vehicles,type_id FROM [FMSUAT].[dbo].[vehicle] where type_id != 1 and is_active=1  and type_id !=16 group by type_name,type_id", function (err, recordset14) {
                                                                                if (err) console.log(err)
                                                                                request.query("SELECT  distinct(region_name), avg(utilization_mor) as avg FROM [fmsuat].[dbo].[vehicle_all] where  active=1 group by region_name order by avg desc", function (err, recordset15) {
                                                                                    if (err) console.log(err)
                                                                                    //console.log(recordset15["recordsets"][0])
    
                                                                                    request.query("SELECT count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 and active=1 and utilization_aft != 0", function (err, recordset16) {
                                                                                        if (err) console.log(err)
                                                                                        //console.log(recordset15["recordsets"][0])
    
                                                                                        request.query("SELECT count(*)  as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 or utilization_aft != 0 and active=1", function (err, recordset17) {
                                                                                            if (err) console.log(err)
                                                                                            //console.log(recordset15["recordsets"][0])
    
                                                                                            request.query("SELECT distinct(region_name),count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where active=1 group by region_name", function (err, recordset18) {
                                                                                                if (err) console.log(err)
                                                                                                //console.log(recordset15["recordsets"][0])
    
                                                                                                request.query("SELECT count(*)as suma FROM [FMSUAT].[dbo].[fms_vehicle] where function_type_id = 9 or function_type_id = 10 or function_type_id = 17 and is_active=1 ", function (err, recordset19) {
                                                                                                    if (err) console.log(err)
                                                                                                    //console.log(recordset15["recordsets"][0])
    
                                                                                                    request.query("SELECT COUNT(*) as total_users  FROM [FMSUAT].[dbo].[vw_emp_transport_allowed]", function (err, recordset20) {
                                                                                                        if (err) console.log(err)
                                                                                                        //console.log(recordset15["recordsets"][0])
    
                                                                                                        request.query("SELECT count(*) as emp_tagged FROM [FMSUAT].[dbo].[vw_fms_emp_vehicle_allocation]", function (err, recordset21) {
                                                                                                            if (err) console.log(err)
                                                                                                            //console.log(recordset15["recordsets"][0])
    
                                                                                                            request.query("SELECT count(distinct(emp_code)) as emp_n_tagged FROM [FMSUAT].[dbo].HCM_Conveyance where emp_code not in (select distinct(emp_id) from FMSUAT..fms_emp_vehicle_allocation)", function (err, recordset22) {
                                                                                                                if (err) console.log(err)
                                                                                                                //console.log(recordset15["recordsets"][0])
                                                                                                                request.query("SELECT  sum(capacity) AS capacity, sum(utilization_mor) AS util FROM  dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama')", function (err, recordset23) {
                                                                                                                    if (err) console.log(err)
                                                                                                                    //console.log(recordset15["recordsets"][0])
        
                                                                                                                    res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment,cap_util:recordset23["recordsets"][0] });
                                                                                                                });
                                                                                                                //res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment });
                                                                                                            });
                                                                                                        });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                });
    
                                                                            });
    
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
    
                                    });
                                });
                            });
                        });
    
                    }
                    else if (entityID == 2) {
                        request.query('SELECT distinct(COUNT(reg_number)) as total_vehicle FROM [FMSUAT].[dbo].[vehicle_all] where regionID = ' + entityCode + ' and is_active = 1', function (err, recordset) {
                            if (err) console.log(err)
    
    
                            request.query("SELECT COunt(*) as total_bolan FROM [FMSUAT].[dbo].[vehicle_all] Where make = 'Bolan' and  regionID=" + entityCode + " and is_active = 1", function (err, recordset2) {
                                if (err) console.log(err)
    
                                request.query("SELECT count(*) as pick fROM [fmsuat].[dbo].[vehicle_all] where make='Bolan' and type_name  like  '%Pick and Drop' and regionID = " + entityCode + " and is_active = 1", function (err, recordset3) {
                                    if (err) console.log(err)
    
                                    request.query("SELECT count(*) as pana FROM [fmsuat].[dbo].[vehicle_all] where make = 'Panorama' and regionID = " + entityCode + " and is_active = 1", function (err, recordset4) {
                                        if (err) console.log(err)
    
                                        request.query("SELECT TOP 12 round(avg(km_per_ltr_gps),2) as 'average', count(distinct(vehicle_id)) as 'vehicles',DATENAME(MONTH,as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps] WHERE DATEDIFF(month,as_on, GETDATE()) <= 14 and regionID ="+entityCode+" GROUP BY  MONTH(as_on),as_on order by Year(as_on),month(as_on)", function (err, recordset5) {
                                            if (err) console.log(err)
                                            ////console.log(recordset5["recordsets"][0])
    
                                            request.query("SELECT  count(*) as t_vehicle,count(*)*100/(SELECT  count(*)+1 FROM [fmsuat].[dbo].[hcm_employee]) as total FROM [fmsuat].[dbo].[fms_emp_vehicle_allocation]", function (err, recordset6) {
                                                if (err) console.log(err)
                                                ////console.log(recordset6["recordsets"][0])
    
                                                request.query("SELECT round(avg(km_per_ltr_gps),0) as 'average',month(as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps]  WHERE YEAR(as_on) = '2020' GROUP BY  MONTH(as_on) order by month1 asc", function (err, recordset7) {
                                                    if (err) console.log(err)
                                                    ////console.log(recordset7["recordsets"][0])
                                                    request.query("SELECT COUNT(*) as total_faculty FROM [FMSUAT].[dbo].[vw_active_faculty] where regionID=" + entityCode + "", function (err, recordset8) {
                                                        if (err) console.log(err)
                                                        ////console.log(recordset8["recordsets"][0])
                                                        request.query("SELECT count(DISTINCT(card_number)) as total,fl.company_name FROM [FMSUAT].[dbo].[fuel_consumption1] fc join dbo.vehicle_all v on v.reg_number = fc.v_number join dbo.fleet_card fl on fc.company_id = fl.id where v.regionID = "+entityCode+"  group by fl.company_name", function (err, recordset9) {
                                                            if (err) console.log(err)
                                                            ////console.log(recordset9["recordsets"][0])
                                                            request.query("SELECT TOP (12)*,DATENAME(MONTH,as_on)  as month1,round(total_fuel/vehicles,0) as avg1 FROM [FMSUAT].[dbo].[view_fuel_region_monthly] where region_id = "+entityCode+" order by as_on desc", function (err, recordset10) {
                                                                if (err) console.log(err)
                                                                ////console.log(recordset10["recordsets"][0])
                                                                request.query("SELECT top 100 percent COUNT(reg_number) AS vehicles, utilization_mor AS util FROM  fmsuat.dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama') and regionID = " + entityCode + " and active=1 GROUP BY utilization_mor order by utilization_mor", function (err, recordset11) {
                                                                    if (err) console.log(err)
    
                                                                    request.query("SELECT distinct(make),count(*) as tt from  [FMSUAT].[dbo].[vehicle] where regionID = " + entityCode + " and make != 'Bolan' and is_active=1 group by make ", function (err, recordset12) {
                                                                        if (err) console.log(err)
    
                                                                        // request.query("select * from fmsuat.dbo.fms_vehicle as fv inner join fmsuat.dbo.fms_region as fr on fr.id = fv.r_state_id inner join fmsuat.dbo.fms_area1 on fr.id = fms_area1.id  inner join fmsuat.dbo.fms_fuel_type on fms_fuel_type.id = fv.fuel_type_id", function (err, recordset13) {
                                                                        request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_all] where regionID=" + entityCode + " and  active = 1", function (err, recordset13) {
                                                                            if (err) console.log(err)
                                                                            var area_name = recordset13["recordset"][0]['region_name'];
                                                                            name_area = area_name;
    
                                                                            request.query("SELECT distinct(type_name),count(id) as vehicles,type_id FROM [FMSUAT].[dbo].[vehicle] where regionID=" + entityCode + " and type_id != 1  and type_id !=16  group by type_name,type_id ", function (err, recordset14) {
                                                                                if (err) console.log(err)
                                                                                request.query("SELECT  distinct(area_name) as region_name, avg(utilization_mor) as avg FROM [fmsuat].[dbo].[vehicle_all] where regionID = " + entityCode + " and active=1 group by area_name", function (err, recordset15) {
                                                                                    if (err) console.log(err)
                                                                                    //console.log(recordset["recordsets"][0])
    
                                                                                    request.query("SELECT count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 and utilization_aft != 0 and regionID = " + entityCode + " and active=1", function (err, recordset16) {
                                                                                        if (err) console.log(err)
                                                                                        //console.log(recordset15["recordsets"][0])
    
                                                                                        request.query("SELECT count(*)  as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 or utilization_aft != 0 and regionID = " + entityCode + " and active=1", function (err, recordset17) {
                                                                                            if (err) console.log(err)//console.log(recordset["recordsets"][0])
    
                                                                                            request.query("SELECT distinct(area_name) as region_name,count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where regionId  = " + entityCode + " and active=1 group by area_name", function (err, recordset18) {
                                                                                                if (err) console.log(err)
                                                                                                //console.log(recordset15["recordsets"][0])
    
                                                                                                request.query("SELECT count(*)as suma FROM [FMSUAT].[dbo].[vehicle_all] where type_id = 9 or type_id = 10 or type_id = 17 and regionId = " + entityCode + " and active=1 ", function (err, recordset19) {
                                                                                                    if (err) console.log(err)
                                                                                                    //console.log(recordset15["recordsets"][0])
    
                                                                                                    request.query("SELECT count(*) as total_users FROM [FMSUAT].[dbo].[vw_emp_transport_allowed] where regionID=" + entityCode+ "", function (err, recordset20) {
                                                                                                        if (err) console.log(err)
                                                                                                        //console.log(recordset15["recordsets"][0])
    
                                                                                                        request.query("SELECT count(*) as emp_tagged FROM [FMSUAT].[dbo].[vw_fms_emp_vehicle_allocation] where regionID = "+entityCode+"", function (err, recordset21) {
                                                                                                            if (err) console.log(err)
                                                                                                            //console.log(recordset15["recordsets"][0])
    
                                                                                                            request.query("SELECT sum(emps_nottagged) FROM [FMSUAT].[dbo].[tbl_facultyNotTagged] where RegionID = "+entityCode+"", function (err, recordset22) {
                                                                                                                        if (err) console.log(err)
                                                                                                                //console.log(recordset15["recordsets"][0])
                                                                                                                request.query("SELECT  sum(capacity) AS capacity, sum(utilization_mor) AS util FROM  dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama') and regionID = "+entityCode+" and active=1", function (err, recordset23) {
                                                                                                                    if (err) console.log(err)
                                                                                                                    //console.log(recordset15["recordsets"][0])
        
                                                                                                                    res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment,cap_util:recordset23["recordsets"][0] });
                                                                                                                });
                                                                                                               // res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment });
                                                                                                            });
                                                                                                        });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                });
    
                                                                            });
    
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
    
                                    });
                                });
                            });
                        });
                    }
                    else if (entityID == 3) {
    
                        request.query('SELECT distinct(COUNT(reg_number)) as total_vehicle FROM [FMSUAT].[dbo].[vehicle_all] where areaID=' + entityCode + ' and is_active = 1', function (err, recordset) {
                            if (err) console.log(err)
    
    
                            request.query("SELECT COunt(*) as total_bolan FROM [FMSUAT].[dbo].[vehicle_all] Where make = 'Bolan' and areaID=" + entityCode + " and is_active = 1", function (err, recordset2) {
                                if (err) console.log(err)
    
                                request.query("SELECT count(*) as pick fROM [fmsuat].[dbo].[vehicle_all] where make='Bolan' and type_name  like  '%Pick and Drop' and areaID = " + entityCode + " and is_active = 1", function (err, recordset3) {
                                    if (err) console.log(err)
    
                                    request.query("SELECT count(*) as pana FROM [fmsuat].[dbo].[vehicle_all] where make = 'Panorama' and areaID = " + entityCode + " and is_active = 1", function (err, recordset4) {
                                        if (err) console.log(err)
    
                                        request.query("SELECT TOP 12 round(avg(km_per_ltr_gps),2) as 'average', count(vehicle_id) as 'vehicles',DATENAME(MONTH,as_on) as 'month1',YEAR(as_on) FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps] WHERE DATEDIFF(month,as_on, GETDATE()) <= 17 and areaID = "+entityCode+"  GROUP BY  MONTH(as_on),as_on order by Year(as_on),month(as_on)", function (err, recordset5) {
                                            if (err) console.log(err)
                                            ////console.log(recordset5["recordsets"][0])
    
                                            request.query("SELECT  count(*) as t_vehicle,count(*)*100/(SELECT  count(*)+1 FROM [fmsuat].[dbo].[hcm_employee]) as total FROM [fmsuat].[dbo].[fms_emp_vehicle_allocation]", function (err, recordset6) {
                                                if (err) console.log(err)
                                                ////console.log(recordset6["recordsets"][0])
    
                                                request.query("SELECT round(avg(km_per_ltr_gps),0) as 'average',month(as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps]  WHERE YEAR(as_on) = '2020' GROUP BY  MONTH(as_on) order by month1 asc", function (err, recordset7) {
                                                    if (err) console.log(err)
                                                    ////console.log(recordset7["recordsets"][0])
                                                    request.query("SELECT COUNT(*) as total_faculty FROM [FMSUAT].[dbo].[vw_active_faculty] where areaID=" + entityCode + "", function (err, recordset8) {
                                                        if (err) console.log(err)
                                                        ////console.log(recordset8["recordsets"][0])
                                                        request.query("SELECT count(DISTINCT(card_number)) as total,fl.company_name FROM [FMSUAT].[dbo].[fuel_consumption1] fc join dbo.vehicle_all v on v.reg_number = fc.v_number join dbo.fleet_card fl on fc.company_id = fl.id where v.areaID = "+entityCode+" group by fl.company_name", function (err, recordset9) {
                                                            if (err) console.log(err)
                                                            ////console.log(recordset9["recordsets"][0])
                                                            request.query("SELECT TOP (12)*,DATENAME(MONTH,as_on) as month1,round(total_fuel/vehicles,2) as avg1 FROM [FMSUAT].[dbo].[view_fuel_area_monthly] where id =  "+entityCode+" order by as_on desc", function (err, recordset10) {
                                                                if (err) console.log(err)
                                                                ////console.log(recordset10["recordsets"][0])
                                                                request.query("SELECT top 100 percent COUNT(reg_number) AS vehicles, utilization_mor AS util FROM  fmsuat.dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama') and areaID = " + entityCode + " GROUP BY utilization_mor order by utilization_mor", function (err, recordset11) {
                                                                    if (err) console.log(err)
    
                                                                    request.query("SELECT distinct(make),count(*) as tt from  [FMSUAT].[dbo].[vehicle] where areaID = " + entityCode + " and make != 'Bolan' group by make ", function (err, recordset12) {
                                                                        if (err) console.log(err)
    
                                                                        // request.query("select * from fmsuat.dbo.fms_vehicle as fv inner join fmsuat.dbo.fms_region as fr on fr.id = fv.r_state_id inner join fmsuat.dbo.fms_area1 on fr.id = fms_area1.id  inner join fmsuat.dbo.fms_fuel_type on fms_fuel_type.id = fv.fuel_type_id", function (err, recordset13) {
                                                                        request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_all] where areaID=" + entityCode + " and  active = 1", function (err, recordset13) {
                                                                            if (err) console.log(err)
                                                                            if(recordset13["recordset"].length>0)
                                                                            var area_name = recordset13["recordset"][0]['area_name'];
                                                                            name_area = area_name;
                                                                            console.log("Hamza name " + area_name);
    
                                                                            request.query("SELECT distinct(type_name),count(id) as vehicles,type_id FROM [FMSUAT].[dbo].[vehicle] where areaID=" + entityCode + " and type_id != 1  and type_id !=16  group by type_name,type_id ", function (err, recordset14) {
                                                                                if (err) console.log(err)
                                                                                request.query("SELECT  distinct(area_name) as region_name, avg(utilization_mor) as avg FROM [fmsuat].[dbo].[vehicle_all] where areaID = " + entityCode + " group by area_name", function (err, recordset15) {
                                                                                    if (err) console.log(err)
                                                                                    //console.log(recordset["recordsets"][0])
    
                                                                                    request.query("SELECT count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 and utilization_aft != 0 and areaID = " + entityCode + " ", function (err, recordset16) {
                                                                                        if (err) console.log(err)
                                                                                        //console.log(recordset15["recordsets"][0])
    
                                                                                        request.query("SELECT count(*)  as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 or utilization_aft != 0 and areaID = " + entityCode + " ", function (err, recordset17) {
                                                                                            if (err) console.log(err)//console.log(recordset["recordsets"][0])
    
                                                                                            //console.log(recordset["recordsets"][0])
    
                                                                                            request.query("SELECT distinct(area_name) as region_name, count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where areaId = " + entityCode + " and active = 1 group by area_name", function (err, recordset18) {
                                                                                                if (err) console.log(err)
                                                                                                if (recordset15["recordsets"][0].length != 0)
                                                                                                    request.query("SELECT count(*)as suma FROM [FMSUAT].[dbo].[vehicle_all] where type_id = 9 or type_id = 10 or type_id = 17 and areaId = " + entityCode + " and active= 1", function (err, recordset19) {
                                                                                                        if (err) console.log(err)
                                                                                                        //console.log(recordset15["recordsets"][0])
    
                                                                                                        request.query("SELECT count(*) as total_users FROM [FMSUAT].[dbo].[vw_emp_transport_allowed] where areaID=" + entityCode + "", function (err, recordset20) {
                                                                                                            if (err) console.log(err)
                                                                                                            //console.log(recordset15["recordsets"][0])
    
                                                                                                            request.query("SELECT count(*) as emp_tagged FROM [FMSUAT].[dbo].[vw_fms_emp_vehicle_allocation] where areaID = "+entityCode+"", function (err, recordset21) {
                                                                                                                if (err) console.log(err)
                                                                                                                //console.log(recordset15["recordsets"][0])
        
                                                                                                                request.query("SELECT sum(emps_nottagged) as emp_n_tagged FROM [FMSUAT].[dbo].[tbl_facultyNotTagged] where fms_area_id = "+entityCode+"", function (err, recordset22) {
                                                                                                                    if (err) console.log(err)
                                                                                                                    //console.log(recordset15["recordsets"][0])
                                                                                                                    request.query("SELECT  sum(capacity) AS capacity, sum(utilization_mor) AS util FROM  dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama') and areaID= "+entityCode+"", function (err, recordset23) {
                                                                                                                        if (err) console.log(err)
                                                                                                                        //console.log(recordset15["recordsets"][0])
            
                                                                                                                        res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment,cap_util:recordset23["recordsets"][0] });
                                                                                                                    });
                                                                                                                   // res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment });
                                                                                                                });
                                                                                                            });
                                                                                                        });
                                                                                                    });
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                });
    
                                                                            });
    
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
    
                                    });
                                });
                            });
                        });
                    }
                    else {
                        res.redirect("/login");
                    }
                }
                else {
                    res.redirect("/login");
                }
                

            });
        });
    }
    else {
        res.redirect("/login");
    }

};
exports.dash2 = function (req, res) {
    var entityCode = req.query.id;

    userId = req.session.userId;
    console.log('ddd=' + userId);
    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT distinct(COUNT(reg_number)) as total_vehicle FROM [FMSUAT].[dbo].[vehicle_all] where regionID = ' + entityCode + ' and is_active = 1', function (err, recordset) {
                if (err) console.log(err)


                request.query("SELECT COunt(*) as total_bolan FROM [FMSUAT].[dbo].[vehicle_all] Where make = 'Bolan' and  regionID=" + entityCode + " and is_active = 1", function (err, recordset2) {
                    if (err) console.log(err)

                    request.query("SELECT count(*) as pick fROM [fmsuat].[dbo].[vehicle_all] where make='Bolan' and type_name  like  '%Pick and Drop' and regionID = " + entityCode + " and is_active = 1", function (err, recordset3) {
                        if (err) console.log(err)

                        request.query("SELECT count(*) as pana FROM [fmsuat].[dbo].[vehicle_all] where make = 'Panorama' and regionID = " + entityCode + " and is_active = 1", function (err, recordset4) {
                            if (err) console.log(err)

                            request.query("SELECT TOP 12 round(avg(km_per_ltr_gps),2) as 'average', count(vehicle_id) as 'vehicles',DATENAME(MONTH,as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps] WHERE DATEDIFF(month,as_on, GETDATE()) <= 14 and regionID = "+entityCode+" GROUP BY  MONTH(as_on),as_on order by Year(as_on),month(as_on)", function (err, recordset5) {
                                if (err) console.log(err)
                                ////console.log(recordset5["recordsets"][0])

                                request.query("SELECT  count(*) as t_vehicle,count(*)*100/(SELECT  count(*)+1 FROM [fmsuat].[dbo].[hcm_employee]) as total FROM [fmsuat].[dbo].[fms_emp_vehicle_allocation]", function (err, recordset6) {
                                    if (err) console.log(err)
                                    ////console.log(recordset6["recordsets"][0])

                                    request.query("SELECT round(avg(km_per_ltr_gps),0) as 'average',month(as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps]  WHERE YEAR(as_on) = '2020' GROUP BY  MONTH(as_on) order by month1 asc", function (err, recordset7) {
                                        if (err) console.log(err)
                                        ////console.log(recordset7["recordsets"][0])
                                        request.query("SELECT COUNT(*) as total_faculty FROM [FMSUAT].[dbo].[vw_active_faculty] where regionID=" + entityCode + "", function (err, recordset8) {
                                            if (err) console.log(err)
                                            ////console.log(recordset8["recordsets"][0])
                                            request.query("SELECT count(DISTINCT(card_number)) as total,fl.company_name FROM [FMSUAT].[dbo].[fuel_consumption1] fc join dbo.vehicle_all v on v.reg_number = fc.v_number join dbo.fleet_card fl on fc.company_id = fl.id where v.regionId = "+entityCode+" group by fl.company_name", function (err, recordset9) {
                                                if (err) console.log(err)
                                                ////console.log(recordset9["recordsets"][0])
                                                request.query("SELECT TOP (12)*,DATENAME(MONTH,as_on)  as month1,round(total_fuel/vehicles,0) as avg1 FROM [FMSUAT].[dbo].[view_fuel_region_monthly] where region_id = "+entityCode+" order by as_on desc", function (err, recordset10) {
                                                    if (err) console.log(err)
                                                    ////console.log(recordset10["recordsets"][0])
                                                    request.query("SELECT top 100 percent COUNT(reg_number) AS vehicles, utilization_mor AS util FROM  fmsuat.dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama') and regionID = " + entityCode + " GROUP BY utilization_mor order by utilization_mor", function (err, recordset11) {
                                                        if (err) console.log(err)

                                                        request.query("SELECT distinct(make),count(*) as tt from  [FMSUAT].[dbo].[vehicle] where regionID = " + entityCode + " and make != 'Bolan' group by make ", function (err, recordset12) {
                                                            if (err) console.log(err)

                                                            // request.query("select * from fmsuat.dbo.fms_vehicle as fv inner join fmsuat.dbo.fms_region as fr on fr.id = fv.r_state_id inner join fmsuat.dbo.fms_area1 on fr.id = fms_area1.id  inner join fmsuat.dbo.fms_fuel_type on fms_fuel_type.id = fv.fuel_type_id", function (err, recordset13) {
                                                            request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_all] where regionID=" + entityCode + "", function (err, recordset13) {
                                                                if (err) console.log(err)
                                                                var area_name = recordset13["recordset"][0]['region_name'];
                                                                name_area = area_name;

                                                                request.query("SELECT distinct(type_name),count(id) as vehicles,type_id FROM [FMSUAT].[dbo].[vehicle] where regionID=" + entityCode + " and type_id != 1  and type_id !=16  group by type_name,type_id ", function (err, recordset14) {
                                                                    if (err) console.log(err)
                                                                    request.query("SELECT  distinct(area_name) as region_name, avg(utilization_mor) as avg FROM [fmsuat].[dbo].[vehicle_all] where regionID = " + entityCode + "group by area_name", function (err, recordset15) {
                                                                        if (err) console.log(err)
                                                                        //console.log(recordset["recordsets"][0])

                                                                        request.query("SELECT count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 and utilization_aft != 0 and regionID = " + entityCode + " ", function (err, recordset16) {
                                                                            if (err) console.log(err)
                                                                            //console.log(recordset15["recordsets"][0])

                                                                            request.query("SELECT count(*)  as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0  and regionID = " + entityCode + " ", function (err, recordset17) {
                                                                                if (err) console.log(err)//console.log(recordset["recordsets"][0])

                                                                                request.query("SELECT distinct(area_name) as region_name,count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where regionId  = " + entityCode + " group by area_name", function (err, recordset18) {
                                                                                    if (err) console.log(err)
                                                                                    //console.log(recordset15["recordsets"][0])

                                                                                    request.query("SELECT count(*)as suma FROM [FMSUAT].[dbo].[vehicle_all] where type_id = 9 or type_id = 10 or type_id = 17 and regionId = " + entityCode + " ", function (err, recordset19) {
                                                                                        if (err) console.log(err)
                                                                                        //console.log(recordset15["recordsets"][0])

                                                                                        request.query("SELECT count(*) as total_users FROM [FMSUAT].[dbo].[vw_emp_transport_allowed] where regionID=" + entityCode + "", function (err, recordset20) {
                                                                                            if (err) console.log(err)
                                                                                            //console.log(recordset15["recordsets"][0])

                                                                                            request.query("SELECT count(*) as emp_tagged FROM [FMSUAT].[dbo].[vw_fms_emp_vehicle_allocation] where regionID = "+entityCode+"", function (err, recordset21) {
                                                                                                if (err) console.log(err)
                                                                                                //console.log(recordset15["recordsets"][0])

                                                                                                request.query("SELECT sum(emps_nottagged) as emp_n_tagged FROM [FMSUAT].[dbo].[tbl_facultyNotTagged] where RegionID = "+entityCode+"", function (err, recordset22) {
                                                                                                   if (err) console.log(err)
                                                                                                    //console.log(recordset15["recordsets"][0])
                                                                                                    request.query("SELECT  sum(capacity) AS capacity, sum(utilization_mor) AS util FROM  dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama') and regionID= "+entityCode+"", function (err, recordset23) {
                                                                                                        if (err) console.log(err)
                                                                                                        //console.log(recordset15["recordsets"][0])

                                                                                                        res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment,cap_util:recordset23["recordsets"][0] });
                                                                                                    });
                                                                                                    //res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment });
                                                                                                });
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });
                                                                    });

                                                                });

                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });

                        });
                    });
                });
            });
        });
    }
    else {
        res.redirect("/login");
    }

};
exports.dash3 = function (req, res) {
    var entityCode = req.query.id;

    userId = req.session.userId;
    console.log('ddd=' + userId);
    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();


            request.query('SELECT distinct(COUNT(reg_number)) as total_vehicle FROM [FMSUAT].[dbo].[vehicle_all] where areaID=' + entityCode + ' and is_active = 1', function (err, recordset) {
                if (err) console.log(err)


                request.query("SELECT COunt(*) as total_bolan FROM [FMSUAT].[dbo].[vehicle_all] Where make = 'Bolan' and areaID=" + entityCode + " and is_active = 1", function (err, recordset2) {
                    if (err) console.log(err)

                    request.query("SELECT count(*) as pick fROM [fmsuat].[dbo].[vehicle_all] where make='Bolan' and type_name  like  '%Pick and Drop' and areaID = " + entityCode + " and is_active = 1", function (err, recordset3) {
                        if (err) console.log(err)

                        request.query("SELECT count(*) as pana FROM [fmsuat].[dbo].[vehicle_all] where make = 'Panorama' and areaID = " + entityCode + " and is_active = 1", function (err, recordset4) {
                            if (err) console.log(err)

                            request.query("SELECT TOP 12 round(avg(km_per_ltr_gps),2) as 'average', count(vehicle_id) as 'vehicles',DATENAME(MONTH,as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps] WHERE DATEDIFF(month,as_on, GETDATE()) <= 14 and areaID = "+entityCode+" GROUP BY  MONTH(as_on),as_on order by Year(as_on),month(as_on)", function (err, recordset5) {
                                if (err) console.log(err)
                                ////console.log(recordset5["recordsets"][0])

                                request.query("SELECT  count(*) as t_vehicle,count(*)*100/(SELECT  count(*)+1 FROM [fmsuat].[dbo].[hcm_employee]) as total FROM [fmsuat].[dbo].[fms_emp_vehicle_allocation]", function (err, recordset6) {
                                    if (err) console.log(err)
                                    ////console.log(recordset6["recordsets"][0])

                                    request.query("SELECT round(avg(km_per_ltr_gps),0) as 'average',month(as_on) as 'month1' FROM [FMSUAT].[dbo].[view_fuel_km_per_ltr_gps]  WHERE YEAR(as_on) = '2020' GROUP BY  MONTH(as_on) order by month1 asc", function (err, recordset7) {
                                        if (err) console.log(err)
                                        ////console.log(recordset7["recordsets"][0])
                                        request.query("SELECT COUNT(*) as total_faculty FROM [FMSUAT].[dbo].[vw_active_faculty] where areaID=" + entityCode + "", function (err, recordset8) {
                                            if (err) console.log(err)
                                            ////console.log(recordset8["recordsets"][0])
                                            request.query("SELECT count(DISTINCT(card_number)) as total,fl.company_name FROM [FMSUAT].[dbo].[fuel_consumption1] fc join dbo.vehicle_all v on v.reg_number = fc.v_number join dbo.fleet_card fl on fc.company_id = fl.id where v.areaID = "+entityCode+" group by fl.company_name", function (err, recordset9) {
                                                if (err) console.log(err)
                                                ////console.log(recordset9["recordsets"][0])
                                                request.query("SELECT TOP (12)*,DATENAME(MONTH,as_on) as month1,round(total_fuel/vehicles,2) as avg1 FROM [FMSUAT].[dbo].[view_fuel_area_monthly] where id =  "+entityCode+" order by as_on desc", function (err, recordset10) {
                                                    if (err) console.log(err)
                                                    ////console.log(recordset10["recordsets"][0])
                                                    request.query("SELECT top 100 percent COUNT(reg_number) AS vehicles, utilization_mor AS util FROM  fmsuat.dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama') and areaID = " + entityCode + " GROUP BY utilization_mor order by utilization_mor", function (err, recordset11) {
                                                        if (err) console.log(err)

                                                        request.query("SELECT distinct(make),count(*) as tt from  [FMSUAT].[dbo].[vehicle] where areaID = " + entityCode + " and make != 'Bolan' group by make ", function (err, recordset12) {
                                                            if (err) console.log(err)

                                                            // request.query("select * from fmsuat.dbo.fms_vehicle as fv inner join fmsuat.dbo.fms_region as fr on fr.id = fv.r_state_id inner join fmsuat.dbo.fms_area1 on fr.id = fms_area1.id  inner join fmsuat.dbo.fms_fuel_type on fms_fuel_type.id = fv.fuel_type_id", function (err, recordset13) {
                                                            request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_all] where areaID=" + entityCode + "", function (err, recordset13) {
                                                                if (err) console.log(err)
                                                                var area_name = recordset13["recordset"][0]['area_name'];
                                                                name_area = area_name;
                                                                console.log("Hamza name " + area_name);

                                                                request.query("SELECT distinct(type_name),count(id) as vehicles,type_id FROM [FMSUAT].[dbo].[vehicle] where areaID=" + entityCode + " and type_id != 1  and type_id !=16  group by type_name,type_id ", function (err, recordset14) {
                                                                    if (err) console.log(err)
                                                                    request.query("SELECT  distinct(area_name) as region_name, avg(utilization_mor) as avg FROM [fmsuat].[dbo].[vehicle_all] where areaID = " + entityCode + " group by area_name", function (err, recordset15) {
                                                                        if (err) console.log(err)
                                                                        //console.log(recordset["recordsets"][0])

                                                                        request.query("SELECT count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 and utilization_aft != 0 and areaID = " + entityCode + " ", function (err, recordset16) {
                                                                            if (err) console.log(err)
                                                                            //console.log(recordset15["recordsets"][0])

                                                                            request.query("SELECT count(*)  as count FROM [FMSUAT].[dbo].[vehicle_all] where utilization_mor != 0 and areaID = " + entityCode + " ", function (err, recordset17) {
                                                                                if (err) console.log(err)//console.log(recordset["recordsets"][0])


                                                                                request.query("SELECT distinct(area_name) as region_name, count(*) as count FROM [FMSUAT].[dbo].[vehicle_all] where areaId = " + entityCode + " group by area_name", function (err, recordset18) {
                                                                                    if (err) console.log(err)
                                                                                    if (recordset15["recordsets"][0].length != 0)
                                                                                        request.query("SELECT count(*)as suma FROM [FMSUAT].[dbo].[vehicle_all] where type_id = 9 or type_id = 10 or type_id = 17 and areaId = " + entityCode + " and is_active= 1", function (err, recordset19) {
                                                                                            if (err) console.log(err)
                                                                                            //console.log(recordset15["recordsets"][0])

                                                                                            request.query("SELECT count(*) as total_users FROM [FMSUAT].[dbo].[vw_emp_transport_allowed] where areaID=" + entityCode + "", function (err, recordset20) {
                                                                                                if (err) console.log(err)
                                                                                                //console.log(recordset15["recordsets"][0])

                                                                                                request.query("SELECT count(*) as emp_tagged FROM [FMSUAT].[dbo].[vw_fms_emp_vehicle_allocation] where areaID=" + entityCode + "", function (err, recordset21) {
                                                                                                    if (err) console.log(err)
                                                                                                    //console.log(recordset15["recordsets"][0])

                                                                                                    request.query("SELECT count(*) as emp_n_tagged FROM [FMSUAT].[dbo].tbl_facultyNotTagged where fms_area_id=" + entityCode + "", function (err, recordset22) {
                                                                                                        if (err) console.log(err)
                                                                                                        //console.log(recordset15["recordsets"][0])
                                                                                                        request.query("SELECT  sum(capacity) AS capacity, sum(utilization_mor) AS util FROM  dbo.vehicle_all WHERE (type_id = 1) AND (make = 'Bolan' or make = 'Panorama') and areaID= "+entityCode+"", function (err, recordset23) {
                                                                                                            if (err) console.log(err)
                                                                                                            //console.log(recordset15["recordsets"][0])

                                                                                                            res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment,cap_util:recordset23["recordsets"][0] });
                                                                                                        });
                                                                                                        //res.render('dash', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], data7: recordset7["recordsets"][0], data8: recordset8["recordsets"][0], data9: recordset9["recordsets"][0], data10: recordset10["recordsets"][0], data11: recordset11["recordsets"][0], data12: recordset12["recordsets"][0], data13: recordset13["recordsets"][0], data14: recordset14["recordsets"][0], data15: recordset15["recordsets"][0], data16: recordset16["recordsets"][0], data17: recordset17["recordsets"][0], data18: recordset18["recordsets"][0], staff: recordset19["recordsets"][0], total_users: recordset20["recordsets"][0], emp_tagged: recordset21["recordsets"][0], emp_n_tagged: recordset22["recordsets"][0], message: message, name_area: name_area, moment: moment });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        });
                                                                                });
                                                                            });
                                                                        });
                                                                    });

                                                                });

                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });

                        });
                    });
                });
            });
        });
    }
    else {
        res.redirect("/login");
    }

};
exports.rpt_excep_monthly_entries = function (req, res) {

    res.render('rpt_excep_monthly_entries');
};
exports.test_table = function (req, res) {

    res.render('test_table');
};
exports.excel_import = function (req, res) {

    res.render('excel_import');
};
exports.sidebar = function (req, res) {

    res.render('sidebar');
};
exports.forms = function (req, res) {

    res.render('forms');
};
exports.updateVehicle = function (req, res) {
    //console.log(req.id);
    
    var sql = require("mssql");
    var entityID = req.session.entityID;
    var entityCode = req.session.entityCode;
    console.log(entityID);
    console.log(entityCode);
    userId = req.session.userId;
    console.log('ddd=' + userId);
    if (userId != null) {
       
        messaging='TCF';
        console.log("111")
        var sql = require("mssql");
        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            request.query('SELECT TOP (12) [vehicle_id],[as_on],round([km_per_ltr_gps],2) as gps FROM [fmsuat].[dbo].[view_fuel_km_per_ltr_gps] where vehicle_id =' + req.id + '  order by as_on desc', function (err, recordset) {
                if (err) console.log(err)
                request.query('SELECT TOP (12) [as_on],round([rs_per_km_gps],2) as rs_per_km FROM [fmsuat].[dbo].[view_fuel_km_per_ltr_gps] where vehicle_id = ' + req.id + ' order by as_on desc', function (err, recordset2) {
                    if (err) console.log(err)
                    // send records as a response
                    request.query('SELECT TOP (12) round([sum_cng_cash]+[sum_cng_cc],2) as cng,round([total_fuel],2) as total,[as_on] FROM [fmsuat].[dbo].[view_fuel_vehicle_monthly] where vehicle_id = ' + req.id + ' order by as_on desc', function (err, recordset3) {
                        if (err) console.log(err)
                        // send records as a response
                        request.query('SELECT TOP (12) [as_on],[GPSDistance],[ReportedDistance] FROM [fmsuat].[dbo].[view_fuel_km_per_ltr_gps] where vehicle_id = ' + req.id + ' order by as_on desc', function (err, recordset4) {
                            if (err) console.log(err)
                            // send records as a response
                            request.query('SELECT * FROM [fmsuat].[dbo].[vehicle_all] where id=' + req.id + '', function (err, recordset5) {
                                if (err) console.log(err)
                                // send records as a response
                                console.log("SELECT * FROM [fmsuat].[dbo].[vehicle_all] where id='" + req.id + "'");

                                var vehicle_id = recordset5["recordsets"][0][0]['reg_number'];
                                request.query("SELECT area.id as area_id,allocation.id as veh_id,* FROM [fmsuat].[dbo].[view_allocation_history] as allocation join fmsuat.dbo.fms_area1 as area on area.area_name = allocation.prev_area  where reg_number = '" + vehicle_id + "' order by created_on asc", function (err, recordset6) {
                                    if (err) console.log(err)
                                    // var new_region = recordset6["recordsets"][0][0]['new_region'];
                                    // console.log("naya region "+new_region);
                                    // send records as a response
                                    console.log("recordset6");
                                    //console.log(recordset6["recordsets"][0])
                                    request.query("select distinct(make) from vehicle_all", function (err, recordset7) {
                                        if (err) console.log(err)
                                        // send records as a response
                                        request.query("select distinct(state_name),id from fms_reg_state where state_name != 'n/a' order by state_name desc", function (err, recordset8) {
                                            if (err) console.log(err)
                                            // send records as a response
                                            ////console.log(recordset8)
                                            request.query("SELECT [id],[type_name]FROM [FMSUAT].[dbo].[fms_vehicle_type] where id!=6 and id!=19 and id!=20 order by type_name asc", function (err, recordset9) {
                                                if (err) console.log(err)
                                                request.query("SELECT as_on,[GPSDistance] FROM [fmsuat].[dbo].[view_fuel_km_per_ltr_gps] where vehicle_id = " + req.id + " order by as_on desc", function (err, recordset10) {
                                                    if (err) console.log(err)
                                                    // send records as a response
                                                    request.query("SELECT [reg_number],[as_on],[Total_Fuel],[pt_cash_lt],[pt_cc_lt],[cng_cash_lt] ,[cng_cc_lt] FROM [view_fuel_km_per_ltr_gps] where vehicle_id = " + req.id + " order by as_on desc", function (err, recordset11) {
                                                        if (err) console.log(err)
                                                        // send records as a response
                                                        request.query("SELECT  [bill_date],[bill_amount] ,[details],[odometer],[created_on],[created_by],[bill_no],[repairhead],[vendor_name],[fname],[lname]FROM [fmsuat].[dbo].[view_maintenance] where vehicle_id = " + req.id + " order by bill_date desc ", function (err, recordset12) {
                                                            if (err) console.log(err)
                                                            // send records as a response
                                                            request.query("SELECT *  FROM [fmsuat].[dbo].[fms_region] ", function (err, recordset13) {
                                                                if (err) console.log(err)
                                                                // send records as a response
                                                                // //console.log(recordset13["recordsets"][0]);
                                                                request.query("SELECT * FROM [FMSUAT].[dbo].[fms_users2]  as u join dbo.vw_all_employees v on u.Employee_Code = v.[employee code] join dbo.vehicle_all a on a.areaID = v.areaID where u.designationId= 47 and userID NOT IN (SELECT driver_id  from driver_vehi_asign ) and a.id = "+req.id+"", function (err, recordset14) {
                                                                    if (err) console.log(err)
                                                                    // send records as a response
                                                                    // //console.log(recordset12["recordsets"][0]);
                                                                    request.query("SELECT * FROM [FMSUAT].[dbo].[driver_assign] where id = " + req.id + " ", function (err, recordset15) {
                                                                        if (err) console.log(err)
                                                                        // send records as a response
                                                                        // //console.log(recordset12["recordsets"][0]);
                                                                        request.query("SELECT * FROM [FMSUAT].[dbo].[stolen_vehicle] where id = " + req.id + " ", function (err, recordset16) {
                                                                            if (err) console.log(err)
                                                                            request.query("SELECT*FROM [FMSUAT].[dbo].[fms_fuel_type]", function (err, recordset17) {
                                                                                if (err) console.log(err)
                                                                                // send records as a response
                                                                                //console.log(recordset17);
                                                                                request.query("SELECT schoolID,Name FROM [FMSUAT].[dbo].[vw_school_search]", function (err, recordset18) {
                                                                                    if (err) console.log(err)
                                                                                    // send records as a response
                                                                                    //console.log(recordset18);
                                                                                    request.query("SELECT *  FROM [fmsuat].[dbo].[vw_fms_emp_vehicle_allocation] where vehicle_id='" + req.id + "'", function (err, recordset19) {
                                                                                        if (err) console.log(err)
                                                                                        // send records as a response
                                                                                        //console.log(recordset19);
                                                                                        request.query("SELECT *  FROM [FMSUAT].[dbo].[view_fuel_vehicle_monthly] where vehicle_id = '" + req.id + "' order by as_on desc", function (err, recordset20) {
                                                                                            if (err) console.log(err)
                                                                                            // send records as a response
                                                                                            // console.log("SELECT [id],[driver_id],[driver_name],[vehicle_name],[user_id] FROM [FMSUAT].[dbo].[driver_vehi_asign_h] where vehicle_name ='" + vehicle_id + "'")
                                                                                            request.query("SELECT [id],[driver_id],[driver_name],[vehicle_name],[user_id] FROM [FMSUAT].[dbo].[driver_vehi_asign_h] where vehicle_name ='" + vehicle_id + "'", function (err, recordset21) {
                                                                                                if (err) console.log(err)
                                                                                                // send records as a response
                                                                                                console.log(recordset21);

                                                                                                request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_make]", function (err, recordset22) {
                                                                                                    if (err) console.log(err)
                                                                                                    // send records as a response
                                                                                                    console.log(recordset21);

                                                                                                    request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_all] where id=" + req.id + "", function (err, recordset23) {
                                                                                                        if (err) console.log(err)
                                                                                                        // send records as a response
                                                                                                        var new_region_id = recordset23["recordsets"][0][0]['regionID'];
                                                                                                        console.log("naya region " + new_region_id);

                                                                                                        request.query("SELECT * FROM [fmsuat].[dbo].[fms_area1] WHERE region_id = " + new_region_id + "", function (err, recordset24) {
                                                                                                            if (err) console.log(err)
                                                                                                            // send records as a response


                                                                                                            request.query("SELECT * FROM [FMSUAT].[dbo].[monthlyDistance] where vehicle_id = '" + req.id + "'", function (err, recordset25) {
                                                                                                                if (err) console.log(err)
                                                                                                                // send records as a response


                                                                                                                request.query("SELECT fl.id,fl.del_date,fl.v_number,fl.qunatity,fl.unit_price,fl.gross_purchase,fl.card_number,fl.fuel_type,fc.company_name FROM [FMSUAT].[dbo].[fuel_consumption1] as fl inner join [FMSUAT].[dbo].[fleet_card] as fc on fl.company_id=fc.id where fl.v_number='" + vehicle_id + "'", function (err, recordset26) {
                                                                                                                    if (err) console.log(err)
                                                                                                                    // send records as a response


                                                                                                                    request.query("SELECT * FROM [FMSUAT].[dbo].[vw_update_log] where reg_number = '"+vehicle_id+"'", function (err, recordset27) {
                                                                                                                        if (err) console.log(err)
                                                                                                                        // send records as a response


                                                                                                                        request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_status_history] where vehicle_id='" + req.id + "' order by time asc", function (err, recordset28) {
                                                                                                                            if (err) console.log(err)
                                                                                                                            // send records as a response
    
    
                                                                                                                            request.query("SELECT * FROM [FMSUAT].[dbo].[fms_users2]  as u where u.designationId= 1133", function (err, recordset29) {
                                                                                                                                if (err) console.log(err)
                                                                                                                                // send records as a response
        
        
                                                                                                                                request.query("SELECT top(1) * FROM [FMSUAT].[dbo].[vehi_responsible_person] as vr inner join [FMSUAT].[dbo].[fms_users2] as fu on vr.person_id=fu.userID where vehicle_id='"+req.id+"' order by vr.id desc ", function (err, recordset30) {
                                                                                                                                    if (err) console.log(err)
                                                                                                                                    // send records as a response
            
                                                                                                                                    request.query("SELECT card_number,v_number,round(sum(CAST(gross_purchase AS float)),2) as sum ,round(sum(CAST(qunatity AS float)),2) as quantity,round(avg(CAST(unit_price AS float)),2) as price  FROM [FMSUAT].[dbo].[fuel_consumption1] where v_number = '"+vehicle_id+"' group by card_number,v_number order by card_number desc", function (err, recordset31) {
                                                                                                                                        if (err) console.log(err)
                                                                                                                                        // send records as a response
                                                                                                                                        request.query("SELECT * FROM view_resp where reg_number = '"+vehicle_id+"'", function (err, recordset32) {
                                                                                                                                            if (err) console.log(err)
                                                                                                                                            // send records as a response
                                                                                                                                            request.query("SELECT * FROM view_responsible_history where vehicle_name = '"+vehicle_id+"'", function (err, recordset33) {
                                                                                                                                                if (err) console.log(err)
                                                                                                                                                // send records as a response
                        
                        
                                                                                                                                                res.render('updateVehicle', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], make: recordset7["recordsets"][0], state: recordset8["recordsets"][0], type: recordset9["recordsets"][0], dist: recordset10["recordsets"][0], fuel: recordset11["recordsets"][0], maintenance: recordset12["recordsets"][0], region: recordset13["recordsets"][0], driver: recordset14["recordsets"][0], driverlist: recordset15["recordsets"][0], stolenUp: recordset16["recordsets"][0], fuel_type1: recordset17["recordsets"][0], school: recordset18["recordsets"][0], faculty_name: recordset19["recordsets"][0], petrol: recordset20["recordsets"][0], alloc_history: recordset21["recordsets"][0], make: recordset22["recordsets"][0], new_region: recordset23["recordsets"][0], new_region_area: recordset24["recordsets"][0], distance: recordset25["recordsets"][0], fuel_cc: recordset26["recordsets"][0], basic_info_history: recordset27["recordsets"][0], vehi_status: recordset28["recordsets"][0], res_person: recordset29["recordsets"][0], respon_data: recordset30["recordsets"][0],messaging:messaging, moment: moment,fleet: recordset31["recordsets"][0],responsible: recordset32["recordsets"][0],responsible_h: recordset33["recordsets"][0] });
                                                                                                                                            });
                    
                                                                                                                                            //res.render('updateVehicle', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], make: recordset7["recordsets"][0], state: recordset8["recordsets"][0], type: recordset9["recordsets"][0], dist: recordset10["recordsets"][0], fuel: recordset11["recordsets"][0], maintenance: recordset12["recordsets"][0], region: recordset13["recordsets"][0], driver: recordset14["recordsets"][0], driverlist: recordset15["recordsets"][0], stolenUp: recordset16["recordsets"][0], fuel_type1: recordset17["recordsets"][0], school: recordset18["recordsets"][0], faculty_name: recordset19["recordsets"][0], petrol: recordset20["recordsets"][0], alloc_history: recordset21["recordsets"][0], make: recordset22["recordsets"][0], new_region: recordset23["recordsets"][0], new_region_area: recordset24["recordsets"][0], distance: recordset25["recordsets"][0], fuel_cc: recordset26["recordsets"][0], basic_info_history: recordset27["recordsets"][0], vehi_status: recordset28["recordsets"][0], res_person: recordset29["recordsets"][0], respon_data: recordset30["recordsets"][0],messaging:messaging, moment: moment,fleet: recordset31["recordsets"][0],responsible: recordset32["recordsets"][0] });
                                                                                                                                        });
                
                                                                                                                                    });
                                                                                                                                });
                                                                                                                            });
                                                                                                                        });
                                                                                                                    });
                                                                                                                });
                                                                                                            });
                                                                                                        });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        });
                                                                                        // res.render('updateVehicle', { data1: recordset["recordsets"][0], data2: recordset2["recordsets"][0], data3: recordset3["recordsets"][0], data4: recordset4["recordsets"][0], data5: recordset5["recordsets"][0], data6: recordset6["recordsets"][0], make: recordset7["recordsets"][0], state: recordset8["recordsets"][0], type: recordset9["recordsets"][0], dist: recordset10["recordsets"][0], fuel: recordset11["recordsets"][0], maintenance: recordset12["recordsets"][0], region: recordset13["recordsets"][0], driver: recordset14["recordsets"][0], driverlist: recordset15["recordsets"][0], stolenUp: recordset16["recordsets"][0], fuel_type1: recordset17["recordsets"][0], school: recordset18["recordsets"][0], faculty_name: recordset19["recordsets"][0] });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

    }
    else {
        res.redirect("/login");
    }
};


exports.area = function (req, res) {
    var id = req.query.id;
    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();

        request.query("SELECT * FROM [fmsuat].[dbo].[fms_area1] WHERE region_id = " + id + "", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            //console.log(recordset["recordsets"][0]);
            res.json(recordset["recordsets"][0]);


        });
    });
};

exports.getUser = function (req, res) {
    var schoolID = req.query.schoolID;
    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();

        request.query("SELECT hc.emp_ID,Concat(dd.first_name,dd.last_name) as emp_name from fmsuat..sms_school ss inner join fmsuat..hcm_conveyance hc on ss.SchoolID = hc.SchoolID inner join fmsuat..dwh_employeemastersingleview dd on hc.emp_id = dd.emp_id where hc.schoolID=" + schoolID + "and  hc.emp_ID NOT IN (SELECT [emp_id] FROM [FMSUAT].[dbo].[fms_emp_vehicle_allocation]) ", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            //console.log(recordset["recordsets"][0]);
            res.json(recordset["recordsets"][0]);


        });
    });
};

exports.school = function (req, res) {
    var id = req.query.id;
    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();

        request.query("SELECT * FROM [FMSUAT].[dbo].[vw_school_search] where areaID =" + id + "", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            //console.log(recordset["recordsets"][0]);
            res.json(recordset["recordsets"][0]);


        });
    });
};

exports.update_allocation = function (req, res) {
    var pre = req.query.pre;
    var new_l = req.query.new;
    var veh_id = req.query.veh;
    var created = req.query.createdon;
    var uid = req.session.userId;
    var sql = require("mssql");

    var currentdate = new Date();
    var datetime = currentdate.getDate() + "-"
        + (currentdate.getMonth() + 1) + "-"
        + currentdate.getFullYear() + " "
        + currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds();
    console.log("tem " + datetime);


    console.log("Previous" + pre + "\t" + new_l + "\t" + veh_id);


    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();
        console.log("INSERT INTO [dbo].[fms_allocation_history]([created_by],[created_on],[vehicle_id],[previous_area],[new_area])VALUES (" + uid + " ,'" + created + "'," + veh_id + "," + pre + "," + new_l + ")");
        request.query("INSERT INTO [dbo].[fms_allocation_history]([created_by],[created_on],[vehicle_id],[previous_area],[new_area])VALUES (" + uid + " ,'" + created + "'," + veh_id + "," + pre + "," + new_l + ")", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            console.log("[{status:'ok'}]");
            request.query("update [FMSUAT].[dbo].[fms_vehicle_area_allocation] set  [area_id] = " + new_l + " ,[alloc_date] = '" + created + "' where vehicle_id = " + veh_id + "", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                console.log("[{status:'ok'}]");
                res.json(JSON.parse('{"status":"ok"}'));


            });


        });
    });
};

exports.assign_driver = function (req, res) {
    var driver = req.query.driver;
    var vehicle = req.query.vehicle;
    var driver_name = req.query.driver_name;
    var cars_names = req.query.cars_names;
    var uid = req.session.userId;
    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();
        console.log("INSERT INTO [dbo].[driver_vehi_asign]([driver_id],[vehicle_id],[user_id])VALUES (" + driver + "," + vehicle + "," + uid + ")");
        request.query("INSERT INTO [dbo].[driver_vehi_asign]([driver_id],[vehicle_id],[user_id])VALUES (" + driver + "," + vehicle + "," + uid + ")", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            console.log("[{status:'ok'}]");
            // res.json(JSON.parse('{"status":"ok"}'));
            // console.log("INSERT INTO [dbo].[driver_vehi_asign_h]([driver_id],[driver_name],[vehicle_name],[user_id])VALUES (" + driver + ",'" + driver_name + "','" + cars_names + "'," + uid + ")")
            request.query("INSERT INTO [dbo].[driver_vehi_asign_h]([driver_id],[driver_name],[vehicle_name],[user_id])VALUES (" + driver + ",'" + driver_name + "','" + cars_names + "'," + uid + ")", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                console.log("[{status:'ok'}]");
                res.json(JSON.parse('{"status":"ok"}'));


            });


        });
    });
};

exports.update_basicInfo = function (req, res) {
    // make=' + make+'&dor='+dor+'&purchase_price='+purchase_price+'&reg_state='+reg_state+'&dop='+dop+'&engine_no='+engine_no+'&chasis_no='+chasis_no+'&Vehicle_alloc='+Vehicle_alloc+'&capacity='+capacity+'&model='+model


    var id = req.id;
    console.log("vehicle id run =>" + id)
    var sql = require("mssql");

    // connect to your database

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");



        var make = req.query.make;
        var model = req.query.model;
        var capacity = req.query.capacity;
        var chasis_no = req.query.chasis_no;
        var engine_no = req.query.engine_no;
        var dop = req.query.dop;
        var reg_state = req.query.reg_state;
        var purchase_price = req.query.purchase_price;
        var dor = req.query.dor;
        var Vehicle_alloc = req.query.Vehicle_alloc;
        var veh_id = req.query.veh;
        var b_c_odo = req.query.b_c_odo;
        var vehi_fuel = req.query.vehi_fuel;
        var card_limit = req.query.card_limit;driver_all
        var vehi_resp = req.query.vehi_resp;
        var driver_all = req.query.driver_all;
        var release_date = req.query.release_date;
        


        var currentdate = new Date();

        var datetime = currentdate.getDate() + "-"
            + (currentdate.getMonth() + 1) + "-"
            + currentdate.getFullYear() + " "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();
        console.log("han date " + datetime);
        var sql = require("mssql");
        console.log(veh_id)


        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();
            // console.log("INSERT INTO [dbo].[fms_allocation_history]([created_by],[created_on],[vehicle_id],[previous_area],[new_area])VALUES ("+uid+" ,"+created+","+veh_id+","+pre+","+new_l+")");

                
                    // send records as a response
                    console.log("UPDATE [fmsuat].[dbo].[fms_vehicle] SET [make]='" + make + "',[model]='" + model + "',[card_limit]='" + card_limit + "',[fuel_type_id]='" + vehi_fuel + "',[current_odo]='" + b_c_odo + "',[capacity]='" + capacity + "',[chasis_no]='" + chasis_no + "',[engine_no]='" + engine_no + "',[dop]='" + dop + "',[purchase_price]='" + purchase_price + "',[dor]='" + dor + "',[r_state_id]=" + reg_state + ",[function_type_id]=" + Vehicle_alloc + ",[driver_allocated]='" + driver_all + "',[release_date]='" + release_date + "' where id=" + veh_id + "");

                    request.query("UPDATE [fmsuat].[dbo].[fms_vehicle] SET [make]='" + make + "',[model]='" + model + "',[card_limit]='" + card_limit + "',[fuel_type_id]='" + vehi_fuel + "',[current_odo]='" + b_c_odo + "',[capacity]='" + capacity + "',[chasis_no]='" + chasis_no + "',[engine_no]='" + engine_no + "',[dop]='" + dop + "',[purchase_price]='" + purchase_price + "',[dor]='" + dor + "',[r_state_id]=" + reg_state + ",[function_type_id]=" + Vehicle_alloc + ",[driver_allocated]='" + driver_all + "',[release_date]='" + release_date + "' where id=" + veh_id + " ", function (err, recordset2) {
                        if (err) console.log(err)

                        console.log("INSERT INTO [dbo].[basic_info_update_history]([userID],[vehicle_id],[update_time],[make],[model],[dop],[dor],[purchase_price],[r_state_id],[engine_no],[chasis_no],[function_type_id],[capacity],[current_odo],[vehi_fuel],[card_limit],[driver_allocated])VALUES ('" + userId + "','" + veh_id + "','" + datetime + "','" + make + "','" + model + "','" + dop + "','" + dor + "','" + purchase_price + "','" + reg_state + "','" + engine_no + "','" + chasis_no + "','" + Vehicle_alloc + "','" + capacity + "','" + b_c_odo + "','" + vehi_fuel + "','" + card_limit + "','" + driver_all + "')");

                        request.query("INSERT INTO [dbo].[basic_info_update_history]([userID],[vehicle_id],[update_time],[make],[model],[dop],[dor],[purchase_price],[r_state_id],[engine_no],[chasis_no],[function_type_id],[capacity],[current_odo],[vehi_fuel],[card_limit],[driver_allocated])VALUES ('" + userId + "','" + veh_id + "','" + datetime + "','" + make + "','" + model + "','" + dop + "','" + dor + "','" + purchase_price + "','" + reg_state + "','" + engine_no + "','" + chasis_no + "','" + Vehicle_alloc + "','" + capacity + "','" + b_c_odo + "','" + vehi_fuel + "','" + card_limit + "','" + driver_all + "')", function (err, recordset2) {
                            if (err) console.log(err)

                            // send records as a response
                            //console.log(recordset["recordsets"][0]['id']);
                            console.log("INSERT INTO [dbo].[vehi_responsible_person]([vehicle_id],[person_id],[time])VALUES('"+veh_id+"','"+vehi_resp+"','"+datetime+"')");
                            request.query("INSERT INTO [dbo].[vehi_responsible_person]([vehicle_id],[person_id],[time])VALUES('"+veh_id+"','"+vehi_resp+"','"+datetime+"')", function (err, recordset3) {
                                if (err) console.log(err)
    
                                // send records as a response
                                //console.log(recordset["recordsets"][0]['id']);
    
                                console.log("[{status:'ok'}]");
                                res.json(JSON.parse('{"status":"ok"}'));
    
    
                            });


                        });


                    });


                });

    }
    else {
        res.redirect("/login");
    }
};

exports.fuelInfo = function (req, res) {

    var fuel = req.query.fuel;
    var veh_id = req.query.veh;

    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();
        console.log(fuel)
        var ar;
        var sa;
        if (fuel == 'Petrol CNG') {
            ar = fuel.split(' '); // empty string separator
            console.log(ar[0] + '+' + ar[1]);
            sa = ar[0] + '+' + ar[1];
        }
        else {
            sa = fuel;
        }
        console.log("SELECT * FROM [fmsuat].[dbo].[fms_fuel_type] where fuel_type='" + sa + "'");
        request.query("SELECT * FROM [fmsuat].[dbo].[fms_fuel_type] where fuel_type='" + sa + "'", function (err, recordset) {
            if (err) console.log(err)
            console.log("Fuel Type ==> " + recordset["recordsets"][0][0]['id']);
            var fuel_type_id = recordset["recordsets"][0][0]['id'];

            // send records as a response
            console.log("[fmsuat].[dbo].[fms_vehicle] SET [fuel_type_id]='" + fuel_type_id + "' where id=" + veh_id + "");

            request.query("UPDATE [fmsuat].[dbo].[fms_vehicle] SET [fuel_type_id]='" + fuel_type_id + "' where id=" + veh_id + "", function (err, recordset1) {
                if (err) console.log(err)
                // console.log("Fuel Type ==> "+recordset1["recordsets"][0][0]['id']);


                // send records as a response
                console.log("[{status:'ok'}]");
                res.json(JSON.parse('{"status":"ok"}'));


            });

        });
    });
};

exports.userlist2 = function (req, res, next) {
    var userId = req.session.userId;
    var userName = req.session.username;
    console.log("ss=> " + userId);
    const sql = require('mssql');

    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();
        console.log(sql);
        console.log("session data  ==> SELECT * FROM [fmsuat].[dbo].[f_roles_assign] inner join fmsuat.dbo.fms_users2 on [fmsuat].[dbo].[f_roles_assign].[user_id] = fms_users2.designationId  inner join   [fmsuat].[dbo].[f_roles] as f_ass on f_ass.id = [fmsuat].[dbo].[f_roles_assign].role_id where userId='" + userId + "'")
        // request.query("SELECT * FROM [asif].[dbo].[fms_users] Where id = '"+userId+"'", function (err, recordset) {
        request.query("SELECT * FROM [FMSUAT].[dbo].[f_roles_assign] ra inner join f_roles r on ra.role_id = r.id  where user_id = " + req.session.designationId + " and dpt_id = " + req.session.departId + "", function (err, recordset) {
            if (err) console.log(err)
            //
            // console.log("ayaa "+ recordset["recordsets"][0][0]["r_gps"])
            // send records as a response
            //console.log(recordset["recordsets"][0][0]);
            res.send(recordset);


        });
    });

};

exports.run = function (req, res) {
    var id = req.id;
    console.log("vehicle id run =>" + id)
    var sql = require("mssql");

    // connect to your database

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            // console.log("SELECT TOP 1 * FROM fms_fvehicles as fv inner join  [FMSUAT].[dbo].[fms_vehicle] as fm on fv.f_vehnum=fm.reg_number inner join [FMSUAT].[dbo].[driver_vehi_asign_h] as vh on fv.f_vehnum=vh.vehicle_name where fv.f_vehnum='" + id + "' ORDER BY fv.f_reportingtime DESC")
            console.log("SELECT TOP 1 * FROM fmsuat..fms_fvehicles as fv left join  [FMSUAT].[dbo].[fms_vehicle] as fm on fv.f_vehnum=fm.reg_number left join [FMSUAT].[dbo].[driver_vehi_asign_h] as vh on fv.f_vehnum=vh.vehicle_name where fv.f_vehnum = '" + id + "' ORDER BY fv.f_reportingtime DESC");
            request.query("SELECT TOP 1 * FROM fmsuat..fms_fvehicles as fv left join  [FMSUAT].[dbo].[fms_vehicle] as fm on fv.f_vehnum=fm.reg_number left join [FMSUAT].[dbo].[driver_vehi_asign_h] as vh on fv.f_vehnum=vh.vehicle_name where fv.f_vehnum = '" + id + "' ORDER BY fv.f_reportingtime DESC", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                //console.log(recordset["recordsets"][0]);
                request.query('SELECT sc.Latitude_Value,sc.Longitude_Value,ss.Name,ss.schoolID FROM [FMSUAT].[dbo].[sms_School] as ss join fmsuat..sms_Campus as sc on sc.id = ss.campusID', function (err, recordset2) {
                    if (err) console.log(err)
        
                    // send records as a response
                    //console.log(recordset["recordsets"][0]);
                    res.render('run', { data1: recordset["recordsets"][0] , data2: recordset2["recordsets"][0]});
                            
        
                });
                //res.render('run', { data1: recordset["recordsets"][0] });
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.custom_route = function (req, res) {
    var id = req.id;
    console.log("vehicle id run =>" + id)
    var sql = require("mssql");

    // connect to your database

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            console.log("SELECT TOP 1 * FROM fms_fvehicles as fv inner join  [FMSUAT].[dbo].[fms_vehicle] as fm on fv.f_vehnum=fm.reg_number inner join [FMSUAT].[dbo].[driver_vehi_asign_h] as vh on fv.f_vehnum=vh.vehicle_name where fv.f_vehnum='" + id + "' ORDER BY fv.f_reportingtime DESC")
            request.query("SELECT f_veh.area_name,f_veh.region_name, fm_ud.[userid],fm_ud.[deviceid],fm_v.reg_number,fm_v.last_update_by,fm_l.f_reportingtime,fm_l.f_lat,fm_l.f_lng,fm_l.f_speed,fm_l.g_ignition FROM [FMSUAT].[dbo].[fms_user_device] as fm_ud inner join fmsuat.dbo.fms_vehicle as fm_v on fm_ud.deviceid = fm_v.id inner join FMSUAT.dbo.fms_fvehicles as fm_l on fm_v.last_update_by = fm_l.id inner join FMSUAT..all_vehicles as f_veh on f_veh.id = fm_ud.deviceid where fm_v.reg_number = '"+id+"'", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                //console.log(recordset["recordsets"][0]);
                request.query('SELECT sc.Latitude_Value,sc.Longitude_Value,ss.Name,ss.schoolID FROM [FMSUAT].[dbo].[sms_School] as ss join fmsuat..sms_Campus as sc on sc.id = ss.campusID', function (err, recordset2) {
                    if (err) console.log(err)
        
                    // send records as a response
                    //console.log(recordset["recordsets"][0]);
                    res.render('custom_route', { data1: recordset["recordsets"][0] , data2: recordset2["recordsets"][0]});
                            
        
                });
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.data = function (req, res) {
    var id = req.query.id;
    console.log("vehicle name =>" + id)
    var sql = require("mssql");

    // connect to your database

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            console.log("SELECT TOP 1 * FROM fms_fvehicles as fv inner join  [FMSUAT].[dbo].[fms_vehicle] as fm on fv.f_vehnum=fm.reg_number inner join [FMSUAT].[dbo].[driver_vehi_asign_h] as vh on fv.f_vehnum=vh.vehicle_name where fv.f_vehnum='" + id + "' ORDER BY fv.f_reportingtime DESC")
            request.query("SELECT TOP 1 * FROM fms_fvehicles as fv inner join  [FMSUAT].[dbo].[fms_vehicle] as fm on fv.f_vehnum=fm.reg_number inner join [FMSUAT].[dbo].[driver_vehi_asign_h] as vh on fv.f_vehnum=vh.vehicle_name where fv.f_vehnum='" + id + "' ORDER BY fv.f_reportingtime DESC", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.send(recordset["recordsets"][0]);
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.line = function (req, res) {

    var sql = require("mssql");

    // connect to your database

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");
        var id = req.query.id;


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            console.log("SELECT [f_vehnum],[f_lat],[f_lng],[f_reportingtime]FROM [FMSUAT].[dbo].[fms_fvehicles] where f_reportingtime >=cast(getdate() as Date) and f_vehnum='" + id + "' order by id desc")
            request.query("SELECT [f_vehnum],[f_lat],[f_lng],[f_reportingtime]FROM [FMSUAT].[dbo].[fms_fvehicles] where f_reportingtime >=cast(getdate() as Date) and f_vehnum='" + id + "' order by id desc", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                console.log(recordset["recordsets"][0]);
                res.send(recordset["recordsets"][0]);
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.yesterday = function (req, res) {

    var sql = require("mssql");

    // connect to your database

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");
        var id = req.query.id;


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            console.log("SELECT [f_vehnum],[f_lat],[f_lng],[f_reportingtime]FROM [FMSUAT].[dbo].[fms_fvehicles] where f_reportingtime <=cast(getdate() as Date) and f_reportingtime >=DATEADD(day, -1, CAST(GETDATE() AS date))  and f_vehnum='" + id + "' order by id desc")
            request.query("SELECT [f_vehnum],[f_lat],[f_lng],[f_reportingtime]FROM [FMSUAT].[dbo].[fms_fvehicles] where f_reportingtime <=cast(getdate() as Date) and f_reportingtime >=DATEADD(day, -1, CAST(GETDATE() AS date))  and f_vehnum='" + id + "' order by id desc", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                console.log(recordset["recordsets"][0]);
                res.send(recordset["recordsets"][0]);
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.line_three = function (req, res) {

    var sql = require("mssql");

    // connect to your database

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");
        var id = req.query.id;


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            console.log("SELECT [f_vehnum],[f_lat],[f_lng],[f_reportingtime]FROM [FMSUAT].[dbo].[fms_fvehicles] where f_reportingtime <=cast(getdate() as Date) and f_reportingtime >=DATEADD(day, -2, CAST(GETDATE() AS date))  and f_vehnum='" + id + "' order by id desc")
            request.query("SELECT [f_vehnum],[f_lat],[f_lng],[f_reportingtime]FROM [FMSUAT].[dbo].[fms_fvehicles] where f_reportingtime <=cast(getdate() as Date) and f_reportingtime >=DATEADD(day, -2, CAST(GETDATE() AS date))  and f_vehnum='" + id + "' order by id desc", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                console.log(recordset["recordsets"][0]);
                res.send(recordset["recordsets"][0]);
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.custom_line = function (req, res) {

    var sql = require("mssql");

    // connect to your database

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");
        var id = req.query.id;
        var to = req.query.to;
        var from = req.query.from;


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            console.log("SELECT [f_vehnum],[f_lat],[f_lng],[f_reportingtime]FROM [FMSUAT].[dbo].[fms_fvehicles] where f_reportingtime >='" + to + "" + "T00:00:00' and f_reportingtime <='" + from + "" + "T23:59:00'  and f_vehnum='" + id + "' order by id desc")
            request.query("SELECT [f_vehnum],[f_lat],[f_lng],[f_reportingtime]FROM [FMSUAT].[dbo].[fms_fvehicles] where f_reportingtime >='" + to + "" + "T00:00:00' and f_reportingtime <='" + from + "" + "T23:59:00'  and f_vehnum='" + id + "' order by id desc", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                console.log(recordset["recordsets"][0]);
                res.send(recordset["recordsets"][0]);
            });
        });

    }
    else {
        res.redirect("/login");
    }
};


exports.listdata = function (req, res, next) {

    var id = req.query.id;

    const sql = require('mssql');

    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();
        console.log("SELECT * FROM [fmsuat].[dbo].[fms_fvehicles] where id=" + id + " ");
        request.query("SELECT * FROM [fmsuat].[dbo].[fms_fvehicles] where id=" + id + " ", function (err, recordset) {
            if (err) console.log(err)
            //
            console.log("ayaa " + recordset["recordsets"][0][0]["f_lat"]);
            // send records as a response
            // //console.log(recordset["recordsets"][0]);
            res.send(recordset);


        });
    });

};

exports.createRole = function (req, res) {
    // name=' + rolName+'&action='+actionS+'&main_dash='+mainDashboard+'&vehicle='+vehicleS+'&fuelCard='+cardS+'&gps='+gpsS+'&report='+reportS+'&users='+userS+'&update_vehi='+updateD
    var name = req.query.name;
    // var action = req.query.action;
    var main_dash = req.query.main_dash;
    var vehicle = req.query.vehicle;
    var fuelCard = req.query.fuelCard;
    var gps = req.query.gps;
    var report = req.query.report;
    var users = req.query.users;
    var update_vehi = req.query.update_vehi;
    var setupsS = req.query.setupsS;
    var createS = req.query.createS;
    var updatesS = req.query.updatesS;
    var deletesS = req.query.deletesS;
    var sql = require("mssql");

    // console.log(name + action);

    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();
        console.log("INSERT INTO [dbo].[f_roles]([r_name],[r_action],[r_main_dash],[r_vehicle],[r_gps],[r_report],[r_update_vehi],[r_fuel_card],[r_users],[r_setups],[r_creation],[r_update],[r_delete])VALUES ('" + name + "' ,'0','" + main_dash + "','" + vehicle + "','" + gps + "','" + report + "','" + update_vehi + "','" + fuelCard + "','" + users + "','" + setupsS + "','" + createS + "','" + updatesS + "','" + deletesS + "')");

        request.query("INSERT INTO [dbo].[f_roles]([r_name],[r_action],[r_main_dash],[r_vehicle],[r_gps],[r_report],[r_update_vehi],[r_fuel_card],[r_users],[r_setups],[r_creation],[r_update],[r_delete])VALUES ('" + name + "' ,'0','" + main_dash + "','" + vehicle + "','" + gps + "','" + report + "','" + update_vehi + "','" + fuelCard + "','" + users + "','" + setupsS + "','" + createS + "','" + updatesS + "','" + deletesS + "')", function (err, recordset) {
            // request.query("INSERT INTO [dbo].[f_roles]([r_name],[r_main_dash],[r_vehicle],[r_gps],[r_report],[r_update_vehi],[r_fuel_card],[r_users])VALUES ('" + name + "','" + main_dash + "','" + vehicle + "','" + gps + "','" + report + "','" + update_vehi + "','" + fuelCard + "','" + users + "')", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response

            console.log("Submitted.....");

            console.log("[{status:'ok'}]");
            res.json(JSON.parse('{"status":"ok"}'));


        });




    });

};

exports.update__Role = function (req, res) {
    // name=' + rolName+'&action='+actionS+'&main_dash='+mainDashboard+'&vehicle='+vehicleS+'&fuelCard='+cardS+'&gps='+gpsS+'&report='+reportS+'&users='+userS+'&update_vehi='+updateD
    var name = req.query.name;
    // var action = req.query.action;
    var main_dash = req.query.main_dash;
    var vehicle = req.query.vehicle;
    var fuelCard = req.query.fuelCard;
    var gps = req.query.gps;
    var report = req.query.report;
    var users = req.query.users;
    var update_vehi = req.query.update_vehi;
    var setupsS = req.query.setupsS;
    var createS = req.query.createS;
    var updatesS = req.query.updatesS;
    var deletesS = req.query.deletesS;
    var id = req.query.id;
    var sql = require("mssql");

    // console.log(name + action);

    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();
        console.log("UPDATE [dbo].[f_roles] SET [r_name] = '" + name + "',[r_action] = '0',[r_main_dash] = '" + main_dash + "',[r_vehicle] = '" + vehicle + "',[r_gps] = '" + gps + "',[r_report] = '" + report + "',[r_update_vehi] = '" + update_vehi + "',[r_fuel_card] = '" + fuelCard + "',[r_users] = '" + users + "',[r_setups] = '" + setupsS + "',[r_creation] = '" + createS + "',[r_update] = '" + updatesS + "',[r_delete] = '" + deletesS + "' WHERE id="+id+"");

        request.query("UPDATE [dbo].[f_roles] SET [r_name] = '" + name + "',[r_action] = '0',[r_main_dash] = '" + main_dash + "',[r_vehicle] = '" + vehicle + "',[r_gps] = '" + gps + "',[r_report] = '" + report + "',[r_update_vehi] = '" + update_vehi + "',[r_fuel_card] = '" + fuelCard + "',[r_users] = '" + users + "',[r_setups] = '" + setupsS + "',[r_creation] = '" + createS + "',[r_update] = '" + updatesS + "',[r_delete] = '" + deletesS + "' WHERE id="+id+"", function (err, recordset) {
            // request.query("INSERT INTO [dbo].[f_roles]([r_name],[r_main_dash],[r_vehicle],[r_gps],[r_report],[r_update_vehi],[r_fuel_card],[r_users])VALUES ('" + name + "','" + main_dash + "','" + vehicle + "','" + gps + "','" + report + "','" + update_vehi + "','" + fuelCard + "','" + users + "')", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response

            console.log("Submitted.....");

            console.log("[{status:'ok'}]");
            res.json(JSON.parse('{"status":"ok"}'));


        });




    });

};

exports.assign_role = function (req, res) {
    // name=' + rolName+'&action='+actionS+'&main_dash='+mainDashboard+'&vehicle='+vehicleS+'&fuelCard='+cardS+'&gps='+gpsS+'&report='+reportS+'&users='+userS+'&update_vehi='+updateD
    var role_id = req.query.role_id;
    var user_id = req.query.user_id;
    var r_dpt = req.query.r_dpt;

    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();
        console.log("INSERT INTO [dbo].[f_roles_assign]([role_id],[user_id],[dpt_id])VALUES ('" + role_id + "' ,'" + user_id + "','" + r_dpt + "')");

        request.query("INSERT INTO [dbo].[f_roles_assign]([role_id],[user_id],[dpt_id])VALUES ('" + role_id + "' ,'" + user_id + "','" + r_dpt + "')", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response

            console.log("Submitted.....");

            console.log("[{status:'ok'}]");
            res.json(JSON.parse('{"status":"ok"}'));


        });




    });

};

exports.assign_vehicle = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            // console.log("SELECT [role],[username] FROM [FMSUAT].[dbo].[fms_users]")
            request.query("SELECT [role],[username] FROM [FMSUAT].[dbo].[fms_users]", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                //console.log(recordset["recordsets"][0]);
                request.query("SELECT [id],[reg_number] FROM [FMSUAT].[dbo].[fms_vehicle]", function (err, recordset1) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset1["recordsets"][0]);
                    request.query("SELECT  fm_us_d.[userid],fm_us_d.[deviceid],fm_us.fname,fm_us.username,fm_v.reg_number FROM [FMSUAT].[dbo].[fms_user_device] as fm_us_d inner join fms_users as fm_us on fm_us_d.userid = fm_us.role inner join fms_vehicle as fm_v on fm_us_d.deviceid = fm_v.id", function (err, recordset2) {
                        if (err) console.log(err)
                        // send records as a response
                        //console.log(recordset2["recordsets"][0]);
                        res.render('assign_vehicle', { data1: recordset["recordsets"][0], data2: recordset1["recordsets"][0], data3: recordset2["recordsets"][0] });
                    });
                });
            });
        });

    }
    else {
        res.redirect("/login");
    }
};


exports.vehicleAssign = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var users_id = req.query.userid;
            var device_id = req.query.vehicle;

            // console.log("SELECT [role],[username] FROM [FMSUAT].[dbo].[fms_users]")

            request.query("INSERT INTO [dbo].[fms_user_device]([userid],[deviceid])VALUES('" + users_id + "','" + device_id + "')", function (err, recordset1) {
                if (err) console.log(err)

                res.redirect('assign_vehicle');
            });

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.stolenInfo = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var status = req.query.status;
            var date = req.query.date;
            var discription = req.query.discription;
            var vehicle = req.query.vehicle;

            console.log("INSERT INTO [dbo].[vehi_stolen]([vehicle_id],[status],[discription],[date],[user_id])VALUES('" + vehicle + "','" + status + "','" + discription + "','" + date + "','" + userId + "')")

            request.query("INSERT INTO [dbo].[vehi_stolen]([vehicle_id],[status],[discription],[date],[user_id])VALUES('" + vehicle + "','" + status + "','" + discription + "','" + date + "','" + userId + "')", function (err, recordset1) {
                if (err) console.log(err)

                res.redirect('assign_vehicle');
            });

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.excelImporter = function (req, res) {


    userId = req.session.userId;


    // connect to your database1


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();
            console.log("SELECT * FROM [FMSUAT].[dbo].[fleet_card]");
            request.query("SELECT * FROM [FMSUAT].[dbo].[fleet_card]", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                // console.log(recordset["recordsets"][0]);
                res.render('excelImporter', { data: recordset["recordsets"][0] });

            });
        });
    }
    else {
        res.redirect("/login");
    }

};
exports.excel = function (req, res) {


    userId = req.session.userId;


    // connect to your database1


    var sql = require("mssql");
        res.render('excel2', );
   

};
exports.excelq = function (req, res) {


    userId = req.session.userId;


    // connect to your database1


    if (userId != null) {
        var sql = require("mssql");
        res.render('excel2', );
    }
    else {
        res.redirect("/login");
    }

};

exports.vehicleTagDept = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            // console.log("SELECT [role],[username] FROM [FMSUAT].[dbo].[fms_users]")

            request.query("SELECT *  FROM [fmsuat].[dbo].[fms_region]", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                //console.log(recordset["recordsets"][0]);
                request.query("SELECT [id],[reg_number] FROM [FMSUAT].[dbo].[fms_vehicle]", function (err, recordset1) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset1["recordsets"][0]);
                    res.render('vehicleTagDept', { data1: recordset["recordsets"][0], data2: recordset1["recordsets"][0] });
                });
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.vehicleDept = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var name = req.query.name;
            var region = req.query.region;
            var area = req.query.area;
            var school = req.query.school;
            var vehicle = req.query.vehicle;

            if (area == null)

                console.log("INSERT INTO [dbo].[fms_vehicle_dept]([name],[region_id],[area_name],[school_id],[vehicle_id])VALUES('" + name + "','" + region + "','" + area + "','" + school + "','" + vehicle + "')")

            request.query("INSERT INTO [dbo].[fms_vehicle_dept]([name],[region_id],[area_name],[school_id],[vehicle_id])VALUES('" + name + "','" + region + "','" + area + "','" + school + "','" + vehicle + "')", function (err, recordset1) {
                if (err) console.log(err)

                res.redirect('/vehicleTagDept');
            });

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.hcm = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            // console.log("SELECT [role],[username] FROM [FMSUAT].[dbo].[fms_users]")

            request.query("SELECT *  FROM [fmsuat].[dbo].[fms_region]", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                //console.log(recordset["recordsets"][0]);
                request.query("SELECT [id],[reg_number] FROM [FMSUAT].[dbo].[fms_vehicle]", function (err, recordset1) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset1["recordsets"][0]);
                    request.query("SELECT *,vd.area_name as area FROM [FMSUAT].[dbo].[user_ass_dept] ud inner join [FMSUAT].[dbo].[fms_vehicle_dept] vd on ud.dept_id = vd.id ", function (err, recordset2) {
                        if (err) console.log(err)
                        // send records as a response
                        //console.log(recordset2["recordsets"][0]);
                        var area_id = recordset2["recordsets"][0][0]['area_name']
                        console.log("SELECT distinct ss.schoolID,ss.Name from [FMSUAT].[dbo].[fms_vehicle_dept] vd inner join fmsuat..sms_school ss on ss.SchoolID = vd.school_id where area_name = '" + area_id + "' ");
                        request.query("SELECT distinct ss.schoolID,ss.Name from [FMSUAT].[dbo].[fms_vehicle_dept] vd inner join fmsuat..sms_school ss on ss.SchoolID = vd.school_id where area_name = '" + area_id + "' ", function (err, recordset3) {
                            if (err) console.log(err)
                            // send records as a response
                            // console.log("School data "+recordset3["recordsets"][0][0]['Name']);

                            request.query("SELECT distinct vehicle_id,reg_number from [FMSUAT].[dbo].[fms_vehicle_dept] vd inner join fmsuat..fms_vehicle ss on   vd.vehicle_id = ss.id where area_name = '" + area_id + "'", function (err, recordset4) {
                                if (err) console.log(err)
                                // send records as a response
                                // console.log("School data "+recordset4["recordsets"][0][0]['Name']);
                                console.log("hcm table SELECT  *  FROM [FMSUAT].[dbo].[vw_faculty_tagged]")
                                request.query("SELECT  *  FROM [FMSUAT].[dbo].[vw_faculty_tagged]", function (err, recordset5) {
                                    if (err) console.log(err)
                                    //console.log(recordset5["recordsets"][0]);

                                    res.render('hcm', { data1: recordset["recordsets"][0], data2: recordset1["recordsets"][0], school: recordset3["recordsets"][0], vahicle: recordset4["recordsets"][0], hcm_table: recordset5["recordsets"][0] });
                                });
                            });
                        });
                    });
                });
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.userDrpt = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();
            // console.log("SELECT [role],[username] FROM [FMSUAT].[dbo].[fms_users]")

            request.query("SELECT [role],[username] FROM [FMSUAT].[dbo].[fms_users]", function (err, recordset) {
                if (err) console.log(err)
                // send records as a response
                //console.log(recordset["recordsets"][0]);
                console.log("SELECT DISTINCT(name),max(id) FROM [FMSUAT].[dbo].[fms_vehicle_dept] group by name order by name desc")
                request.query("SELECT DISTINCT(name),max(id) as r_id FROM [FMSUAT].[dbo].[fms_vehicle_dept] group by name order by name desc", function (err, recordset1) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset1["recordsets"][0][0]['r_id']);
                    request.query("SELECT  *  FROM [FMSUAT].[dbo].[vw_user_dept]", function (err, recordset2) {
                        if (err) console.log(err)
                        // send records as a response
                        //console.log(recordset2["recordsets"][0]);
                        res.render('userDrpt', { data1: recordset["recordsets"][0], data2: recordset1["recordsets"][0], data3: recordset2["recordsets"][0] });
                    });
                });
            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.user_Dpt = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var user = req.query.user;
            var dpt_role = req.query.dpt_role;




            console.log("INSERT INTO [dbo].[user_ass_dept]([user_id],[dept_id])VALUES('" + user + "','" + dpt_role + "')")

            request.query("INSERT INTO [dbo].[user_ass_dept]([user_id],[dept_id])VALUES('" + user + "','" + dpt_role + "')", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Submitted.....");

                console.log("[{status:'ok'}]");
                res.json(JSON.parse('{"status":"ok"}'));
            });

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.facultyUpdate = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            // var school = req.query.school;
            var vehicle = req.query.vehicle;
            var create = req.query.create;
            var empt = req.query.empt;




            console.log("INSERT INTO [dbo].[fms_emp_vehicle_allocation]([emp_id],[vehicle_id],[created_by],[created_on],[morning_pick_order]) VALUES('" + empt + "','" + vehicle + "','" + userId + "','" + create + "','1')")

            request.query("INSERT INTO [dbo].[fms_emp_vehicle_allocation]([emp_id],[vehicle_id],[created_by],[created_on],[morning_pick_order]) VALUES('" + empt + "','" + vehicle + "','" + userId + "','" + create + "','1')", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Submitted.....");

                console.log("[{status:'ok'}]");
                res.json(JSON.parse('{"status":"ok"}'));
            });

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.add_vehicle = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);



    var sql = require("mssql");


    if (req.method == "POST") {
        var post = req.body;
        var reg_number = post.reg_number;
        var fuel_type_id = post.fuel_type_id;
        var make = post.make;
        var model = post.model;
        var dop = post.dop;
        var purchase_price = post.purchase_price;
        var dor = post.dor;
        var r_state_id = post.r_state_id;
        var engine_no = post.engine_no;
        var chasis_no = post.chasis_no;
        var capacity = post.capacity;
        var function_type_id = post.function_type_id;
        var area = post.area;
        var current_odo = post.current_odo;
        var card_limit = post.card_limit;
        var add_v_release = post.add_v_release;
        // var car_pic = req.files.car_pic;
        // console.log("file name " + car_pic)


        let ts = Date.now();

        // timestamp in milliseconds
        console.log(ts);
        // console.log(id);
        if (!req.files)
            return res.status(400).send('No files were uploaded.');

        var file = req.files.uploaded_image;
        var img_name = file.name;
        console.log("fime name " + img_name);

        if (file.mimetype == "image/jpeg" || file.mimetype == "image/png" || file.mimetype == "image/gif") {

            file.mv('public/uploads/images/' + file.name, function (err) {

                if (err)

                    return res.status(500).send(err);
                sql.connect(config, function (err) {
                    if (err) console.log(err);
                    var request = new sql.Request();
                    console.log("hamza name " + img_name);
                    console.log("INSERT INTO [dbo].[fms_vehicle]([reg_number],[fuel_type_id],[make],[model],[dop],[purchase_price],[dor],[r_state_id],[engine_no],[chasis_no],[capacity],[function_type_id],[current_odo],[card_limit],[image],[release_date])VALUES('" + reg_number + "','" + fuel_type_id + "','" + make + "','" + model + "','" + dop + "','" + purchase_price + "','" + dor + "','" + r_state_id + "','" + engine_no + "','" + chasis_no + "','" + capacity + "','" + function_type_id + "','" + current_odo + "','" + card_limit + "','" + img_name + "','"+add_v_release+"')")


                    request.query("INSERT INTO [dbo].[fms_vehicle]([reg_number],[fuel_type_id],[make],[model],[dop],[purchase_price],[dor],[r_state_id],[engine_no],[chasis_no],[capacity],[function_type_id],[current_odo],[card_limit],[image],[release_date])VALUES('" + reg_number + "','" + fuel_type_id + "','" + make + "','" + model + "','" + dop + "','" + purchase_price + "','" + dor + "','" + r_state_id + "','" + engine_no + "','" + chasis_no + "','" + capacity + "','" + function_type_id + "','" + current_odo + "','" + card_limit + "','" + img_name + "','"+add_v_release+"');SELECT SCOPE_IDENTITY() AS id;", function (err, recordset) {
                        console.log("Somi");
                        if (err) {
                            res.redirect("/updateVehicle/35")
                        }
                        else {
                            // send records as a response
                            console.log(recordset);
                            request.query("INSERT INTO [dbo].[fms_vehicle_area_allocation]([vehicle_id],[area_id],[alloc_date])VALUES(" + recordset["recordsets"][0][0]["id"] + "," + area + ",'" + ts + "')", function (err, recordset) {
                                if (err) console.log(err)
                                // send records as a response
                                //console.log(recordset);

                                res.redirect("/updateVehicle/35")
                            });

                        }

                        // res.redirect('/updateVehicle');
                    });
                });

            });
        } else {
            message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
            res.render('index.ejs', { message: message });
        }

    }


};

exports.petrol_cash = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var tt1 = req.query.tt1;
            var p_rate1 = req.query.p_rate1;
            var p_litr1 = req.query.p_litr1;

            var petrol_date = req.query.petrol_date;
            var dateTime = req.query.dateTime;
            var vehicleName = req.query.vehicleName;




            console.log("INSERT INTO [dbo].[fms_fuel_costs]([pt_cash_lt],[pt_cash_rt],[pt_cc_lt],[pt_cc_rt],[created_by],[created_on],[vehicle_id],[as_on]) VALUES ('" + p_litr1 + "','" + p_rate1 + "','','','" + userId + "','" + dateTime + "','" + vehicleName + "','" + petrol_date + "')")

            request.query("INSERT INTO [dbo].[fms_fuel_costs]([pt_cash_lt],[pt_cash_rt],[pt_cc_lt],[pt_cc_rt],[created_by],[created_on],[vehicle_id],[as_on]) VALUES ('" + p_litr1 + "','" + p_rate1 + "','','','" + userId + "','" + dateTime + "','" + vehicleName + "','" + petrol_date + "')", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Submitted.....");

                console.log("[{status:'ok'}]");
                res.json(JSON.parse('{"status":"ok"}'));
            });

        });

    }
    else {
        res.redirect("/login");
    }
};
exports.petrol_cng_cash = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var petrol_date2 = req.query.petrol_date2;
            var p_tt2 = req.query.p_tt2;
            var c_tt2 = req.query.c_tt2;
            var p_rate2 = req.query.p_rate2;
            var c_rate2 = req.query.c_rate2;
            var p_litr2 = req.query.p_litr2;
            var c_litr2 = req.query.c_litr2;
            var p_cc_rs2 = req.query.p_cc_rs2;
            var c_cc_rs2 = req.query.c_cc_rs2;
            // var p_cc_rates2 = req.query.p_cc_rates2;
            // var c_cc_rates2 = req.query.c_cc_rates2;
            // var p_cc_liter2 = req.query.p_cc_liter2;
            // var c_cc_liter2 = req.query.c_cc_liter2;
            var dateTime = req.query.dateTime;
            var vehicleName = req.query.vehicleName;




            console.log("INSERT INTO [dbo].[fms_fuel_costs]([pt_cash_lt],[pt_cash_rt],[cng_cash_lt],[cng_cash_rt],[pt_cc_lt],[pt_cc_rt],[cng_cc_lt],[cng_cc_rt],[created_by],[created_on],[vehicle_id],[as_on]) VALUES ('" + p_litr2 + "','" + p_rate2 + "','" + c_litr2 + "','" + c_rate2 + "','','','','','" + userId + "','" + dateTime + "','" + vehicleName + "','" + petrol_date2 + "')")

            request.query("INSERT INTO [dbo].[fms_fuel_costs]([pt_cash_lt],[pt_cash_rt],[cng_cash_lt],[cng_cash_rt],[pt_cc_lt],[pt_cc_rt],[cng_cc_lt],[cng_cc_rt],[created_by],[created_on],[vehicle_id],[as_on]) VALUES ('" + p_litr2 + "','" + p_rate2 + "','" + c_litr2 + "','" + c_rate2 + "','','','','','" + userId + "','" + dateTime + "','" + vehicleName + "','" + petrol_date2 + "')", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Submitted.....");

                console.log("[{status:'ok'}]");
                res.json(JSON.parse('{"status":"ok"}'));
            });

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.diesel = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var tt1 = req.query.tt3;
            var p_rate1 = req.query.p_rate1;
            var p_litr1 = req.query.p_litr1;
            var t_rs2 = req.query.t_rs1;

            var petrol_date = req.query.petrol_date;
            var dateTime = req.query.dateTime;
            var vehicleName = req.query.vehicleName;




            console.log("INSERT INTO [dbo].[fms_fuel_costs]([de_cash_lt],[de_cash_rt],[de_cc_lt],[de_cc_rt],[created_by],[created_on],[vehicle_id],[as_on]) VALUES ('" + p_litr1 + "','" + p_rate1 + "','','','" + userId + "','" + dateTime + "','" + vehicleName + "','" + petrol_date + "')")

            request.query("INSERT INTO [dbo].[fms_fuel_costs]([de_cash_lt],[de_cash_rt],[de_cc_lt],[de_cc_rt],[created_by],[created_on],[vehicle_id],[as_on]) VALUES ('" + p_litr1 + "','" + p_rate1 + "','','','" + userId + "','" + dateTime + "','" + vehicleName + "','" + petrol_date + "')", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Submitted.....");

                console.log("[{status:'ok'}]");
                res.json(JSON.parse('{"status":"ok"}'));
            });

        });

    }
    else {
        res.redirect("/login");
    }
};
exports.excel_data = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[fuel_consumption1]', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('excel_data', { data1: recordset["recordsets"][0] });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};


exports.delete_emp_faculty = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var id = req.query.id;
            var vehi_id = req.query.v - id;

           // var page




            console.log("DELETE FROM [dbo].[faculty_tagged] where id = " + id + "")

            request.query("DELETE FROM [dbo].[fms_emp_vehicle_allocation] where id = " + id + "", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Deleted.....");
                res.json(JSON.parse('{"status":"1"}'));

            });
            //res.redirect("/updateVehicle/" + vehi_id + "");

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.deletes_alloc = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var id = req.query.alloc_id;

            console.log("DELETE FROM [dbo].[driver_vehi_asign] where vehicle_id = " + id + "")

            request.query("DELETE FROM [dbo].[driver_vehi_asign] where vehicle_id = " + id + "", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Deleted.....");
                res.json(JSON.parse('{"status":"1"}'));


            });
            // res.redirect("/updateVehicle/"+id+"");

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.email_node = function (req, res) {
    //     userId = req.session.userId;
    //     console.log('ddd=' + userId);

    //     if (userId != null) {
    var sql = require("mssql");
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var table;
        var table_arr = [];

        request.query('SELECT * FROM [FMSUAT].[dbo].[cities]', function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            //console.log(recordset["recordsets"][0]);
            // res.render('excel_data', { data1: recordset["recordsets"][0] });

            // console.log(recordset);
            table = recordset["recordsets"][0];

            //for (var a=0; a <= table.length; a++) {
            //table_arr.push(table)
            //}
            var html = '<table border=1>';
            for (var a = 0; a < table.length; a++) {
                html += '<tr>';
                for (var b = 0; b < 1; b++) {
                    //s_table.concat("<td>"+table[0]["id"] +"</td>");
                    console.log(table[a]["id"])
                    html += '<td>' + table[a]["id"] + '</td>';
                    html += '<td>' + table[a]["city"] + '</td>';
                    html += '<td>' + table[a]["provence"] + '</td>';
                }
                html += '</tr>';
            }
            html += '</table>';

            console.log(table)

            var nodemailer = require('nodemailer');
            var transporter = nodemailer.createTransport({
                service: 'smtp',
                host: 'mail.p2ptrack.com',
                port: 465,
                secure: true,
                auth: {
                    user: "developers@p2ptrack.com",
                    pass: "pakistani123@"
                }
            });

            var mailOptions = {
                from: 'developers@p2ptrack.com',
                to: 'abdulsamadq67@gmail.com',
                subject: 'Testing Email From P2P Track',
                html: html
                // text : s_table
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });


        });
    });

    // console.log(table);


    // }
    // else {
    //     res.redirect("/login");
    // }
};

exports.Vehicle_make = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[vehicle_make]', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('vehicle_make', { data: recordset["recordsets"][0] });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.add_vehicle_make = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        if (req.method == "POST") {
            var post = req.body;
            var make = post.make_name;
            var capacity = post.capacity;


            sql.connect(config, function (err) {
                if (err) console.log(err);
                var request = new sql.Request();
                console.log("INSERT INTO [dbo].[vehicle_make]([make],[capacity])VALUES('" + make + "','" + capacity + "')")

                request.query("INSERT INTO [dbo].[vehicle_make]([make],[capacity])VALUES('" + make + "','" + capacity + "')", function (err, recordset) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset);

                    res.redirect('/vehicle_make');
                });
                // res.redirect('/updateVehicle');

            });

        }

    }
    else {
        res.redirect("/login");
    }
};


exports.delete_make = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var id = req.query.id;




            console.log("DELETE FROM [dbo].[vehicle_make] where id = " + id + "")

            request.query("DELETE FROM [dbo].[vehicle_make] where id = " + id + "", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Deleted.....");


            });
            res.redirect("/vehicle_make");

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.edit_make = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);

            var id = req.query.id;
            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[vehicle_make] where id=' + id + '', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('edit_vehicle_make', { data: recordset["recordsets"][0] });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.update_vehicle_make = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");

        var id = req.query.id;
        if (req.method == "POST") {
            var post = req.body;
            var make = post.make_name;
            var capacity = post.capacity;


            sql.connect(config, function (err) {
                if (err) console.log(err);
                var request = new sql.Request();
                console.log("UPDATE [dbo].[vehicle_make] SET [make] = '" + make + "' ,[capacity] = '" + capacity + "'  WHERE id=" + id + "")

                request.query("UPDATE [dbo].[vehicle_make] SET [make] = '" + make + "' ,[capacity] = '" + capacity + "'  WHERE id=" + id + "", function (err, recordset) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset);

                    res.redirect('/vehicle_make');
                });
                // res.redirect('/updateVehicle');

            });

        }

    }
    else {
        res.redirect("/login");
    }
};

exports.fleet_cart = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[fleet_card]', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('fleet_cart', { data: recordset["recordsets"][0] });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.add_fleet_card = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        if (req.method == "POST") {
            var post = req.body;
            var company_name = post.company_name;
            var company_np = post.company_np;
            var person_name = post.person_name;
            var person_no = post.person_no;


            sql.connect(config, function (err) {
                if (err) console.log(err);
                var request = new sql.Request();
                console.log("INSERT INTO [dbo].[fleet_card]([company_name],[phone],[contact_person],[contact_person_no])VALUES('" + company_name + "','" + company_np + "','" + person_name + "','" + person_no + "')")

                request.query("INSERT INTO [dbo].[fleet_card]([company_name],[phone],[contact_person],[contact_person_no])VALUES('" + company_name + "','" + company_np + "','" + person_name + "','" + person_no + "')", function (err, recordset) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset);

                    res.redirect('/fleet_cart');
                });
                // res.redirect('/updateVehicle');

            });

        }

    }
    else {
        res.redirect("/login");
    }
};

exports.delete_fleet_cart = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var id = req.query.id;




            console.log("DELETE FROM [dbo].[fleet_card] where id = " + id + "")

            request.query("DELETE FROM [dbo].[fleet_card] where id = " + id + "", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Deleted.....");


            });
            res.redirect("/fleet_cart");

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.edit_fleet_cart = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);

            var id = req.query.id;
            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[fleet_card] where id=' + id + '', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('edit_fleet_cart', { data: recordset["recordsets"][0] });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.update_fleet_card = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");

        var id = req.query.id;
        if (req.method == "POST") {
            var post = req.body;
            var company_name = post.company_name;
            var company_np = post.company_np;
            var person_name = post.person_name;
            var person_no = post.person_no;

            sql.connect(config, function (err) {
                if (err) console.log(err);
                var request = new sql.Request();
                console.log("UPDATE [dbo].[fleet_card] SET [company_name] ='" + company_name + "' ,[phone] = '" + company_np + "',[contact_person] = '" + person_name + "' ,[contact_person_no] = '" + person_no + "' WHERE  id=" + id + "")

                request.query("UPDATE [dbo].[fleet_card] SET [company_name] ='" + company_name + "' ,[phone] = '" + company_np + "',[contact_person] = '" + person_name + "' ,[contact_person_no] = '" + person_no + "' WHERE  id=" + id + "", function (err, recordset) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset);

                    res.redirect('/fleet_cart');
                });
                // res.redirect('/updateVehicle');

            });

        }

    }
    else {
        res.redirect("/login");
    }
};


exports.fuel_rate_profile = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[fuel_rate_profile_o]', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                request.query('SELECT * FROM [FMSUAT].[dbo].[fuel_rate_profile]', function (err, recordset2) {
                    if (err) console.log(err)
    
                    // send records as a response
                    //console.log(recordset["recordsets"][0]);
                    res.render('fuel_rate_profile', { data: recordset["recordsets"][0],data2: recordset2["recordsets"][0] });
    
    
                }); //console.log(recordset["recordsets"][0]);
                //res.render('fuel_rate_profile', { data: recordset["recordsets"][0] });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.add_fuel_rate = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        if (req.method == "POST") {
            var post = req.body;
            var fuel_type = post.fuel_type;
            var fuel_date = post.fuel_date;
            var min_rate = post.min_rate;
            var max_rate = post.max_rate;


            sql.connect(config, function (err) {
                if (err) console.log(err);
                var request = new sql.Request();
                console.log("INSERT INTO [dbo].[fuel_rate_profile]([type],[date],[min_rate],[max_rate])VALUES('" + fuel_type + "','" + fuel_date + "','" + min_rate + "','" + max_rate + "')")

                request.query("INSERT INTO [dbo].[fuel_rate_profile]([type],[date],[min_rate],[max_rate])VALUES('" + fuel_type + "','" + fuel_date + "','" + min_rate + "','" + max_rate + "')", function (err, recordset) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset);
                    request.query("UPDATE [dbo].[fuel_rate_profile_o] SET [date] = '"+fuel_date+"' ,[min_rate] = '"+min_rate+"' ,[max_rate] = '"+max_rate+"' where type = '"+fuel_type+"'", function (err, recordset) {
                        if (err) console.log(err)
                        // send records as a response
                        //console.log(recordset);
    
                        res.redirect('/fuel_rate_profile');
                    });
                    // res.redirect('/fuel_rate_profile');
                });
                // res.redirect('/updateVehicle');

            });

        }

    }
    else {
        res.redirect("/login");
    }
};

exports.delete_fuel_rate = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var id = req.query.id;




            console.log("DELETE FROM [dbo].[fuel_rate_profile] where id = " + id + "")

            request.query("DELETE FROM [dbo].[fuel_rate_profile] where id = " + id + "", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Deleted.....");


            });
            res.redirect("/fuel_rate_profile");

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.edit_fuel_rate = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);

            var id = req.query.id;
            var request = new sql.Request();

            request.query('SELECT * FROM [FMSUAT].[dbo].[fuel_rate_profile] where id=' + id + '', function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('edit_fuel_rate', { data: recordset["recordsets"][0] });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.update_fuel_rate = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");

        var id = req.query.id;
        if (req.method == "POST") {
            var post = req.body;
            var fuel_type = post.fuel_type;
            var fuel_date = post.fuel_date;
            var min_rate = post.min_rate;
            var max_rate = post.max_rate;

            sql.connect(config, function (err) {
                if (err) console.log(err);
                var request = new sql.Request();
                console.log("UPDATE [dbo].[fuel_rate_profile] SET [type] ='" + fuel_type + "' ,[date] = '" + fuel_date + "',[min_rate] = '" + min_rate + "',[max_rate] = '" + max_rate + "' WHERE   id=" + id + "")

                request.query("UPDATE [dbo].[fuel_rate_profile] SET [type] ='" + fuel_type + "' ,[date] = '" + fuel_date + "',[min_rate] = '" + min_rate + "',[max_rate] = '" + max_rate + "' WHERE   id=" + id + "", function (err, recordset) {
                    if (err) console.log(err)
                    // send records as a response
                    //console.log(recordset);

                    res.redirect('/fuel_rate_profile');
                });
                // res.redirect('/updateVehicle');

            });

        }

    }
    else {
        res.redirect("/login");
    }
};

exports.get_capacity = function (req, res) {
    var id = req.query.id;
    var sql = require("mssql");



    // connect to your database
    sql.connect(config, function (err) {

        if (err) console.log(err);


        var request = new sql.Request();

        request.query("SELECT * FROM [FMSUAT].[dbo].[vehicle_make] where id= " + id + "", function (err, recordset) {
            if (err) console.log(err)

            // send records as a response
            //console.log(recordset["recordsets"][0]);
            res.json(recordset["recordsets"][0]);


        });
    });
};

exports.delete_assign_role = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var id = req.query.id;




            console.log("DELETE FROM [FMSUAT].[dbo].[f_roles_assign] where id = " + id + "")

            request.query("DELETE FROM [FMSUAT].[dbo].[f_roles_assign] where id = " + id + "", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Deleted.....");


            });
            res.redirect("/manage_roles");

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.delete_roles = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var id = req.query.id;




            console.log("DELETE FROM [FMSUAT].[dbo].[f_roles] where id = " + id + "")

            request.query("DELETE FROM [FMSUAT].[dbo].[f_roles] where id = " + id + "", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Deleted.....");


            });
            res.redirect("/manage_roles");

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.update_active = function (req, res) {

    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");

        var status = req.query.status;
        var veh_id = req.query.veh_id;
        var currentdate = new Date();

        var datetime = currentdate.getDate() + "-"
            + (currentdate.getMonth() + 1) + "-"
            + currentdate.getFullYear() + " "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();
        console.log("han date " + datetime);


        sql.connect(config, function (err) {

            if (err) console.log(err);


            var request = new sql.Request();

            console.log("INSERT INTO [dbo].[history_vehicle_update_status]([userID],[vehicle_id],[time],[status]) VALUES ('" + userId + "','" + veh_id + "','" + datetime + "','" + status + "')");
            request.query("INSERT INTO [dbo].[history_vehicle_update_status]([userID],[vehicle_id],[time],[status]) VALUES ('" + userId + "','" + veh_id + "','" + datetime + "','" + status + "')", function (err, recordset2) {
                if (err) console.log(err)

                console.log("UPDATE [dbo].[fms_vehicle] SET [is_active] = '" + status + "' WHERE id = " + veh_id + "");
                request.query("UPDATE [dbo].[fms_vehicle] SET [is_active] = '" + status + "' WHERE id = " + veh_id + "", function (err, recordset2) {
                    if (err) console.log(err)

                    // send records as a response
                    //console.log(recordset["recordsets"][0]['id']);

                    console.log("[{status:'ok'}]");
                    res.json(JSON.parse('{"status":"ok"}'));


                });


            });


        });
    }
    else {
        res.redirect("/login");
    }


};

exports.check_fuel_rate = function (req, res) {
    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);
            var month = req.query.month;
            var type = req.query.type;


            var request = new sql.Request();
            console.log("SELECT TOP(1) * FROM [FMSUAT].[dbo].[fuel_rate_profile] where MONTH(date) = '" + month + "' and type='" + type + "' order by id desc")
            request.query("SELECT TOP(1) * FROM [FMSUAT].[dbo].[fuel_rate_profile] where MONTH(date) = '" + month + "' and type='" + type + "' order by id desc", function (err, recordset) {
                if (err) console.log(err)
                console.log("Fuel Rate")
                console.log(recordset["recordsets"][0][0]["min_rate"]);
                console.log(recordset["recordsets"][0][0]["max_rate"]);
                res.json(recordset["recordsets"][0][0]);
            });
        });
    }
    else {
        res.redirect("/login");
    }



};
var global_km = 0;
exports.hour_reports = function (req, res) {
    userId = req.session.userId;


    // connect to your database
    var vehicle_id = req.query.veh;
    var fromtime = req.query.from;
    var totime = req.query.to;
    var f_lat, f_lat_n, f_lng, f_lng_n, km, km_n = 0;


    var sql = require("mssql");
    sql.connect(config, function (err) {

        if (err) console.log(err);



        var request = new sql.Request();
        console.log("SELECT f_reportingtime,f_lat,f_lng FROM [FMSUAT].[dbo].[fms_fvehicles] WHERE f_vehnum = '"+vehicle_id+"' AND f_reportingtime >= '" + fromtime + "' AND f_reportingtime <='" + totime + "'")
       /*  request.query("SELECT f_reportingtime,f_lat,f_lng FROM [FMSUAT].[dbo].[fms_fvehicles] WHERE f_vehnum = '"+vehicle_id+"' AND f_reportingtime >= '" + fromtime + "' AND f_reportingtime <='" + totime + "'", function (err, recordset) {
            if (err) console.log(err)
            var count = recordset["recordset"].length;
            console.log("counting " + count);
            if (count > 0) {
                f_lat_n = recordset["recordset"][0]["f_lat"];
                f_lng_n = recordset["recordset"][0]["f_lng"];


                for (var i = 0; i < count; i++) {
                    f_lat = recordset["recordset"][i]["f_lat"];
                    f_lng = recordset["recordset"][i]["f_lng"];
                    console.log(f_lat_n)
                    request.query("SELECT ROUND((GEOGRAPHY ::Point(" + f_lat + ", " + f_lng + ", 4326).STDistance(GEOGRAPHY ::Point(" + f_lat_n + ", " + f_lng_n + ", 4326))), 2) / 1000 AS KM", function (err, recordset2) {
                        if (err) console.log(err)
                        km = recordset2["recordset"][0]["KM"]
                        console.log(km);
                        km_n = km + km_n;
                        console.log("Hamza" + km_n)
                        console.log(recordset2["recordset"])
                        // console.log(km_n)
                        global_km = km_n;
                    });
                    f_lat_n = recordset["recordset"][i]["f_lat"];
                    f_lng_n = recordset["recordset"][i]["f_lng"];
                }
                console.log("hello " + global_km)
                // console.log("samad")


            }
            else {
                global_km=0;
                res.send({ global_km })
            }
            //res.send({ global_km })

        }); */
        
        request.query("SELECT FromDate,[distanceKM] as distance,reg_number FROM [FMSUAT].[dbo].[dailydistance_new] where FromDate <='" + totime + "' and FromDate >= '"+fromtime+"' and reg_number='"+vehicle_id+"' order by FromDate asc", function (err, recordset) {
            if (err) console.log(err)
            // var count = recordset["recordset"][0]["sum1"];
            // console.log("counting " + count);
            /*if (count > 0) {
                f_lat_n = recordset["recordset"][0]["f_lat"];
                f_lng_n = recordset["recordset"][0]["f_lng"];


                for (var i = 0; i < count; i++) {
                    f_lat = recordset["recordset"][i]["f_lat"];
                    f_lng = recordset["recordset"][i]["f_lng"];
                    console.log(f_lat_n)
                    request.query("SELECT ROUND((GEOGRAPHY ::Point(" + f_lat + ", " + f_lng + ", 4326).STDistance(GEOGRAPHY ::Point(" + f_lat_n + ", " + f_lng_n + ", 4326))), 2) / 1000 AS KM", function (err, recordset2) {
                        if (err) console.log(err)
                        km = recordset2["recordset"][0]["KM"]
                        console.log(km);
                        km_n = km + km_n;
                        //console.log("Hamza" + km_n)
                        //console.log(recordset2["recordset"])
                        // console.log(km_n)
                        global_km = km_n;
                    });
                    f_lat_n = recordset["recordset"][i]["f_lat"];
                    f_lng_n = recordset["recordset"][i]["f_lng"];
                    if(i==count-1){

                        console.log("hello " + global_km)
                        // console.log("samad")
                        res.send({global_km})
                    }
                }


            }
            else {*/
                
                res.json(recordset["recordset"])
            // }
            //res.send({ global_km })

        });

    });



}
exports.hour_reports1 = function (req, res) {
    userId = req.session.userId;


    // connect to your database
    var vehicle_id = req.query.veh;
    var fromtime = req.query.from;
    var totime = req.query.to;


    var sql = require("mssql");
    sql.connect(config, function (err) {

        if (err) console.log(err);



        var request = new sql.Request();
        console.log("SELECT SUM(distanceKM) as distancekm,hour_time FROM [FMSUAT].[dbo].[hourlydistance_new] where vehicle_id = "+vehicle_id+" and [to_datetime] >='"+fromtime+"' and  [to_datetime] <='"+totime+"'  group by hour_time order by hour_time asc ")
        
        request.query("SELECT SUM(distanceKM) as distancekm,hour_time FROM [FMSUAT].[dbo].[hourlydistance_new] where vehicle_id = "+vehicle_id+" and [to_datetime] >='"+fromtime+"' and  [to_datetime] <='"+totime+"'  group by hour_time order by hour_time asc ", function (err, recordset) {
            if (err) console.log(err)
                res.json(recordset["recordset"])
            

        });

    });



}

exports.vehicle_monthly = function (req, res) {
    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);
            var dater = req.query.dater;


            var request = new sql.Request();
            console.log("SELECT * FROM [FMSUAT].[dbo].[view_fuel_vehicle_monthly] where as_on='" + dater + "'")
            request.query("SELECT * FROM [FMSUAT].[dbo].[view_fuel_vehicle_monthly] where as_on='" + dater + "'", function (err, recordset) {
                if (err) console.log(err)
                console.log(recordset["recordsets"][0]);
                res.json(recordset["recordsets"][0]);
            });
        });
    }
    else {
        res.redirect("/login");
    }



};

exports.region_monthly = function (req, res) {
    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);
            var dater = req.query.dater;


            var request = new sql.Request();
            console.log("SELECT * FROM [FMSUAT].[dbo].[view_fuel_region_monthly] where as_on='" + dater + "'")
            request.query("SELECT * FROM [FMSUAT].[dbo].[view_fuel_region_monthly] where as_on='" + dater + "'", function (err, recordset) {
                if (err) console.log(err)
                console.log(recordset["recordsets"][0]);
                res.json(recordset["recordsets"][0]);
            });
        });
    }
    else {
        res.redirect("/login");
    }



};

exports.area_monthly = function (req, res) {
    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);
            var dater = req.query.dater;


            var request = new sql.Request();
            console.log("SELECT * FROM [FMSUAT].[dbo].[view_fuel_area_monthly] where as_on='" + dater + "'")
            request.query("SELECT * FROM [FMSUAT].[dbo].[view_fuel_area_monthly] where as_on='" + dater + "'", function (err, recordset) {
                if (err) console.log(err)
                console.log(recordset["recordsets"][0]);
                res.json(recordset["recordsets"][0]);
            });
        });
    }
    else {
        res.redirect("/login");
    }



};

exports.edit___roles = function (req, res, next) {
    var userId = req.session.userId;
    var userName = req.session.username;
    console.log("ss=> " + userId);
    const sql = require('mssql');

    sql.connect(config, function (err) {

        if (err) console.log(err);
        var id=req.query.id;

        var request = new sql.Request();
        console.log(sql);
        console.log("SELECT * FROM [FMSUAT].[dbo].[f_roles] where id="+id+"")
        // request.query("SELECT * FROM [asif].[dbo].[fms_users] Where id = '"+userId+"'", function (err, recordset) {
        request.query("SELECT * FROM [FMSUAT].[dbo].[f_roles] where id="+id+"", function (err, recordset) {
            if (err) console.log(err)
            //
            // console.log("ayaa "+ recordset["recordsets"][0][0]["r_gps"])
            // send records as a response
            console.log(recordset["recordsets"][0][0]);
            res.send(recordset);


        });
    });

};


exports.excel_log = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);

            var request = new sql.Request();

            request.query("SELECT hl.userId,hl.created_on,hl.file_name,hl.file_random_id,fm.username FROM [FMSUAT].[dbo].[history_log_file] as hl inner join [FMSUAT].[dbo].[fms_users] as fm on hl.userID=fm.role where userId='" + userId + "'", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('excel_log', { data: recordset["recordsets"][0], moment: moment });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};
exports.excel1_log = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);

            var request = new sql.Request();

            request.query("SELECT hl.userId,hl.created_on,hl.file_name,hl.file_random_id,fm.username FROM [FMSUAT].[dbo].[history_log_file_excel1] as hl inner join [FMSUAT].[dbo].[fms_users] as fm on hl.userID=fm.role where userId='" + userId + "'", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('excel1_log', { data: recordset["recordsets"][0], moment: moment });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.excel2_view = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);

            var request = new sql.Request();

            request.query("SELECT * FROM [FMSUAT].[dbo].[vw_excelim] m inner join dbo.vehicle_all v on m.card_veh = v.reg_number", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('excel2_view', { data: recordset["recordsets"][0], moment: moment });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};
exports.excel1_view = function (req, res) {


    // connect to your database

    userId = req.session.userId;


    if (userId != null) {
        var sql = require("mssql");



        // connect to your database
        sql.connect(config, function (err) {

            if (err) console.log(err);

            var request = new sql.Request();

            request.query("SELECT * FROM [FMSUAT].[dbo].[fuel_consumption1] as fu join fms_fuel_company as fc on fu.company_id = fc.id", function (err, recordset) {
                if (err) console.log(err)

                // send records as a response
                //console.log(recordset["recordsets"][0]);
                res.render('excel1_view', { data: recordset["recordsets"][0], moment: moment });


            });
        });

    }
    else {
        res.redirect("/login");
    }
};

exports.delete_excel2 = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            // var id = req.query.id;
            var unique_id = req.query.id;




            console.log("DELETE FROM [dbo].[excelim]  WHERE rondom_id= '" + unique_id + "'")

            request.query("DELETE FROM [dbo].[excelim]  WHERE rondom_id= '" + unique_id + "'", function (err, recordset1) {
                if (err) console.log(err)

                request.query("DELETE FROM [FMSUAT].[dbo].[history_log_file]  WHERE file_random_id= '" + unique_id + "'", function (err, recordset1) {
                    if (err) console.log(err)
    
                    console.log("Deleted.....");
    
                    res.redirect("/excel_log");
                });


            });
            

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.delete_excel1 = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            // var id = req.query.id;
            var unique_id = req.query.id;




            console.log("DELETE FROM [FMSUAT].[dbo].[fuel_consumption1]  WHERE file_random_id= '" + unique_id + "'")

            request.query("DELETE FROM [FMSUAT].[dbo].[fuel_consumption1]  WHERE file_random_id= '" + unique_id + "'", function (err, recordset1) {
                if (err) console.log(err)

                request.query("DELETE FROM [FMSUAT].[dbo].[history_log_file_excel1]  WHERE file_random_id= '" + unique_id + "'", function (err, recordset1) {
                    if (err) console.log(err)
    
                    console.log("Deleted.....");
    
                    res.redirect("/excel1_log");
                });


            });
            

        });

    }
    else {
        res.redirect("/login");
    }
};

exports.update_log = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            // var id = req.query.id;
            var unique_id = req.query.vehId;
            var col_name = req.query.col_name;
            var old_val = req.query.old_val;
            var new_val = req.query.new_val;
            var created_on =  new Date().toLocaleString();
            console.log(unique_id);

            console.log("INSERT INTO [dbo].[update_log]([col_name],[old_val],[new_val],[created_by],[created_on],[veh_name])VALUES ('"+col_name+"','"+old_val+"','"+new_val+"','"+userId+"','"+created_on+"','"+unique_id+"')")

            request.query("INSERT INTO [dbo].[update_log]([col_name],[old_val],[new_val],[created_by],[created_on],[veh_name])VALUES ('"+col_name+"','"+old_val+"','"+new_val+"','"+userId+"','"+created_on+"','"+unique_id+"')", function (err, recordset1) {
                if (err) console.log(err)

                
            });
            

        });

    }
    else {
        res.redirect("/login");
    }
};
exports.responsible = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            // var id = req.query.id;
            var unique_id = req.query.veh_id;
            var userId1 = req.query.user;
            var resp_name = req.query.resp_name;
            var cars_name = req.query.cars_names;
            var created_on =  new Date().toLocaleString();
            console.log(unique_id);

            console.log("INSERT INTO [dbo].[fms_responsible] ([userId],[veh_id],[created_on],[created_by])VALUES ('"+userId1+"','"+unique_id+"','"+created_on+"','"+userId+"')")

            request.query("INSERT INTO [dbo].[fms_responsible] ([userId],[veh_id],[created_on],[created_by])VALUES ('"+userId1+"','"+unique_id+"','"+created_on+"','"+userId+"')", function (err, recordset1) {
                if (err) res.send({err})
                // res.json(JSON.parse('{"status":"ok"}'));
                 console.log("INSERT INTO [dbo].[resp_assign_h]([resp_name],[vehicle_name] ,[created_by],[created_on])VALUES ('" + resp_name + "','" + cars_name + "','" + userId + "','" + created_on + "')")
                request.query("INSERT INTO [dbo].[resp_assign_h]([resp_name],[vehicle_name] ,[created_by],[created_on])VALUES ('" + resp_name + "','" + cars_name + "','" + userId + "','" + created_on + "')", function (err, recordset) {
                    if (err) console.log(err)
    
                    // send records as a response
                    console.log("[{status:'ok'}]");
                    res.json(JSON.parse('{"status":"ok"}'));
    
    
                });
    
                
            });
            

        });

    }
    else {
        res.redirect("/login");
    }
};
exports.deletes_alloc1 = function (req, res) {
    userId = req.session.userId;
    console.log('ddd=' + userId);

    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {
            if (err) console.log(err);
            var request = new sql.Request();

            var id = req.query.alloc_id;

            console.log("DELETE FROM [dbo].[fms_responsible] where id = " + id + "")

            request.query("DELETE FROM [dbo].[fms_responsible] where id = " + id + "", function (err, recordset1) {
                if (err) console.log(err)

                console.log("Deleted.....");
                res.json(JSON.parse('{"status":"1"}'));


            });
            // res.redirect("/updateVehicle/"+id+"");

        });

    }
    else {
        res.redirect("/login");
    }
};
exports.card_history = function (req, res) {
    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);
            var dater = req.query.dater;


            var request = new sql.Request();
            console.log("SELECT * FROM [FMSUAT].[dbo].[fuel_consumption1] where card_number =  '"+dater+"' order by del_date asc")
            request.query("SELECT * FROM [FMSUAT].[dbo].[fuel_consumption1] where card_number =  '"+dater+"' order by del_date asc", function (err, recordset) {
                if (err) console.log(err)
                console.log(recordset["recordsets"][0]);
                res.render('rpt_card_number',{data1:recordset["recordsets"][0]});
            });
        });
    }
    else {
        res.redirect("/login");
    }



};
exports.rpt_dept = function (req, res) {

    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        
        
            res.render('rpt_dept');
    }
    else
    {
        res.redirect("/login");
    }

};
exports.gross = function (req, res) {
    userId = req.session.userId;


    // connect to your database


    if (userId != null) {
        var sql = require("mssql");


        sql.connect(config, function (err) {

            if (err) console.log(err);
            var from = req.query.from;
            var to = req.query.to;


            var request = new sql.Request();
            console.log("SELECT round(sum(cast(qunatity as float)),2) as total_fuel_purchased,round(avg(cast(unit_price as float)),2) as avg_fuel,round(sum(cast(gross_purchase as float)),2) as total_Amount FROM [FMSUAT].[dbo].fuel_consumption1 where del_date >=  '"+from+"' and del_date <='"+to+"' ")
            request.query("SELECT round(sum(cast(qunatity as float)),2) as total_fuel_purchased,round(avg(cast(unit_price as float)),2) as avg_fuel,round(sum(cast(gross_purchase as float)),2) as total_Amount FROM [FMSUAT].[dbo].fuel_consumption1 where del_date >=  '"+from+"' and del_date <='"+to+"' ", function (err, recordset) {
                if (err) console.log(err)
                console.log(recordset["recordsets"][0]);
                res.render('rpt_gross',{data1:recordset["recordsets"][0]});
            });
        });
    }
    else {
        res.redirect("/login");
    }



};