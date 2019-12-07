const dotenv = require('dotenv').config();
const slcspP = require('./slcspParser');

/*
Slcsp.js
Utilizes the SlcspParser Class to get the SLCSP rate

*/
const main = async () => {
    try{
        const protoparser = new protoP(process.env.DATAFILE);
        let header;
        let data;
        let load = await protoparser.loadFile();
        if (load){
            header = await protoparser.parseHeader();
            if (header){
                data = await protoparser.parseData();
                if (data){
                    protoparser.displayTotals();
                }
            }
        }
    } catch(error){
        console.log(`MAIN ERROR: ${error}`);
    }
}

main();