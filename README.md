# SLCSP

## Calculate the second lowest cost silver plan

Solution:
1) Creates an instance of the slcspParser Class by calling "new slcspP(plansFP, zipsFP,slcspFP);"
   a) The class creates an object called "slcspData" which holds the current "State" of the application and holds the following information:
      (1) plansArr - An array of the available healthplans
      (2) zipsArr - An arrary of zip codes and their RateArea
      (3) slcspArr - An array of zip codes and SLCSP's for the zip code
      (4) filteredPlans - Plans list after being filtered
      (5) filterZips - Zips list after being filtered
      (6) plansFP - file path to the plans file
      (7) zipsFP - file path to the zips file
      (8) slcspFP - file path to the slcsp file
2) Loads the 3 CSV files into their respective arrays in the object by calling "loadSLCPCSV()"
3) Processes the slcsp array to look up the SLCSP plans and output the slcsp CSV list with the plans Rate
   a) It first finds the RateArea by filtering the zipsArr array
   b) It then finds the rate by filtering plansArr by the plan metal_level and rateArea
   c) outputs the CSV zipcode, rate

I have written the assignment using Javascript and Node.  To run the code follow the below steps:
1) Install Node - Goto https://nodejs.org/en/download/ and download the appropriate version
2) Unzip the source code into an empty directory
3) Open a terminal
4) Change Directory in to the source code directory
5) enter 'npm install' (This will install the necessary dependencies)
6) To run the code enter 'node slcsp.js'
7) To run the test cases enter 'npm test'

Configuration Note:
1) In the file '.env' specify the locations of the 'plans.csv','slcsp.csv', and 'zips.csv' files.  Right now they are located in the project root.
