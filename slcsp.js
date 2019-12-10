const dotenv = require('dotenv').config();
const slcspP = require('./slcspParser');

/*
Slcsp.js
Utilizes the SlcspParser Class to get the SLCSP rate

*/
const main = async () => {
    try{
        const slcspparser = new slcspP(
            {
                fp : process.env.PLANS,
                cols : process.env.PLANSCOLS
            },
            {
                fp : process.env.ZIPS,
                cols : process.env.ZIPSCOLS
            },
            {
                fp : process.env.SLCSP,
                cols : process.env.SLCSPCOLS
            }
        );
        let load = await slcspparser.loadSLCPCSV();
        if (load){
            //Filter the plans to leave only the Silver Plans
            let filterSLCSP = slcspparser.filterPlans('Silver',60);
            if (filterSLCSP){
                console.log
            }
            let filterZIP = slcspparser.filterZipCodes('61614');
            if (filterZIP){
                console.log
            }
        }
    } catch(error){
        console.log(`MAIN ERROR: ${error}`);
    }
}

main();