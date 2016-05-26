# bloc

[![BlockApps logo](http://blockapps.net/img/logo_cropped.png)](http://blockapps.net)

[![Join the chat at https://gitter.im/blockapps/bloc](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/blockapps/bloc?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Build Status](https://travis-ci.org/blockapps/bloc.svg)](https://travis-ci.org/blockapps/bloc) [![npm version](https://badge.fury.io/js/blockapps-bloc.svg)](https://badge.fury.io/js/blockapps-bloc)

`bloc` makes building applications for the Ethereum blockchain as easy. Bloc uses the [blockapps api](https://blockapps.net) and provides: 
* Application scaffoldig and generated UI based on smart contracts methods to test interactions
* Generated Smart Contract APIs to make working with Ethereum smart contracts easy in any language
* Ethereum Account key management

##Installation

```
npm install -g blockapps-bloc
```

##Generate a new blockchain app

You can use `bloc init` to create a sample app.

```
bloc init
```

bloc init builds a base structure for your blockchain app as well as sets some default parameters values for creating transactions. These can be edited in the config.yaml file in your app directory.

The config.yaml file also holds the app's "apiURL".  This can be configured to point to an isolated test network, or the real Ethereum network.  You can change this link, which will allow you to build and test in a sandboxed environment, and later re-deploy on the real Ethereum blockchain.

You will find the following files in your newly created app directory:

```
/app
  /components
  /contracts
  /lib
  /meta
  /routes
  /static
  /users
app.js
bower.json
config.yaml
gulpfile.js
marko-taglib.json
node_modules
package.json
```

- The "contracts" directory holds Ethereum blockchain code, written in the Solidity language, which you can learn about here- https://solidity.readthedocs.org/en/latest/.  This is the code that will run on the blockchain.  Samples contracts have been provided to get you started.

- Key management to handle account keys for users and signing transactions with bloc. 

- Once contracts are deployed bloc provides a RESTful interface for interacting with deployed contracts. Simply call contract methods with an address and pass the password to decrypt your key.



##Creating a Sample Account

Now in your app directory run to download dependencies the app needs

```
npm install
```
Once this is finished run

```
bloc genkey
```

This generates a new user with name `admin` as well as a private key and fill it with test-ether (note- free sample Ether is only available on the test network, of course).  You can view the address information in the newly created key.json file.  Also, beware that this file contains your private key, so if you intend to use this address on the live network, make sure you keep this file hidden.

The new account has also been created on the blockchain, and you can view account information by using our REST API directly in a browser by visiting http://strato-dev2.blockapps.net/eth/v1.0/account?address= &lt; fill in your address here &gt;

![balance before](https://cloud.githubusercontent.com/assets/5578200/10926491/c5b0bd02-824c-11e5-98d7-3a9e8275a11e.png)


##Uploading Contracts

Getting a contract live on the blockchain is a two step process

1. Compile the contract
2. Upload the contract

To compile your smart contracts

```
bloc compile 
```

If there are any bugs in your contract code, this is where you will be allowed to fix them.

Upload a contract 

```
bloc upload <ContractName>
```

You will now see that Ether has been deducted from your account

![balance after](https://cloud.githubusercontent.com/assets/5578200/10926727/d91cc032-824e-11e5-928d-58574a94afbf.png)


Also, the newly created contract has been given its own address, which you can view in the data in the "user" folder.  Viewing contract information, including compiled bytecode for your Solidity contract can be done using the same URL that you use to view your own account information.

![contract info](https://cloud.githubusercontent.com/assets/5578200/10926827/8a4fcb42-824f-11e5-883b-b4704797cc02.png)

## Running The Local Webserver

Bloc ships with a node server. To get the server up and running

```
bloc start
```

Now you can visit one of the contracts in your application, for example localhost:3000/contracts/payout. Note
that the local webserver relies on dynamically generated templates, founds in the `app/components` directory.

Bloc will run through 3 contract status checks

  1. Does the contract exist in the project
  2. Has the contract been compiled
  3. Has the contract been uploaded to the network

This will be reflected in the application as well as at the terminal


##Keyserver & Contract API

Once you have a deployed contract bloc will provide a simple REST api for interacting with the contract. The api has routes for viewing contract methods, symbols, calling contract methods. The keyserver and contract api documentation can be viewed [here](http://blockapps.net/documentation#keyserver-api-endpoints) 


## Commands

```
Usage: bloc <command> (options)

Commands:
  init [name]              start a new project
  compile [contract]       compile contract in contract folder
  upload contract          upload contract to blockchain
  create                   create a new [project|module]
  genkey [name]            generate a new user and private key and fill it at the faucet. If a user exists a second key will be made
  send                     start prompt, transfer (amount*unit) to (address)
  start                    start bloc as a webserver with live reload
```

## Additional Resources
bloc uses [blockapps-js](https://github.com/blockapps/blockapps-js), our simple library for interfacing with the blockchain.
Smart contracts that are written in javascript-like language called [Solidity](https://github.com/ethereum/wiki/wiki/The-Solidity-Programming-Language). A good place to start playing around with Solidity is the [online compiler](https://chriseth.github.io/browser-solidity/).
