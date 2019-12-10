
const chai = require("chai");
const chaiAsPromised = require('chai-as-promised'); 
const dotenv = require('dotenv').config();
const slcspP = require('../slcspParser');
const expect = chai.expect;
chai.use(chaiAsPromised);


describe("SLCSP: SLCSP identifier for Node", () => {
  describe("slcspParse Class", () => {
    it("Creates a slcspParse Class and loads CSV data files", async () => {
      
      let slcsp = new slcspP(
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
      let load = await slcsp.loadSLCPCSV();
    });
  });
})
