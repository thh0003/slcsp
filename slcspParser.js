//const fs = require('fs').promises;
const fs = require('fs');
const readline = require('readline');
const parse = require('csv-parse');

/* 
 SCCSP Parser Parsers a 3 files to determine the SLCSP
 
 Javascript Class which reads a binary data file and parses the contents
*/
class slcspParser {

    constructor(plans,zips,slcspList){
        
        this.slcspData = {
            plansArr: [],
            zipsArr: [],
            slcspArr: [],
            slcspOutput: [],
            filteredPlans: [],
            filterZips:[],
            plansFP: {
                fp : plans.fp,
                cols : plans.cols
            },
            zipsFP: {
                fp : zips.fp,
                cols : zips.cols
            },
            slcspFP: {
                fp : slcspList.fp,
                cols : slcspList.cols
            }

        };
        
    }

    /* 
     getters and setters for the class
    */
    getPlansFP() { return this.slcspData.plansFP; }
    getzipsFP() { return this.slcspData.zipsFP; }
    getslcspFP() { return this.slcspData.slcspFP; }

    /* 
      Read's input files into their Hashtable.  Returns the HashTable
    */
    async loadCSV (filepath,numColumns) {
        try{
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
        } catch (error){
            throw new Error(`LOAD HASH ERROR: ${error}`);
        }
    
    }

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

                console.log(`SLCSP RATE: ${secondRate.rate}, SLCSP PLAN: ${secondRate.plan}`);
                return secondRate;
            } else{
                console.log(`Rate Area: ${rateArea} does not contain at least 2 Metal Level: ${planLVL} plans`);
                return false;
            }
        } catch (error){
            throw new Error(`FILTERPLANS ERROR: ${error}`);
        }
    
    }

    async filterZipCodes(zip) {
        try{
            //Select all of the rate areas for Zip
            this.slcspData.filterZips = this.slcspData.zipsArr.filter((zips) => {
                //Filter Rate Areas
                return zips[0] == zip; 
            });

            if (this.slcspData.filterZips.length > 0){
                if (this.slcspData.filterZips.length < 2) {
                    //Only one rate area
                    console.log(`ZIP CODE: ${zip}, HAS RATE AREA: ${this.slcspData.filterZips[0][4]}`);
                    return this.slcspData.filterZips[0][4];
                } else{
                    throw new Error(`Zip Code ${zip} has more than 1 rate area`);
                }
             } else{
                    throw new Error(`Zip Code ${zip} does not have a rate area`);
             }
        } catch (error){
            throw new Error(`FILTERZIPCODES ERROR: ${error}`);
        }
    
    }

    async loadSLCPCSV(){
        try{
            this.slcspData.zipsArr = await this.loadCSV(this.slcspData.zipsFP.fp,this.slcspData.zipsFP.cols);
            this.slcspData.plansArr = await this.loadCSV(this.slcspData.plansFP.fp,this.slcspData.plansFP.cols);
            this.slcspData.slcspArr = await this.loadCSV(this.slcspData.slcspFP.fp,this.slcspData.slcspFP.cols);
            return true;
        } catch (error){
            throw new Error(`LOADSLCPCSV ERROR: ${error}`);
        }
    }


    /* 
        1) Reads the binary data from the buffer based on the header info
        2) Updates the totals
        3) Updates the user accounts
    */
    async parseData () {
        try{            
            for (let x=0;x<this.slcspData.Records;x++){
                let type = '';
                let time = 0;
                let user = 0;
                let amount = 0.00;
                let curRecLeng = 13;
                type = this.slcspData.rawData.readInt8(this.slcspData.fsCurLoc);
                curRecLeng = (type == 0 || type == 1)?21:13;
                this.slcspData.fsCurLoc = this.slcspData.fsCurLoc + 1;
    
                time = (this.slcspData.endian)?this.slcspData.rawData.readUInt32BE(this.slcspData.fsCurLoc):this.slcspData.rawData.readUInt32LE(this.slcspData.fsCurLoc);
                this.slcspData.fsCurLoc = this.slcspData.fsCurLoc + 4;
    
                user = (this.slcspData.endian)? this.slcspData.rawData.readBigUInt64BE(this.slcspData.fsCurLoc):this.slcspData.rawData.readBigUInt64LE(this.slcspData.fsCurLoc);
                this.slcspData.fsCurLoc = this.slcspData.fsCurLoc + 8;
    
                if (curRecLeng > 13){
                    amount = (this.slcspData.endian)? this.slcspData.rawData.readDoubleBE(this.slcspData.fsCurLoc):this.slcspData.rawData.readDoubleLE(this.slcspData.fsCurLoc);
                    this.slcspData.fsCurLoc = this.slcspData.fsCurLoc + 8;
    
                }
    
                await this.updateTotals (type, amount);
                this.slcspData.payload.push(new Array(type,time,user,amount));
                await this.updateAccount(type, user.toString(), amount);
                ///console.log(`Adding Record ${x} | ${type} | ${time} | ${user} | ${amount} --- Current Buffer Location: ${this.slcspData.fsCurLoc}`)
                        
            }
            return true;
        } catch (error){
            throw new Error(`PARSE DATA ERROR: ${error}`);
        }
    
    }

    /* 
        Updates the accounts of the users.  If the user account is
        new it creates an entry for them
        inputs:
            type = integer
            user = uint64
            amount = double
    */
    async updateAccount (type, user, amount) {

        try{
            //Find out of if user exists yet
            let autopay = false;
            let balance = 0.00;
            let userAcct;
            if (this.slcspData.account.has(user)){
                userAcct = this.slcspData.account.get(user);
                balance = userAcct[0];
                autopay = userAcct[1];
            } else {
                this.slcspData.account.set(user, new Array(balance, autopay));
            }
    
            switch (type){
                case 0:
                    balance = balance - amount;
                    break;
                case 1:
                    balance = balance + amount;
                    break;
                case 2:
                    autopay = true;
                    break;
                case 3:
                    autopay = false;
                    break;
            }
            this.slcspData.account.set(user, [balance,autopay]);
            return true
        } catch (error){
            throw new Error(`UPDATE ACCOUNT ERROR: ${error}`);
        }
    }
    
    /* 
        Updates the totals of the file
        inputs:
            type = integer
            amount = double
    */
    async updateTotals (type, amount) {
        try {
            switch (type){
                case 0:
                    type = 'Debit';
                    this.slcspData.totalDebit = this.slcspData.totalDebit + amount;
                    break;
                case 1:
                    type = 'Credit';
                    this.slcspData.totalCredit = this.slcspData.totalCredit + amount;
                    break;
                case 2:
                    type = 'StartAutopay';
                    this.slcspData.autopayStarts++;
                    break;
                case 3:
                    type = 'EndAutopay';
                    this.slcspData.autopayEnds++;
                    break;
            }
            return true;
        } catch (error){
            throw new Error(`UPDATE TOTALS ERROR: ${error}`);
        }
    }

    /* 
        Reads the file header and determines the file size, and version
    */
    async parseHeader() {
        //Reads the Header information
        
        try{
            //Check Data is available
            if (this.slcspData.rawData.length > 9){
                
                this.slcspData.Magic = this.slcspData.rawData.slice(this.slcspData.fsCurLoc, 4).toString()
                this.slcspData.fsCurLoc = this.slcspData.fsCurLoc + 4;
                this.slcspData.Version = this.slcspData.rawData.readInt8(this.slcspData.fsCurLoc);
                this.slcspData.fsCurLoc++;
                this.slcspData.Records =  (this.slcspData.endian)? this.slcspData.rawData.readUInt32BE(this.slcspData.fsCurLoc):this.slcspData.rawData.readUInt32LE(this.slcspData.fsCurLoc);
                this.slcspData.fsCurLoc = this.slcspData.fsCurLoc + 4;
                return true;
            } else {
                throw new Error('File is empty');
            }
        } catch (error){
            throw new Error(`PARSE HEADER ERROR: ${error}`);
        }
    }

    /*  
        Display's the file totals and user 2456938384156277127's balance

        I did not come up with the regular expression to add the commas to the number format, it is genius.  It was from StackOverflow:
        https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript

        User: Elias Zamaria
    */
    async displayTotals() {
        //Reads the Header information
        
        try{
             console.log(`total credit amount=$${this.slcspData.totalCredit.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
            console.log(`total debit amount=$${this.slcspData.totalDebit.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
            console.log(`autopays started=${this.slcspData.autopayStarts.toFixed(1)}`);
            console.log(`autopays ended=${this.slcspData.autopayEnds.toFixed(1)}`);
            console.log(`balance for user 2456938384156277127=$${await this.userBalance('2456938384156277127')}`);
         } catch (error){
            throw new Error(`DISPLAY TOTALS ERROR: ${error}`);
        }
    }
    
    /*  
        Takes a user id as input and returns their balance

    */
    async userBalance (user){
        //Reads the Header information
        
        try{
            let userAct = this.slcspData.account.get(user);
            return userAct[0].toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } catch (error){
            throw new Error(`USER BALANCE ERROR: ${error}`);
        }
    }

    /*  
        Display's all the user accounts.  Not required, just was useful. 

    */
    async displayAllAccounts(){
        //Reads the Header information
        
        try{

            console.log(`*************************************************`);
            console.log(`*     *                      *          *       *`);
            console.log(`*  #  *        User          * Balance  *  Auto *`);
            console.log(`*     *                      *          *       *`);
            console.log(`*************************************************`);
            console.log(`*     *                      *           *      *`);
            let num = 1;
            for (let [key,value] of this.slcspData.account.entries()){
                console.log(`*  ${(num>=10)?num:num+' '} * ${key}  *  $${(value[0]==0.00)?' 0.00  ':value[0].toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} * ${value[1]} *`);
                console.log(`*     *                      *           *      *`);
                num++;
            }
            
            console.log(`*************************************************`);
        } catch (error){
            throw new Error(`DISPLAY TOTALS ERROR: ${error}`);
        }
    }

};

module.exports = slcspParser;