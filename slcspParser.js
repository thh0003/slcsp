const fs = require('fs');
const readline = require('readline');

/* 
 SCCSP Parser Parsers a 3 files to determine the SLCSP
 
 Javascript Class which reads a 3 CSV Files and finds the SLCSP for a given list of zip codes and returns as a CSV via STDOUT
*/
class slcspParser {

    constructor(plans,zips,slcspList){
        try{
            if (plans != undefined && zips != undefined && slcspList != undefined ) {
                if (fs.existsSync(plans) && fs.existsSync(zips) && fs.existsSync(slcspList)){
                    this.slcspData = {
                        plansArr: [],
                        zipsArr: [],
                        slcspArr: [],
                        filteredPlans: [],
                        filterZips:[],
                        plansFP: plans,
                        zipsFP: zips,
                        slcspFP: slcspList
                    };
                } else {
                    throw (`A CSV File does not exist`)
                }
            } else {
                throw (`A Parameter is Undefined`);
            }
        } catch (err) {
            throw new Error(`slcspParser Constructor Error: ${err}`);
        }
        
    }

    getPlansFP (){return this.slcspData.plansFP};
    getZipsFP (){return this.slcspData.zipsFP};
    getSlcspFP (){return this.slcspData.slcspFP};

    /* 
      Read's input files into their Array.  Returns the Array
    */
    async loadCSV (filepath) {
        try{
            if (fs.existsSync(filepath)) {
                const readStream = fs.createReadStream(filepath,{
                    encoding: 'utf8'
                });
                let retArr = new Array();
                const rl = readline.createInterface({
                    input: readStream,
                    crlfDelay: Infinity
                });
                
                let x=0;
                for await (const line of rl) {
                    let tmpArr = line.split(',');
                    tmpArr.push(x); // Original Order
                    if (x>0) retArr.push(tmpArr);
                    x++;
                }

                return retArr;
            } else {
                throw new Error(`File does not exist`);    
            }
        } catch (error){
            throw new Error(`LOAD CSV ERROR: ${error}`);
        }
    
    }


    /* 
        Filter the plans to only include the rateArea and the desired metal_Level
        inputs:
            planLVL = String
            rateArea = integer
        output: Object {
            plan: <plan id>,
            rate: <plan rate>
        }
    */
    async filterPlans(planLVL, rateArea) {
        try{
            //Select all of the planLVL Plans
            this.slcspData.filteredPlans = this.slcspData.plansArr.filter((plan) => {
                //Bronze, Silver, Gold, Platinum, or Catastrophic and filter rateArea
                return plan[2] == planLVL && plan[4] == rateArea ; 
            });
            if (this.slcspData.filteredPlans.length > 1) {
                //Remove Plans with only 1 rate. Sort the plans by rate

                this.slcspData.filteredPlans = this.slcspData.filteredPlans.sort((itemA, itemB)=>{
                    return itemA[3]-itemB[3];
                });

                let lowRate = {
                    plan: this.slcspData.filteredPlans[0][0],
                    rate: this.slcspData.filteredPlans[0][3],
                };
                let secondRate = {
                    plan: this.slcspData.filteredPlans[0][0],
                    rate: this.slcspData.filteredPlans[0][3],
                };
                let found = false;

                for (let x =0; x < this.slcspData.filteredPlans.length;x++){
                    if (!found && this.slcspData.filteredPlans[x][3]>lowRate.rate){
                        secondRate.plan = this.slcspData.filteredPlans[x][0];
                        secondRate.rate = this.slcspData.filteredPlans[x][3];
                        found = true;
                    }
                }
                return secondRate;
            } else{
                return false;
            }
        } catch (error){
            throw new Error(`FILTERPLANS ERROR: ${error}`);
        }
    
    }


    /* 
        Filter the zips CVS to only include the zip code specified
        inputs:
            zip = string
        output: 
            ratearea = integer
    */
    async filterZipCodes(zip) {
        try{
            //Select all of the rate areas for Zip
            this.slcspData.filterZips = this.slcspData.zipsArr.filter((zips) => {
                //Filter Rate Areas
                return zips[0] == zip; 
            });

            if (this.slcspData.filterZips.length > 0){
                //remove duplicate rate areas
                let curRA = this.slcspData.filterZips[0][4];
                let ra = this.slcspData.filterZips.reduce((currentRA, rateArea)=>{
                    if (currentRA[4] == rateArea[4]){
                        return currentRA
                    } else {
                        currentRA[4] = currentRA[4] + rateArea[4];
                        return currentRA;
                    }
                });
                if (curRA == ra[4]) {
                    //Only one rate area
                    return this.slcspData.filterZips[0][4];
                } else{
                    // `Zip Code ${zip} has more than 1 rate area`
                    return false;
                }
             } else{
                    // `Zip Code ${zip} does not have a rate area`
                    return false;
             }
        } catch (error){
            throw new Error(`FILTERZIPCODES ERROR: ${error}`);
        }
    
    }


    /* 
        Loads the 3 CSV Files
        Output: true if the files are loaded
    */
    async loadSLCPCSV(){
        try{
            this.slcspData.zipsArr = await this.loadCSV(this.slcspData.zipsFP);
            this.slcspData.plansArr = await this.loadCSV(this.slcspData.plansFP);
            this.slcspData.slcspArr = await this.loadCSV(this.slcspData.slcspFP);
            return true;
        } catch (error){
            throw new Error(`LOADSLCPCSV ERROR: ${error}`);
        }
    }

     /* 
        Looksup all of the SLCSP plans for the zipcodes provided in the slcsp.csv file
        inputs:

        output: 
            outputs to stdout a CSV list of slcsp rates
    */
    async processSLCSP(){
        try{
            process.stdout.write(`zipcode,rate\n`);
            for(let x=0;x<this.slcspData.slcspArr.length;x++){
                let curZip = this.slcspData.slcspArr[x][0];
                let curRateArea = await this.filterZipCodes(curZip);

                if (!curRateArea){
                    this.slcspData.slcspArr[x][1] = '';
                } else {
                    let curSLCSP = await this.filterPlans('Silver',curRateArea);
                    this.slcspData.slcspArr[x][1] = curSLCSP.rate;
    
                }
                let outRate = this.slcspData.slcspArr[x][1];
                process.stdout.write(`${curZip},${(outRate=='')?outRate:Number(outRate).toFixed(2)}\n`);
            }
            return true;
        } catch (error){
            throw new Error(`PROCESSSLCP ERROR: ${error}`);
        }
    }
};

module.exports = slcspParser;