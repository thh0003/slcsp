const fs = require('fs').promises;

/* 
 SCCSP Parser Parsers a 3 files to determine the SLCSP
 
 Javascript Class which reads a binary data file and parses the contents
*/
class slcspParser {

    constructor(plans,zips,slcspList){
        this.slcspData = {
            plansHash: new Map(),
            zipsHash: new Map(),
            slcspOutput: [],
            plansFP: plans,
            zipsFP: zips,
            slcspFP: slcspList
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
    async loadHash (filepath,numColumns) {
        try{
            
            if (this.protoData.fsPath){
                this.protoData.rawData = await fs.readFile(this.protoData.fsPath);
            } else {
                throw new Error('File Path not Specified');                
            }

            if (this.protoData.rawData.length > 0) {
                return true;
            } else {
                throw new Error('File is empty')
            }
        } catch (error){
            throw new Error(`LOAD FILE ERROR: ${error}`);
        }
    
    }

    /* 
        1) Reads the binary data from the buffer based on the header info
        2) Updates the totals
        3) Updates the user accounts
    */
    async parseData () {
        try{            
            for (let x=0;x<this.protoData.Records;x++){
                let type = '';
                let time = 0;
                let user = 0;
                let amount = 0.00;
                let curRecLeng = 13;
                type = this.protoData.rawData.readInt8(this.protoData.fsCurLoc);
                curRecLeng = (type == 0 || type == 1)?21:13;
                this.protoData.fsCurLoc = this.protoData.fsCurLoc + 1;
    
                time = (this.protoData.endian)?this.protoData.rawData.readUInt32BE(this.protoData.fsCurLoc):this.protoData.rawData.readUInt32LE(this.protoData.fsCurLoc);
                this.protoData.fsCurLoc = this.protoData.fsCurLoc + 4;
    
                user = (this.protoData.endian)? this.protoData.rawData.readBigUInt64BE(this.protoData.fsCurLoc):this.protoData.rawData.readBigUInt64LE(this.protoData.fsCurLoc);
                this.protoData.fsCurLoc = this.protoData.fsCurLoc + 8;
    
                if (curRecLeng > 13){
                    amount = (this.protoData.endian)? this.protoData.rawData.readDoubleBE(this.protoData.fsCurLoc):this.protoData.rawData.readDoubleLE(this.protoData.fsCurLoc);
                    this.protoData.fsCurLoc = this.protoData.fsCurLoc + 8;
    
                }
    
                await this.updateTotals (type, amount);
                this.protoData.payload.push(new Array(type,time,user,amount));
                await this.updateAccount(type, user.toString(), amount);
                ///console.log(`Adding Record ${x} | ${type} | ${time} | ${user} | ${amount} --- Current Buffer Location: ${this.protoData.fsCurLoc}`)
                        
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
            if (this.protoData.account.has(user)){
                userAcct = this.protoData.account.get(user);
                balance = userAcct[0];
                autopay = userAcct[1];
            } else {
                this.protoData.account.set(user, new Array(balance, autopay));
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
            this.protoData.account.set(user, [balance,autopay]);
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
                    this.protoData.totalDebit = this.protoData.totalDebit + amount;
                    break;
                case 1:
                    type = 'Credit';
                    this.protoData.totalCredit = this.protoData.totalCredit + amount;
                    break;
                case 2:
                    type = 'StartAutopay';
                    this.protoData.autopayStarts++;
                    break;
                case 3:
                    type = 'EndAutopay';
                    this.protoData.autopayEnds++;
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
            if (this.protoData.rawData.length > 9){
                
                this.protoData.Magic = this.protoData.rawData.slice(this.protoData.fsCurLoc, 4).toString()
                this.protoData.fsCurLoc = this.protoData.fsCurLoc + 4;
                this.protoData.Version = this.protoData.rawData.readInt8(this.protoData.fsCurLoc);
                this.protoData.fsCurLoc++;
                this.protoData.Records =  (this.protoData.endian)? this.protoData.rawData.readUInt32BE(this.protoData.fsCurLoc):this.protoData.rawData.readUInt32LE(this.protoData.fsCurLoc);
                this.protoData.fsCurLoc = this.protoData.fsCurLoc + 4;
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
             console.log(`total credit amount=$${this.protoData.totalCredit.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
            console.log(`total debit amount=$${this.protoData.totalDebit.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
            console.log(`autopays started=${this.protoData.autopayStarts.toFixed(1)}`);
            console.log(`autopays ended=${this.protoData.autopayEnds.toFixed(1)}`);
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
            let userAct = this.protoData.account.get(user);
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
            for (let [key,value] of this.protoData.account.entries()){
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