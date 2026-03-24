/* RUN THE SAS IMPORT PROGRAM BEFORE RUNNING THIS PROGRAM */

/* This file creates formats for the adoption file of AFCARS that contain the 
value labels for the variables in the dataset. Running this file is NOT 
necessary unless you want to use the SAS formats. */

/* The following line should contain the directory in which your SAS file 
is stored */
libname library 'C:\Users\nw384\Downloads\AFCARSFiles\AFCARS\2023' ;

/* The following line contains the name (without the extension) for your SAS 
dataset without the formats */
%LET noformat = FC23v1;

/* The following line contains the name (without the extension) for the SAS 
dataset that will be created that contains the formats */
%LET formats = FC23v1F;

proc format library = library ;
value State
     1 = "Alabama"
     2 = "Alaska"
     4 = "Arizona"
     5 = "Arkansas"
     6 = "California"
     8 = "Colorado"
     9 = "Connecticut"
     10 = "Delaware"
     11 = "District of Columbia"
     12 = "Florida"
     13 = "Georgia"
     15 = "Hawaii"
     16 = "Idaho"
     17 = "Illinois"
     18 = "Indiana"
     19 = "Iowa"
     20 = "Kansas"
     21 = "Kentucky"
     22 = "Louisiana"
     23 = "Maine"
     24 = "Maryland"
     25 = "Massachusetts"
     26 = "Michigan"
     27 = "Minnesota"
     28 = "Mississippi"
     29 = "Missouri"
     30 = "Montana"
     31 = "Nebraska"
     32 = "Nevada"
     33 = "New Hampshire"
     34 = "New Jersey"
     35 = "New Mexico"
     36 = "New York"
     37 = "North Carolina"
     38 = "North Dakota"
     39 = "Ohio"
     40 = "Oklahoma"
     41 = "Oregon"
     42 = "Pennsylvania"
     44 = "Rhode Island"
     45 = "South Carolina"
     46 = "South Dakota"
     47 = "Tennessee"
     48 = "Texas"
     49 = "Utah"
     50 = "Vermont"
     51 = "Virginia"
     53 = "Washington"
     54 = "West Virginia"
     55 = "Wisconsin"
     56 = "Wyoming"
     72 = "Puerto Rico";
value Sex
     1 = "Male"
     2 = "Female"
     9 = "Unknown or Missing";
value AmIAKN
     0 = "No"
     1 = "Yes";
value Asian
     0 = "No"
     1 = "Yes";
value BlkAfrAm
     0 = "No"
     1 = "Yes";
value HawaiiPI
     0 = "No"
     1 = "Yes";
value White
     0 = "No"
     1 = "Yes";
value UnToDetm
     0 = "No"
     1 = "Yes";
value HisOrgin
     0 = "Not applicable"
     1 = "Yes"
     2 = "No"
     3 = "Unable to determine";
value ClinDis
     1 = "Yes"
     2 = "No"
     3 = "Not yet determined";
value MR
     0 = "No"
     1 = "Yes";
value VisHear
     0 = "No"
     1 = "Yes";
value PhyDis
     0 = "No"
     1 = "Yes";
value EmotDist
     0 = "No"
     1 = "Yes";
value OtherMed
     0 = "No"
     1 = "Yes";
value EverAdpt
     0 = "Not applicable"
     1 = "Yes, child has been legally adopted"
     2 = "No, has never been legally adopted"
     3 = "Unable to determine";
value AgeAdopt
     0 = "Not applicable"
     1 = "Less than 2 years old"
     2 = "2-5 years old"
     3 = "6-12 years old"
     4 = "13 years or older"
     5 = "Unable to determine";
value ManRem
     1 = "Voluntary"
     2 = "Court ordered"
     3 = "Not yet determined";
value PhyAbuse
     0 = "No"
     1 = "Yes";
value SexAbuse
     0 = "No"
     1 = "Yes";
value Neglect
     0 = "No"
     1 = "Yes";
value AAParent
     0 = "No"
     1 = "Yes";
value DAParent
     0 = "No"
     1 = "Yes";
value AAChild
     0 = "No"
     1 = "Yes";
value DAChild
     0 = "No"
     1 = "Yes";
value ChilDis
     0 = "No"
     1 = "Yes";
value ChBehPrb
     0 = "No"
     1 = "Yes";
value PrtsDied
     0 = "No"
     1 = "Yes";
value PrtsJail
     0 = "No"
     1 = "Yes";
value NoCope
     0 = "No"
     1 = "Yes";
value Abandmnt
     0 = "No"
     1 = "Yes";
value Relinqsh
     0 = "No"
     1 = "Yes";
value Housing
     0 = "No"
     1 = "Yes";
value CurPlSet
     1 = "Pre-adoptive home"
     2 = "Foster home, relative"
     3 = "Foster home, non-relative"
     4 = "Group home"
     5 = "Institution"
     6 = "Supervised independent living"
     7 = "Runaway"
     8 = "Trial home visit"
     99 = "Missing";
value PlaceOut
     0 = "Not applicable"
     1 = "Yes"
     2 = "No"
     3 = "Unable to determine";
value CaseGoal
     1 = "Reunify with parent, principal caretaker"
     2 = "Live with other relative(s)"
     3 = "Adoption"
     4 = "Long-term foster care"
     5 = "Emancipation"
     6 = "Guardianship"
     7 = "Case plan goal not yet established"
     99 = "Missing";
value CtkFamSt
     0 = "Not applicable"
     1 = "Married couple"
     2 = "Unmarried couple"
     3 = "Single female"
     4 = "Single male"
     5 = "Unable to determine";
value FosFamSt
     0 = "Not applicable"
     1 = "Married couple"
     2 = "Unmarried couple"
     3 = "Single female"
     4 = "Single male"
     5 = "Unable to determine";
value RF1AMAKN
     0 = "No"
     1 = "Yes";
value RF1ASIAN
     0 = "No"
     1 = "Yes";
value RF1BLKAA
     0 = "No"
     1 = "Yes";
value RF1NHOPI
     0 = "No"
     1 = "Yes";
value RF1WHITE
     0 = "No"
     1 = "Yes";
value RF1UTOD
     0 = "No"
     1 = "Yes";
value HOFCCTKb
     0 = "Not applicable"
     1 = "Yes"
     2 = "No"
     3 = "Unable to determine";
value RF2AMAKN
     0 = "No"
     1 = "Yes";
value RF2Asian
     0 = "No"
     1 = "Yes";
value RF2BLKAA
     0 = "No"
     1 = "Yes";
value RF2NHOPI
     0 = "No"
     1 = "Yes";
value RF2WHITE
     0 = "No"
     1 = "Yes";
value RF2UTOD
     0 = "No"
     1 = "Yes";
value HOFCCTKc
     0 = "Not applicable"
     1 = "Yes"
     2 = "No"
     3 = "Unable to determine";
value DISREASN
     0 = "Not applicable"
     1 = "Reunified with parent, primary caretaker"
     2 = "Living with other relative(s)"
     3 = "Adoption"
     4 = "Emancipation"
     5 = "Guardianship"
     6 = "Transfer to another agency"
     7 = "Runaway"
     8 = "Death of child"
     99 = "Missing";
value IVEFC
     0 = "No"
     1 = "Yes";
value IVEAA
     0 = "No"
     1 = "Yes";
value IVAAFDC
     0 = "No"
     1 = "Yes";
value IVDCHSUP
     0 = "No"
     1 = "Yes";
value XIXMEDCD
     0 = "No"
     1 = "Yes";
value SSIOther
     0 = "No"
     1 = "Yes";
value NOA
     0 = "No"
     1 = "Yes";
value AgeAtStart
     99 = "DOB Missing";
value AgeAtLatRem
     99 = "DOB Missing";
value AgeAtEnd
     99 = "DOB Missing";
value InAtStart
     0 = "No"
     1 = "Yes";
value InAtEnd
     0 = "No"
     1 = "Yes";
value Entered
     0 = "No"
     1 = "Yes";
value Exited
     0 = "No"
     1 = "Yes";
value Served
     0 = "No"
     1 = "Yes";
value IsWaiting
     0 = "No"
     1 = "Yes";
value IsTPR
     0 = "No"
     1 = "Yes";
value AgedOut
     0 = "No"
     1 = "Yes";
value RaceEthn
     1 = "Non-Hispanic (NH), White"
     2 = "NH, Black"
     3 = "NH, Am Ind AK Native"
     4 = "NH, Asian"
     5 = "NH, Hawaiian / Other Pac Islander"
     6 = "NH, More than One Race"
     7 = "Hispanic (Any Race)"
     99 = "Race/Ethnicity Unknown";
value Race
     1 = "White"
     2 = "Black or African American"
     3 = "American Indian or Alaska Native"
     4 = "Asian"
     5 = "Hawaiian or Other Pacific Islander"
     6 = "More Than One Race"
     99 = "Race Unknown";
value RU
     1 = "Metro: > 1 million population"
     2 = "Metro: 250K to 1 million population"
     3 = "Metro: < 250K population"
     4 = "NonMetro: Urban > 20K pop; Adjacent"
     5 = "NonMetro: Urban >20K pop; Non-adjacent"
     6 = "NonMetro: Urban 2.5K to 20K; Adjacent"
     7 = "NonMetro; Urban 2.5 to 20K; Non-adjacent"
     8 = "Rural or < 2.5K population; Adjacent"
     9 = "Rural or < 2.5K population; Non-adjacent";
value FIPSCode
     00008 = "Fewer than 700 cases in the County"
     01073 = "Jefferson, AL"
     01097 = "Mobile, AL"
     02020 = "Anchorage, AK"
     04013 = "Maricopa, AZ"
     04015 = "Mohave, AZ"
     04019 = "Pima, AZ"
     04021 = "Pinal, AZ"
     04025 = "Yavapai, AZ"
     05119 = "Pulaski, AR"
     05131 = "Sebastian, AR"
     06001 = "Alameda, CA"
     06013 = "Contra Costa, CA"
     06019 = "Fresno, CA"
     06029 = "Kern, CA"
     06037 = "Los Angeles, CA"
     06047 = "Merced, CA"
     06059 = "Orange, CA"
     06065 = "Riverside, CA"
     06067 = "Sacramento, CA"
     06071 = "San Bernardino, CA"
     06073 = "San Diego, CA"
     06075 = "San Francisco, CA"
     06077 = "San Joaquin, CA"
     06085 = "Santa Clara, CA"
     06099 = "Stanislaus, CA"
     06107 = "Tulare, CA"
     06111 = "Ventura, CA"
     08005 = "Arapahoe, CO"
     08031 = "Denver, CO"
     08041 = "El Paso, CO"
     09001 = "Fairfield, CT"
     09003 = "Hartford, CT"
     09009 = "New Haven, CT"
     11001 = "District of Colu, DC"
     12009 = "Brevard, FL"
     12011 = "Broward, FL"
     12031 = "Duval, FL"
     12033 = "Escambia, FL"
     12057 = "Hillsborough, FL"
     12071 = "Lee, FL"
     12081 = "Manatee, FL"
     12083 = "Marion, FL"
     12086 = "Miami-Dade, FL"
     12095 = "Orange, FL"
     12099 = "Palm Beach, FL"
     12101 = "Pasco, FL"
     12103 = "Pinellas, FL"
     12105 = "Polk, FL"
     12117 = "Seminole, FL"
     12127 = "Volusia, FL"
     13089 = "De Kalb, GA"
     15001 = "Hawaii, HI"
     15003 = "Honolulu, HI"
     17031 = "Cook, IL"
     17081 = "Jefferson, IL"
     17097 = "Lake, IL"
     17115 = "Macon, IL"
     17143 = "Peoria, IL"
     17163 = "St. Clair, IL"
     17167 = "Sangamon, IL"
     17197 = "Will, IL"
     17199 = "Williamson, IL"
     17201 = "Winnebago, IL"
     18003 = "Allen, IN"
     18089 = "Lake, IN"
     18095 = "Madison, IN"
     18097 = "Marion, IN"
     18141 = "St. Joseph, IN"
     18163 = "Vanderburgh, IN"
     19153 = "Polk, IA"
     20091 = "Johnson, KS"
     20173 = "Sedgwick, KS"
     20177 = "Shawnee, KS"
     21111 = "Jefferson, KY"
     24005 = "Baltimore, MD"
     24510 = "Baltimore City, MD"
     25005 = "Bristol, MA"
     25009 = "Essex, MA"
     25013 = "Hampden, MA"
     25017 = "Middlesex, MA"
     25023 = "Plymouth, MA"
     25025 = "Suffolk, MA"
     25027 = "Worcester, MA"
     26081 = "Kent, MI"
     26163 = "Wayne, MI"
     27053 = "Hennepin, MN"
     27123 = "Ramsey, MN"
     27137 = "St. Louis, MN"
     29077 = "Greene, MO"
     29095 = "Jackson, MO"
     29099 = "Jefferson, MO"
     29189 = "St. Louis, MO"
     29510 = "St. Louis City, MO"
     30013 = "Cascade, MT"
     30111 = "Yellowstone, MT"
     31055 = "Douglas, NE"
     31109 = "Lancaster, NE"
     32003 = "Clark, NV"
     32031 = "Washoe, NV"
     34007 = "Camden, NJ"
     34013 = "Essex, NJ"
     35001 = "Bernalillo, NM"
     36029 = "Erie, NY"
     36055 = "Monroe, NY"
     36061 = "New York, NY"
     37051 = "Cumberland, NC"
     37119 = "Mecklenburg, NC"
     39035 = "Cuyahoga, OH"
     39049 = "Franklin, OH"
     39061 = "Hamilton, OH"
     39095 = "Lucas, OH"
     39113 = "Montgomery, OH"
     39151 = "Stark, OH"
     39153 = "Summit, OH"
     40109 = "Oklahoma, OK"
     40143 = "Tulsa, OK"
     41039 = "Lane, OR"
     41051 = "Multnomah, OR"
     42003 = "Allegheny, PA"
     42079 = "Luzerne, PA"
     42101 = "Philadelphia, PA"
     44001 = "Bristol, RI"
     44007 = "Providence, RI"
     45045 = "Greenville, SC"
     45079 = "Richland, SC"
     46099 = "Minnehaha, SD"
     47037 = "Davidson, TN"
     47093 = "Knox, TN"
     47157 = "Shelby, TN"
     48027 = "Bell, TX"
     48029 = "Bexar, TX"
     48113 = "Dallas, TX"
     48121 = "Denton, TX"
     48201 = "Harris, TX"
     48303 = "Lubbock, TX"
     48309 = "McLennan, TX"
     48355 = "Nueces, TX"
     48439 = "Tarrant, TX"
     48441 = "Taylor, TX"
     48453 = "Travis, TX"
     49035 = "Salt Lake, UT"
     49049 = "Utah, UT"
     53011 = "Clark, WA"
     53033 = "King, WA"
     53053 = "Pierce, WA"
     53061 = "Snohomish, WA"
     53063 = "Spokane, WA"
     54039 = "Kanawha, WV"
     55079 = "Milwaukee, WI"
	 17019 = "Champaign, IL"
	 17089 = "Kane, IL"
	 21067 = "Fayette, KY"
	 21117 = "Kenton, KY"
	 22033 = "East Baton Rouge, LA"
	 36005 = "Bronx, NY"
	 36047 = "Kings, NY"
	 36067 = "Onondaga, NY"
	 36081 = "Queens, NY"
	 36103 = "Suffolk, NY"
	 37081 = "Guilford, NC"
	 41047 = "Marion, OR"
	 46103 = "Pennington, SD"
	 9110  = "New London, CT"
	 9170  = "New Haven, CT"
	 9180  = "Southeastern Connecticut Planning Region, CT"
	 17999 = "Unknown County, Illinois"
	 ;


DATA library.&formats; 
   SET library.&noformat;
   FORMAT
   State State.                FIPSCode FIPSCode.          Sex Sex.                 
   AmIAKN AmIAKN.              Asian Asian.                BlkAfrAm BlkAfrAm.       
   HawaiiPI HawaiiPI.          White White.                UnToDetm UnToDetm.       
   HisOrgin HisOrgin.          ClinDis ClinDis.            MR MR.                   
   VisHear VisHear.            PhyDis PhyDis.              EmotDist EmotDist.           
   OtherMed OtherMed.          EverAdpt EverAdpt.          AgeAdopt AgeAdopt.       
   ManRem ManRem.              PhyAbuse PhyAbuse.          SexAbuse SexAbuse.       
   Neglect Neglect.            AAParent AAParent.          DAParent DAParent.       
   AAChild AAChild.            DAChild DAChild.            ChilDis ChilDis.         
   ChBehPrb ChBehPrb.          PrtsDied PrtsDied.          PrtsJail PrtsJail.       
   NoCope NoCope.              Abandmnt Abandmnt.          Relinqsh Relinqsh.       
   Housing Housing.            CurPlSet CurPlSet.          PlaceOut PlaceOut.       
   CaseGoal CaseGoal.          CtkFamSt CtkFamSt.          FosFamSt FosFamSt.       
   RF1AMAKN RF1AMAKN.          RF1ASIAN RF1ASIAN.          RF1BLKAA RF1BLKAA.       
   RF1NHOPI RF1NHOPI.          RF1WHITE RF1WHITE.          RF1UTOD RF1UTOD.         
   HOFCCTK1 HOFCCTKb.          RF2AMAKN RF2AMAKN.          RF2Asian RF2Asian.       
   RF2BLKAA RF2BLKAA.          RF2NHOPI RF2NHOPI.          RF2WHITE RF2WHITE.       
   RF2UTOD RF2UTOD.            HOFCCTK2 HOFCCTKc.          DISREASN DISREASN.       
   IVEFC IVEFC.                IVEAA IVEAA.                IVAAFDC IVAAFDC.         
   IVDCHSUP IVDCHSUP.          XIXMEDCD XIXMEDCD.          SSIOther SSIOther.       
   NOA NOA.                    DOB mmddyy10.               Rem1Dt mmddyy10.         
   DLstFCDt mmddyy10.          LatRemDt mmddyy10.          CurSetDt mmddyy10.       
   DoDFCDt mmddyy10.           TPRMomDt mmddyy10.          TPRDadDt mmddyy10.       
   TPRDate mmddyy10.           PedRevDt mmddyy10.          RemTrnDt mmddyy10.       
   DoDTrnDt mmddyy10.          AgeAtStart AgeAtStart.      AgeAtLatRem AgeAtLatRem. 
   AgeAtEnd AgeAtEnd.          InAtStart InAtStart.        InAtEnd InAtEnd.         
   Entered Entered.            Exited Exited.              Served Served.           
   IsWaiting IsWaiting.        IsTPR IsTPR.                AgedOut AgedOut.         
   RaceEthn RaceEthn.          Race Race.                    
;

RUN;
