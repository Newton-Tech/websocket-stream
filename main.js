const { ethers } = require("ethers");
require("dotenv").config();
const abi = require("./abi/basicnft.json");

const apikey = `${process.env.ALCHEMY_GOERLI}${process.env.ALCHEMY_KEY}`;
const provider = new ethers.providers.WebSocketProvider(apikey);
const contractAddress = "0x4c0dBCEB2F3298AF0aCB0c69cdccd465347f7101"; //"0x4c0dBCEB2F3298AF0aCB0c69cdccd465347f7101"; // address of the smart contract
const contract = new ethers.Contract(contractAddress, abi, provider);

async function main() {
  provider.on("debug", (data) => {
    //console.log("data ", data);
  });

  contract.on("Transfer", (from, to, tokenId, event) => {
    console.log(`${event} token if ${tokenId}  `);

    let info = {
      from: from,
      to: to,
      tokenId: tokenId,
      data: event,
    };
    console.log(JSON.stringify(info, null, 4));
    GetTotalCost(event.transactionHash);
    getDetailsOfToken(contract, tokenId);

    console.log("done till details");

    console.log(`  event data ${event}`);
    console.log(`  event data ${event.transactionHash}`);

    //getMetaDataOfToken();

    //   if (
    //     event.returnValues.from != "0x0000000000000000000000000000000000000000"
    //   )
    //     checkForMaliciousAdd(event.returnValues.from);

    //   if (event.returnValues.to != "0x0000000000000000000000000000000000000000")
    //     checkForMaliciousAddressOnBitCoinAbuseList(event.returnValues.to);
  });
}

async function GetTotalCost(txnHash) {
  const transactionReciept = await provider.getTransactionReceipt(txnHash);

  console.log("=====================================");
  console.log("Reciept ", transactionReciept);
  const { gasUsed, effectiveGasPrice } = transactionReciept;
  console.log(
    "total gasUsed cost ",
    gasUsed.toString(),
    " effectiveGasPrice ",
    effectiveGasPrice.toString()
  );

  const gasCost = gasUsed.toString() * effectiveGasPrice.toString();
  console.log("total gasCost ", gasCost.toString(), "eth");
  const etherValue = ethers.utils.parseEther(gasCost.toString());

  console.log("total transaction cost ", etherValue.toString(), "eth");
}

async function getDetailsOfToken(contract, tokenId) {
  const tokenURI = await contract.tokenURI(tokenId);
  console.log("tokenURI ", tokenURI);

  const ownerOfTokenId = await contract.ownerOf(tokenId);
  console.log("ownerOfTokenId ", ownerOfTokenId);

  const nftCounter = await contract.getCounter();
  console.log("nftPrice ", nftCounter);
}

async function getMetaDataOfToken() {
  // Replace with the wallet address you want to query:

  console.log("fetch metadata =============");
  const tokenAddr = contractAddress;

  var data = JSON.stringify({
    jsonrpc: "2.0",
    method: "alchemy_getTokenMetadata",
    params: [`${tokenAddr}`],
    id: 42,
  });

  //   var config = {
  //     method: "post",
  //     url: apikey,
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     data: data,
  //   };

  fetch(apikey, {
    method: "post",
    headers: {
      Accept: "application/json",
    },
    data: data,
  })
    .then(function (response) {
      console.log("response ", JSON.stringify(response.data.result, null, 2));
    })
    .catch(function (error) {
      console.log("error ", error);
    });

  //   axios(config)
  //     .then(function (response) {
  //       console.log("response ", JSON.stringify(response.data.result, null, 2));
  //     })
  //     .catch(function (error) {
  //       console.log("error ", error);
  //     });
}

//check for malicious addresses on etherium abuse list
async function checkForMaliciousAdd(address) {
  // Make a request to the Ethereum Abuse List API
  fetch(
    `https://api.abuseipdb.com/api/v2/check?ethereumAddress=${address}&maxAgeInDays=90`,
    {
      headers: {
        Key: apikey, // Replace with your API key
        Accept: "application/json",
      },
    }
  )
    .then((response) => response.json()) // Parse the response as JSON
    .then((data) => {
      if (data.data.abuseConfidenceScore > 0) {
        console.log(`${address} has been flagged as potentially abusive.`);
        console.log(
          `Abuse confidence score: ${data.data.abuseConfidenceScore}`
        );
      } else {
        console.log(`${address} is not currently flagged as abusive.`);
      }
    })
    .catch((error) => console.error(error));
}

//check for malicious addresses on bitcoin abuse list
async function checkForMaliciousAddressOnBitCoinAbuseList(address) {
  // Make a request to the Bitcoin Abuse Database API
  fetch(`https://www.bitcoinabuse.com/api/reports/check?address=${address}`, {
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json()) // Parse the response as JSON
    .then((data) => {
      if (data.total > 0) {
        console.log(`${address} has been flagged as potentially abusive.`);
        console.log(`Total reports: ${data.total}`);
        console.log(`Last report: ${data.reports[0].date}`);
        console.log(`Reported by: ${data.reports[0].source}`);
      } else {
        console.log(`${address} is not currently flagged as abusive.`);
      }
    })
    .catch((error) => console.error(error));
}

main()
  .then(() => {
    console.log("done");
  })
  .catch((error) => {
    console.log(error);
  });
