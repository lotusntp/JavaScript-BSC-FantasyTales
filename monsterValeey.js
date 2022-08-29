// import * as waxjs from "@waxio/waxjs/dist";
// const wax = new waxjs.WaxJS({
//   rpcEndpoint: 'https://wax.greymass.com'
// });
const Web3 = require('web3')
const Tx = require('ethereumjs-tx').Transaction
const util = require('ethereumjs-util');   
const Buffer = require('safe-buffer').Buffer
const setting = require('./setting.json')
const abiJson = require('./abi.json')
const web3 = new Web3('https://bsc-dataseed.binance.org/')
const common = require('ethereumjs-common');
const monsterInfo = require('./monsterInfo.json')
const petNFTAbi = require('./petNFTAbi.json')
var express = require('express');
var request = require('request');
const petGamesTokenAbi = require('./petGamesTokenAbi.json')
const abi_marketplace = require('./marketABI.json')
const chain = common.default.forCustomChain(
    'mainnet',{
      name: 'bnb',
      networkId: 56,
      chainId: 56
    },
    'petersburg'
  )
const address = setting.account
const privateKey = setting.privateKey
const contractAddress = setting.contract
const monsterLevel = setting.monsterLevel
const abi = abiJson
const tokenLine = setting.tokenLine
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
var PETGAMES = '0x09607078980CbB0665ABa9c6D1B84b8eAD246aA0';
PETNFT='0xFeEa83A7Ed219828e61B4D71CFf7EEeDa2769075'
const contract = new web3.eth.Contract(abi,contractAddress,{form: address})
const petNFTContract = new web3.eth.Contract(petNFTAbi,PETNFT,{form: address});
petGamesTokenContract = new web3.eth.Contract(petGamesTokenAbi,PETGAMES);

let gasPrice = util.bufferToHex(5.3 * 10 ** 9)
let gasLimit = util.bufferToHex(300000)

var lstMyPet = new Array();
var lstMyPetD = new Array();
var lstMyPetTimeFight = new Array();
var log = console.log;
var lstPetSale = new Array();
var lstPetSaleFilter = new Array();
var myBalance =  petNFTContract.methods.balanceOf(address).call();

console.log = function () {
    
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);
    
    function formatConsoleDate (date) {
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        return '[' +
               ((hour < 10) ? '0' + hour: hour) +
               ':' +
               ((minutes < 10) ? '0' + minutes: minutes) +
               ':' +
               ((seconds < 10) ? '0' + seconds: seconds) +
               
               '] ';
    }

    log.apply(console, ['\x1b[32m',formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};


async function approve() {
  
  const nonce  = await getTransaction(address)
  const rawTx = {
      nonce: nonce,
      gasPrice: gasPrice,
      gas: gasLimit,
      to: PETGAMES,
      from: address,
      value: '0x',
      data: petGamesTokenContract.methods.approve(PETNFT, "1000000000000000000000000000000").encodeABI()
  };

  let tx = new Tx(rawTx,{common: chain});
  tx.sign(new Buffer.from(privateKey, 'hex'))
  let serializedTrans = tx.serialize()
  
  const result = await web3.eth.sendSignedTransaction('0x' + 
  serializedTrans.toString('hex'))
  console.log("approve suscess");
  
}

async function sendNotify(message,lineToken){

    try {
      request({
        method: 'POST',
        uri: 'https://notify-api.line.me/api/notify',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          'bearer': lineToken
        },
        form: {
          message: message
        }
      },);
    } catch (error) {
      console.error(error);
      
    }
        
  }


async function getTransaction(address){
    const nonce  = await  web3.eth.getTransactionCount(address)
    return util.bufferToHex(nonce)
}

async function getLastFightMonster(address){
  const getLastFightMonster = await contract.methods.getLastFightMonster(address).call()
  return getLastFightMonster
}



async function getTimeFightMonster1(tokenId){

    const timeBattle = await contract.methods.getTimeFightMonster1(tokenId).call()
    return timeBattle
}

async function loadMyPet() {

  var myBalanceNft = await petNFTContract.methods.balanceOf(address).call();

  for (let from = 0; from < myBalanceNft; ) {
      to = Math.min(from + 6, myBalanceNft);
      readMyPet(from, to, address);
      from = to;
  }
}

function sortByNftId(a, b) {
  return Number(a['nftId']) - Number(b['nftId']);
}

async function readMyPet(from, to, sender) {
  for (let i = from; i < to; i++) {
      var nftId = await petNFTContract.methods.tokenOfOwnerByIndex(sender, Number(i)).call();
      console.log(nftId);
      var petNFTInfo = await petNFTContract.methods.getPetNFTInfo(nftId).call();
      lstMyPetD.push(petNFTInfo);
      if (petNFTInfo['active'] == true) {
          lstMyPet.push(petNFTInfo);
      }
  }
  // if (lstMyPetD.length == myBalance) {
  //     lstMyPet.sort(sortByNftId);
  //     forLstMyPet();

  // }
}

async function forLstMyPet() {
  var count = 0;
  for (let i = 0; i < lstMyPet.length; i++) {
      var content = "";
      var petNFTInfo = lstMyPet[i];
      console.log(petNFTInfo);
  }
}


function sortFunction(a, b) {
  if (Number(a['salePrice']) > Number(b['salePrice'])) {
      return 1;
  } else if (Number(a['salePrice']) == Number(b['salePrice'])) {
      if (Number(a['scarce']) < Number(b['scarce'])) {
          return 1;
      } else if (Number(a['scarce']) == Number(b['scarce'])) {
          if (Number(a['exp']) < Number(b['exp'])) {
              return 1;
          } else if (Number(a['exp']) == Number(b['exp'])) {
              return 0;
          } else {
              return -1;
          }
      } else {
          return -1;
      }
  } else {
      return -1;
  }
}

async function loadMarket() {
  marketSize = await petNFTContract.methods.balanceOf(PETNFT).call();
  for (let from = 0; from < marketSize; ) {
      to = Math.min(from + 4, marketSize);
      readMarket(from, to, PETNFT);
      from = to;
  }
}

async function readMarket(from, to, sender) {
  var content = "";
  for (let i = from; i < to; i++) {
      var nftId = await petNFTContract.methods.tokenOfOwnerByIndex(sender, Number(i)).call();
      var petNFTInfo = await petNFTContract.methods.getPetNFTInfo(nftId).call();
      lstPetSale.push(petNFTInfo);
      if(petNFTInfo['scarce'] == 5 && Number(petNFTInfo['salePrice']) <= 39000 ){
          
            console.log("NtfId: "+petNFTInfo['nftId']+" Scarce: "+petNFTInfo['scarce']+" Price: "+petNFTInfo['salePrice'])
          
           
      }
     
  }
  // if (lstPetSale.length == marketSize) {
  //     lstPetSale.sort(sortFunction);
      
  // }
}

async function getPetOnSale() {
  var ids = [];
  try {
      //Fetch market info
  let abi_marketplace = await getAbi_MarketPlace();
  let contract_marketplace = new web3.eth.Contract(abi_marketplace, MARKET_ADDRESS);
      ids = await contract_marketplace.methods.getAllTokensOnSale().call();
  } catch (error) {
      console.log(error);
  };
  return ids;
};

var countWin = new Array()
var winCount = 0
var rpc = require('./rpc.json')

async function main() {

  
  
  try {
      for(var key in monsterInfo){
        await delay(2000)
        var obj = monsterInfo[key];
          var timeBattle = await contract.methods.getTimeFightMonster1(obj.tokenId).call()
        if(Number(Math.floor(Date.now() / 1000)) > Number(timeBattle)){
            await delay(10000)
            // console.log("nonce");
            const nonce  = await getTransaction(address)
            rawTx = {
                'nonce': nonce,
                'gasPrice': gasPrice,
                'gasLimit': gasLimit,
                'from': address,
                'to': contractAddress, 
                'value': '0x',
                'data': contract.methods.fightMonster1(obj.tokenId,monsterLevel).encodeABI()
            }
            let tx = new Tx(rawTx,{common: chain});
            tx.sign(new Buffer.from(privateKey, 'hex'))
            let serializedTrans = tx.serialize()
            
            const result = await web3.eth.sendSignedTransaction('0x' + 
            serializedTrans.toString('hex'))
            
            
            const reward = await getLastFightMonster(address)
            console.log("Monster info tokenId:"+obj.tokenId+" fight success reward: "+reward.reward)
            if(reward.win == true){
              const textReward = "Moster info tokenId: "+obj.tokenId+" fight success reward: "+reward.reward
              await sendNotify(textReward,tokenLine)
            }else{
              const textReward = "Moster info tokenId: "+obj.tokenId+" fight success Lose"
              await sendNotify(textReward,tokenLine)
            }
           
        }else{
          const messgaeLog = "PET GAME Fight: You need to wait at least 4 hour to battle again tokenId: "+obj.tokenId
          console.log(messgaeLog);
          // await sendNotify(messgaeLog,tokenLine)
        }

        
        
        
      }
  } catch (error) {
    // console.error("Transaction error");
    // await sendNotify(error,tokenLine)
    await Promise.reject(new Error('test'));
    
  }
    
    
}



async function buyOrder(nftId) {
  const nonce  = await getTransaction(address)
  const rawTx = {
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      to: PETNFT,
      from: address,
      value: '0x',
      data: petNFTContract.methods.buyOrderNFT(nftId).encodeABI()
  };

  let tx = new Tx(rawTx,{common: chain});
  tx.sign(new Buffer.from(privateKey, 'hex'))
  let serializedTrans = tx.serialize()
  
  const result = await web3.eth.sendSignedTransaction('0x' + 
  serializedTrans.toString('hex'))
  console.log("buy suscess");
}

 

(async () => {


  // for( key in monsterInfo){
  //   const obj = monsterInfo[key]
  //    var timeBattle = await getTimeFightMonster1(obj.tokenId)
  //    if((Number(Math.floor(Date.now() / 1000)) > Number(timeBattle))){
  //       console.log(true);
  //       }else{
  //       console.log(false);
  //       } 
  // }
 
  print("heelo")

 
  

   
  // var nftId = await petNFTContract.methods.tokenOfOwnerByIndex(address, Number(0)).call();
  // var petNFTInfo = await petNFTContract.methods.getPetNFTInfo(nftId).call();

  // console.log(nftId);
  // console.log(petNFTInfo);
  // lstMyPetD.push(petNFTInfo)
  // if (petNFTInfo['active'] == true) {
  //   lstMyPet.push(petNFTInfo);
  // }
  // console.log(lstMyPet);
    // while (true){
      
        
    //       await main().catch(() => {
    //         console.log("Transaction fail");
    //       });
    
    // }



  })()

// const web3 = new Web3('https://bsc-dataseed.binance.org/')
// const txCount =  web3.eth.getTransactionCount(account.address)

