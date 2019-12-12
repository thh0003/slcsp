const dotenv = require('dotenv').config();
const slcspP = require('./slcspParser');

/*
Slcsp.js
Utilizes the SlcspParser Class to get the SLCSP rate

*/
const main = async () => {
    try{
        const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
        let load = await slcspparser.loadSLCPCSV();
        if (load){
            //Filter the plans to leave only the Silver Plans
            let proSLCSP = slcspparser.processSLCSP();

        }
    } catch(error){
        console.log(`MAIN ERROR: ${error}`);
    }
}

main();