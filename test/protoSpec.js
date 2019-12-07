
const chai = require("chai");
const chaiAsPromised = require('chai-as-promised'); 
const dotenv = require('dotenv').config();
const protoP = require('../protoParser');
const expect = chai.expect;
chai.use(chaiAsPromised);


let ProtoP;
const throwTest = async () => {
  await ProtoP.loadFile();
};

describe("Proto: Binary File Parser for Node", () => {
  describe("ProtoParse Class", () => {
    it("Creates a ProtoParse Class and loads default values", () => {
      
      ProtoP = new protoP(process.env.DATAFILE)
      expect(ProtoP.getMagic()).to.equal(null);
      expect(ProtoP.getVersion()).to.equal(null);
      expect(ProtoP.getRecords()).to.equal(null);
      expect(ProtoP.gettotalCredit()).to.equal(0.00);
      expect(ProtoP.gettotalDebit()).to.equal(0.00);
      expect(ProtoP.getautopayStarts()).to.equal(0);
      expect(ProtoP.getautopayEnds()).to.equal(0);
      expect(ProtoP.getfsCurLoc()).to.equal(0);
      ProtoP = null;
      
    });
  });

  describe("ProtoParse Load Binary File", () => {
    it("Throws and error if the file path is not specified", () => {
        ProtoP = new protoP();
        return expect( ProtoP.loadFile())
          .to.eventually.be.rejectedWith('LOAD FILE ERROR: Error: File Path not Specified');
        
    });
    it("Throws and error if the file is empty", () => {
      ProtoP = new protoP(process.env.EMPTYFILE);
      return expect( ProtoP.loadFile())
        .to.eventually.be.rejectedWith('LOAD FILE ERROR: Error: File is empty')
    });

    it("Reads the binary file into a buffer", async () => {
      ProtoP = new protoP(process.env.DATAFILE);
      await ProtoP.loadFile();
      return expect(ProtoP.protoData.rawData.length).to.be.greaterThan(0);
    });

  });

  describe("ProtoParse Parse Header", () => {
    it("Checks the Header is not empty", async () => {
        ProtoP = new protoP(process.env.NOHEADER);
        await ProtoP.loadFile()
        
        return expect(ProtoP.parseHeader() )
          .to.eventually.be.rejectedWith('PARSE HEADER ERROR: Error: File is empty');
        
    });

    it("Sets the header Values - Magic, Version, Number of Records", async () => {
      ProtoP = new protoP(process.env.DATAFILE);
      await ProtoP.loadFile();
      let header = await ProtoP.parseHeader();
      expect(ProtoP.getMagic()).to.equal('MPS7');
      expect(ProtoP.getVersion()).to.equal(1);
      expect(ProtoP.getRecords()).to.equal(71);
      expect(header).to.be.true;
    });
  });

  describe("ProtoParse Parse Data", () => {
    it("Parses Binary file and returns true", async () => {
        ProtoP = new protoP(process.env.DATAFILE);
        await ProtoP.loadFile();
        await ProtoP.parseHeader();
        return expect(ProtoP.parseHeader() )
          .to.eventually.be.true;
        
    });
    it("Parses Binary file Totals Debits, Credits, Autopay Start and Stops", async () => {
      ProtoP = new protoP(process.env.DATAFILE);
      await ProtoP.loadFile();
      await ProtoP.parseHeader();
      await ProtoP.parseData();
      expect(ProtoP.gettotalCredit()).to.equal(9366.019984181883);
      expect(ProtoP.gettotalDebit()).to.equal(18203.69953340208);
      expect(ProtoP.getautopayEnds()).to.equal(8);
      expect(ProtoP.getautopayStarts()).to.equal(10);
    });
  });
});
