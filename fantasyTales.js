const Web3 = require('web3')
const Tx = require('ethereumjs-tx').Transaction
const util = require('ethereumjs-util');   
const Buffer = require('safe-buffer').Buffer
const setting = require('./setting.json')
const abiJson = require('./abi.json')
const web3 = new Web3('https://bsc-dataseed.binance.org/')
const common = require('ethereumjs-common');
const monsterInfo = require('./monsterInfo.json')
var express = require('express');
var request = require('request');
const abi_marketplace = require('./marketABI.json')
const chain = common.default.forCustomChain(
    'mainnet',{
      name: 'bnb',
      networkId: 56,
      chainId: 56
    },
    'petersburg'
  )

const MARKET_ADDRESS = "0x1CBC873b021F701fbd01eECBCC76f7648dcd2D23";
const address = setting.account
const privateKey = setting.privateKey
const contractAddress = setting.contract
const monsterLevel = setting.monsterLevel
const abi = abiJson
const tokenLine = setting.tokenLine
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const contract = new web3.eth.Contract(abi,contractAddress,{form: address})
let contract_marketplace = new web3.eth.Contract(abi_marketplace, MARKET_ADDRESS);
// --------- Gas --------- //

let gasPrice = util.bufferToHex(5.3 * 10 ** 9)
let gasLimit = util.bufferToHex(300000)

// --------- Log console --------- //
var log = console.log;
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

// --------- Notifiy Line --------- //
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


async function renderMarket(){
    let onSale = new Array();
    onSale = await getPetOnSale();
    for (var a = 0; a < onSale.length; a++) {
        petId = onSale[a];
        let details = await contract.methods.getTokenDetails(petId).call();
        if(details['rarity'] == 5){
            await contract_marketplace.methods.getSellerPrice(petId).call((err, p) => {
            price = web3.utils.fromWei(p, "ether");
            console.log("petId:"+petId+" rarity: "+details['rarity']+" price: "+price);
            
        });
          
      }
        
        
    }
}

async function getTimeFight(tokenId){
    let details = await contract.methods.getTokenDetails(tokenId).call();
    return details['cooldown']
}


async function getPetOnSale() {
    var ids = [];
    try {
        //Fetch market info
    
        ids = await contract_marketplace.methods.getAllTokensOnSale().call();
        // console.log(ids);
    } catch (error) {
        console.log(error);
    };
    return ids;
  };


// --------- main -------- //
async function main() {

  
  
    try {
        for(var key in monsterInfo){
          
          var obj = monsterInfo[key];
            var timeBattle = await getTimeFight(obj.tokenId)
          if(Number(Math.floor(Date.now() / 1000)) > Number(timeBattle)){
              
              const nonce  = await getTransaction(address)
              rawTx = {
                  'nonce': nonce,
                  'gasPrice': gasPrice,
                  'gasLimit': gasLimit,
                  'from': address,
                  'to': contractAddress, 
                  'value': '0x',
                  'data': contract.methods.fight(obj.tokenId,monsterLevel).encodeABI()
              }
              let tx = new Tx(rawTx,{common: chain});
              tx.sign(new Buffer.from(privateKey, 'hex'))
              let serializedTrans = tx.serialize()
              
              await web3.eth.sendSignedTransaction('0x' + 
              serializedTrans.toString('hex')).once('receipt',function(receipt){
                let res = receipt.events.FightTransaction.returnValues;
                if(res['isWin'] == false){
                    console.log("Monster info tokenId:"+obj.tokenId+" fight success You lose!");
                }else{
                    let msg = res['winToken']
                    console.log("Monster info tokenId:"+obj.tokenId+" fight success reward: "+msg);
                }
              })
            //   console.log("Monster info tokenId:"+obj.tokenId+" fight success")
        
             
          }else{
            const messgaeLog = "Fantasy GAME Fight: You need to wait at least 4 hour to battle again tokenId: "+obj.tokenId
            console.log(messgaeLog);
            // await sendNotify(messgaeLog,tokenLine)
          }
  
          
          
          
        }
    } catch (error) {
      await Promise.reject(new Error('test'));
      
    }
      
      
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
   
  
  //  await renderMarket()
      // const test = await getTimeFight(1436)
      // if(Number(Math.floor(Date.now() / 1000)) > Number(test)){
      //   console.log("Readyfight");
      // }else{
      //       console.log("no fight");
      // }
      
    
     
    // var nftId = await petNFTContract.methods.tokenOfOwnerByIndex(address, Number(0)).call();
    // var petNFTInfo = await petNFTContract.methods.getPetNFTInfo(nftId).call();
  
    // console.log(nftId);
    // console.log(petNFTInfo);
    // lstMyPetD.push(petNFTInfo)
    // if (petNFTInfo['active'] == true) {
    //   lstMyPet.push(petNFTInfo);
    // }
    // console.log(lstMyPet);
      while (true){
        
          
            await main().catch(() => {
              console.log("Transaction fail");
            });

      }
  
  
  
})()