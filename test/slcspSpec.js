
const chai = require("chai");
const chaiAsPromised = require('chai-as-promised'); 
const dotenv = require('dotenv').config();
const slcspP = require('../slcspParser');
const expect = chai.expect;
chai.use(chaiAsPromised);


describe("SLCSP: SLCSP identifier for Node", () => {
  describe("slcspParse Class", () => {
    it("Creates a slcspParse Class and Saves path's to csv files", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      expect(slcspparser.getPlansFP()).to.equal('plans.csv');
      expect(slcspparser.getZipsFP()).to.equal('zips.csv');
      expect(slcspparser.getSlcspFP()).to.equal('slcsp.csv');
    });

    it("Error's on creating a slcspParse Class when paths are wrong or empty", async () => {
      expect(() => {new slcspP(process.env.PLANS)}).to.throw('slcspParser Constructor Error: A Parameter is Undefined');
      expect(() => {new slcspP(process.env.PLANS,process.env.ZIPS,'process.env.SLCSP')}).to.throw('slcspParser Constructor Error: A CSV File does not exist');
    });

    it("Creates a slcspParse Class and Load CSV Files", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      return expect(slcspparser.loadCSV(slcspparser.getPlansFP())).to.eventually.be.instanceof(Array);
    });

    it("Errors on loading when path is empty", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      return expect(slcspparser.loadCSV()).to.eventually.be.rejectedWith(`LOAD CSV ERROR: Error: File does not exist`);
    });

    it("Errors on loading when path is wrong", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      return expect(slcspparser.loadCSV()).to.eventually.be.rejectedWith(`LOAD CSV ERROR: Error: File does not exist`);
    });

    it("Filter Plans returns false the planarea doesn't have the desired metal level", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      await slcspparser.loadSLCPCSV();
      return expect(slcspparser.filterPlans('Catastrophic', 500)).to.eventually.be.false;
    });

    it("Filter Plans returns true when the planarea does have the desired metal level", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      await slcspparser.loadSLCPCSV();
      return expect(slcspparser.filterPlans('Silver', 60)).to.eventually.be.instanceof(Object);
    });

    it("Filter Zips returns false when Zip Code ${zip} has more than 1 rate area", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      await slcspparser.loadSLCPCSV();
      return expect(slcspparser.filterZipCodes('48418')).to.eventually.be.false;
    });

    it("Filter Zips returns false when `Zip Code ${zip} does not have a rate area`", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      await slcspparser.loadSLCPCSV();
      return expect(slcspparser.filterZipCodes('01614')).to.eventually.be.false;
    });

    it("Filter Plans returns rate area for the zip code", async () => {
      const slcspparser = new slcspP(process.env.PLANS,process.env.ZIPS,process.env.SLCSP);
      await slcspparser.loadSLCPCSV();
      return expect(slcspparser.filterZipCodes('61614')).to.eventually.be.equal('7');
    });

  });
})
