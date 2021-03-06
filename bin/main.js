#!/usr/bin/env node
'use strict';

var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var prompt = Promise.promisifyAll(require('prompt'));
var analytics = require('../lib/analytics.js');
var request = require('request');

var cmd = require('../lib/cmd.js');
var key = require('../lib/keygen');
var scaffold = require('../lib/scaffold.js');
var yamlConfig = require('../lib/yaml-config.js');

var compile = require('../lib/compile.js');
var upload = require('../lib/upload.js');
var codegen = require('../lib/codegen.js');

var promptSchema = require('../lib/prompt-schema.js');
var requestPassword = require('../lib/prompt-schema.js').requestPassword;
var registerPassword = require('../lib/prompt-schema.js').registerPassword;
var createPassword = require('../lib/prompt-schema.js').createPassword;
var scaffoldApp = require('../lib/prompt-schema.js').scaffoldApp;
var transfer = require('../lib/prompt-schema.js').transfer;
var helper = require('../lib/contract-helpers.js');

var icon = require('../lib/icon.js').blocIcon;
var api = require("blockapps-js");
var Transaction = api.ethbase.Transaction;
var units = api.ethbase.Units;
var Int = api.ethbase.Int;
var ethValue = api.ethbase.Units.ethValue;

var lw = require('eth-lightwallet');

function checkAnalytics() {
    if (analytics.insight.optOut === undefined) {
      return analytics.insight.askPermission( analytics.insight.insightMsg, function(){
        main();
      });
    } else {
        main();
    }
}

function main (){

    var cmdArr = cmd.argv._;
    if (cmdArr[0] == "init") {
        console.log(icon());

        analytics.insight.trackEvent("init");

        if(cmdArr.length > 1){
            var name = cmdArr.slice(-1)[0];
            scaffoldApp.properties.appName.default = name;
        }

        var stat;

        prompt.start();
        prompt.getAsync(scaffoldApp).then(function(result) {
            try {
                stat = fs.statSync(name);
            } catch (e) {
            }

            if (stat !== undefined) {
                console.log("project: " + name + " already exists");
            } else {
                scaffold(result.appName, result.developer);
                result.transferGasLimit = 21000;
                result.contractGasLimit = 10000000;
                result.gasPrice = 50000000000;
                 
                if ((result.email !== undefined) && (result.email != "")) { 
                    var reportObj = {
                        initName: result.developer,
                        initEmail: result.email,
                        initTimestamp:  Math.floor(new Date() / 1000).toString()
                    };                    
                    console.log("report obj: " + JSON.stringify(reportObj));
                    request(
                        { 
                          method: "POST",
                          uri: "http://strato-license.eastus.cloudapp.azure.com:8081/init",
                          headers: {
                            "Content-Type": "application/json"
		          },
                          body:  JSON.stringify(reportObj),
                        },
                        function (err, res, body) { 
                            console.log("thanks for registering with BlockApps!");
                        });
                } 

                yamlConfig.writeYaml(result.appName + "/config.yaml", result);   
            }
        });
        return;
    }

    try {
        var config = yamlConfig.readYaml('config.yaml');
    } catch (e){
        throw 'Cannot open config.yaml - are you in the project directory?';
    }
    
    api.query.serverURI = config.apiURL;

    switch(cmdArr[0]) {

    case 'compile':

        analytics.insight.trackEvent("compile");

        var solSrcDir = path.normalize('./app/contracts');
        var config = yamlConfig.readYaml('config.yaml');
        if (cmdArr[1] === undefined) {
            console.log("compiling all contracts");

            var srcFiles = fs.readdirSync(solSrcDir).filter(function(filename) {
                return path.extname(filename) === '.sol';
            });
            var solSrc = srcFiles.map(function (filename) {
                console.log(path.join(solSrcDir, filename));
                return fs.readFileSync(path.join(solSrcDir, filename)).toString()
            });

            var solObjs = compile(solSrc,config.appName);
        } else if(cmdArr[1]){
            var fname = path.join(solSrcDir,
                                  path.parse(cmdArr[1]).ext === '.sol' ? cmdArr[1] : cmdArr[1] + ".sol"
                                 )
            console.log('compiling single contract: ' + fname);
            var contents = fs.readFileSync(fname).toString();
            solObjs = compile([contents], config.appName);
        }

        break;

    case 'upload':
        analytics.insight.trackEvent("upload");
        var contractName = cmdArr[1];
        if (contractName === undefined) {
            console.log("contract name required");
            break;
        }

        var userName = cmd.argv.u;
        var address = cmd.argv.a;

        var keyStream;
        if (address === undefined) { 
            keyStream = helper.userKeysStream(userName);
        } else { 
            keyStream = helper.userKeysAddressStream(userName,address);
        }

        keyStream
          .pipe(helper.collect())
          .on('data', function (data) { 
              var store = lw.keystore.deserialize(JSON.stringify(data[0]));
              var address = store.addresses[0];

              console.log("address: " + address);
              prompt.start();
              prompt.getAsync(requestPassword).then(function(result) {
                  var privkey = store.exportPrivateKey(address, result.password);
                  return upload(contractName, privkey);
              }).then(function (solObjWAddr) {
                console.log("creating metadata for " +  contractName);
              });      
          })

        break;

    case 'genkey':
        analytics.insight.trackEvent("genkey");
	var userName = cmdArr[1];

        prompt.start();
        prompt.getAsync(createPassword).get("password").then(function(password) {
            if (userName === undefined) key.generateKey(password,'admin');
	    else key.generateKey(password,userName); 
	});
        break;

    case 'register':
        analytics.insight.trackEvent("register");
        prompt.start();
        prompt.getAsync(registerPassword).get("password").then(function(password) {
            var loginObj = {
                "email": config.email,
                "app": config.appName,
                "loginpass": password
            };
            var appObj = {
                "developer": config.developer,
                "appurl": config.appURL,
                "repourl": config.repo
            };
            return api.routes.register(loginObj, appObj);
        }).tap(function() {
            console.log("registered, confirm via email")
        });
        break;

    case 'send':

        analytics.insight.trackEvent("send");

        var config = yamlConfig.readYaml('config.yaml');
        var transferObj = transfer;

        transferObj.properties.gasLimit.default = config.transferGasLimit;
        transferObj.properties.gasPrice.default = config.gasPrice;

        prompt.start();
        prompt.get(transferObj, function(err,result) {
            prompt.get(promptSchema.confirmTransfer(result), function(err2, result2) {

              var store = key.readKeystore();

              var address = store.addresses[0];
      
              var privkeyFrom = store.exportPrivateKey(address, result.password);

              var valueTX = Transaction({"value" : ethValue(result.value).in(result.unit), 
                                         "gasLimit" : Int(result.gasLimit),
                                         "gasPrice" : Int(result.gasPrice)});

              var addressTo = result.to;

              valueTX.send(privkeyFrom, addressTo).then(function(txResult) {
                console.log("transaction result: " + txResult.message);
              });                 
            });
        });
        break;

    case 'start':
        analytics.insight.trackEvent("start");
        var server = spawn('node', [ 'app.js' ]);
        server.stdout.on('data', function(data) {
           console.log(data.toString("utf-8"));
        });

        break;
    default:
        console.log("unrecognized command");
    }
}

if (require.main === module) {
    checkAnalytics();
}
