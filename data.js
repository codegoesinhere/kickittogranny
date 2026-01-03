/* ===========================
   PASTE YOUR DATA HERE
   ===========================

   1) Victoria elections. Use the official election date, and the winner label you prefer.
      The code will assume the winner forms government from that date onward until the
      next election date. (That is usually correct for VIC; mid-term changes still resolve
      to the party label.)

   DATE FORMAT: 'YYYY-MM-DD'

   party: use anything with "Labor" for Labor red; everything else maps to Coalition blue by default.
   You can customize colors in app.js if you want finer control.

*/
const electionsVIC = [
  { date: '1982-04-03', party: 'Labor' },                   // Cain  |  Lions
  { date: '1985-10-05', party: 'Labor' },                   // Cain  |  Lions
  { date: '1988-10-01', party: 'Labor' },                   // Cain/Kirner  |  Lions/Essendon
  { date: '1992-10-03', party: 'Liberal-National Coalition' }, // Kennett  |  Hawks
  { date: '1996-03-30', party: 'Liberal-National Coalition' }, // Kennett  |  Hawks
  { date: '1999-09-18', party: 'Labor' },                   // Bracks  |  Cats
  { date: '2002-11-30', party: 'Labor' },                   // Bracks  |  Cats
  { date: '2006-11-25', party: 'Labor' },                   // Bracks/Brumby   |  Cats/...
  { date: '2010-11-27', party: 'Liberal-National Coalition' }, // Baillieu/Napthine  |  Cats/Cats
  { date: '2014-11-29', party: 'Labor' },                   // Andrews  |  Essendon
  { date: '2018-11-24', party: 'Labor' },                   // Andrews  |  Essendon
  { date: '2022-11-26', party: 'Labor' },                   // Andrews/Allan  |  Essendon/...
];

// Premier windows (used for party plot bands & Premier details)
const vicPremiers = [
  { start:'1982-04-08', end:'1990-08-10', surname:'Cain',     party:'Labor',    supports:'Fitzroy' },
  { start:'1990-08-10', end:'1992-10-06', surname:'Kirner',   party:'Labor',    supports:'Essendon' },
  { start:'1992-10-06', end:'1999-10-20', surname:'Kennett',  party:'Coalition',supports:'Hawthorn' },
  { start:'1999-10-20', end:'2007-07-30', surname:'Bracks',   party:'Labor',    supports:'Geelong' },
  { start:'2007-07-30', end:'2010-12-02', surname:'Brumby',   party:'Labor',    supports:'Collingwood' },
  { start:'2010-12-02', end:'2013-03-06', surname:'Baillieu', party:'Coalition',supports:'Geelong' },
  { start:'2013-03-06', end:'2014-12-04', surname:'Napthine', party:'Coalition',supports:'Geelong' },
  { start:'2014-12-04', end:'2023-09-27', surname:'Andrews',  party:'Labor',    supports:'Essendon' },
  { start:'2023-09-27', end:'2100-01-01', surname:'Allan',    party:'Labor',    supports:'' } // unknown
];



/* 2) AFL Grand Finals dataset (1982 → current). */
const grandFinals = [
  { year: 1982, date: "1982-09-25", location: "MCG", winner: "Carlton", loser: "Richmond", wState: "VIC", lState: "VIC", wGoals: 14, wBehinds: 19, wScore: 103, lGoals: 12, lBehinds: 13, lScore: 85, wLDiff: 18 },
  { year: 1983, date: "1983-09-24", location: "MCG", winner: "Hawthorn", loser: "Essendon", wState: "VIC", lState: "VIC", wGoals: 20, wBehinds: 20, wScore: 140, lGoals: 8, lBehinds: 9, lScore: 57, wLDiff: 83 },
  { year: 1984, date: "1984-09-29", location: "MCG", winner: "Essendon", loser: "Hawthorn", wState: "VIC", lState: "VIC", wGoals: 14, wBehinds: 21, wScore: 105, lGoals: 12, lBehinds: 9, lScore: 81, wLDiff: 24 },
  { year: 1985, date: "1985-09-28", location: "MCG", winner: "Essendon", loser: "Hawthorn", wState: "VIC", lState: "VIC", wGoals: 26, wBehinds: 14, wScore: 170, lGoals: 14, lBehinds: 8, lScore: 92, wLDiff: 78 },
  { year: 1986, date: "1986-09-27", location: "MCG", winner: "Hawthorn", loser: "Carlton", wState: "VIC", lState: "VIC", wGoals: 16, wBehinds: 14, wScore: 110, lGoals: 9, lBehinds: 14, lScore: 68, wLDiff: 42 },
  { year: 1987, date: "1987-09-26", location: "MCG", winner: "Carlton", loser: "Hawthorn", wState: "VIC", lState: "VIC", wGoals: 15, wBehinds: 14, wScore: 104, lGoals: 9, lBehinds: 17, lScore: 71, wLDiff: 33 },
  { year: 1988, date: "1988-09-24", location: "MCG", winner: "Hawthorn", loser: "Melbourne", wState: "VIC", lState: "VIC", wGoals: 22, wBehinds: 20, wScore: 152, lGoals: 6, lBehinds: 20, lScore: 56, wLDiff: 96 },
  { year: 1989, date: "1989-09-30", location: "MCG", winner: "Hawthorn", loser: "Geelong", wState: "VIC", lState: "VIC", wGoals: 21, wBehinds: 18, wScore: 144, lGoals: 21, lBehinds: 12, lScore: 138, wLDiff: 6 },
  { year: 1990, date: "1990-10-06", location: "MCG", winner: "Collingwood", loser: "Essendon", wState: "VIC", lState: "VIC", wGoals: 13, wBehinds: 11, wScore: 89, lGoals: 5, lBehinds: 11, lScore: 41, wLDiff: 48 },
  { year: 1991, date: "1991-09-28", location: "VFL Park", winner: "Hawthorn", loser: "West Coast", wState: "VIC", lState: "WA", wGoals: 20, wBehinds: 19, wScore: 139, lGoals: 13, lBehinds: 8, lScore: 86, wLDiff: 53 },
  { year: 1992, date: "1992-09-26", location: "MCG", winner: "West Coast", loser: "Geelong", wState: "WA", lState: "VIC", wGoals: 16, wBehinds: 17, wScore: 113, lGoals: 12, lBehinds: 13, lScore: 85, wLDiff: 28 },
  { year: 1993, date: "1993-09-25", location: "MCG", winner: "Essendon", loser: "Carlton", wState: "VIC", lState: "VIC", wGoals: 20, wBehinds: 13, wScore: 133, lGoals: 13, lBehinds: 11, lScore: 89, wLDiff: 44 },
  { year: 1994, date: "1994-10-01", location: "MCG", winner: "West Coast", loser: "Geelong", wState: "WA", lState: "VIC", wGoals: 20, wBehinds: 23, wScore: 143, lGoals: 8, lBehinds: 15, lScore: 63, wLDiff: 80 },
  { year: 1995, date: "1995-09-30", location: "MCG", winner: "Carlton", loser: "Geelong", wState: "VIC", lState: "VIC", wGoals: 21, wBehinds: 15, wScore: 141, lGoals: 11, lBehinds: 14, lScore: 80, wLDiff: 61 },
  { year: 1996, date: "1996-09-28", location: "MCG", winner: "North Melbourne", loser: "Sydney", wState: "VIC", lState: "NSW", wGoals: 19, wBehinds: 17, wScore: 131, lGoals: 13, lBehinds: 10, lScore: 88, wLDiff: 43 },
  { year: 1997, date: "1997-09-27", location: "MCG", winner: "Adelaide", loser: "St Kilda", wState: "SA", lState: "VIC", wGoals: 19, wBehinds: 11, wScore: 125, lGoals: 13, lBehinds: 16, lScore: 94, wLDiff: 31 },
  { year: 1998, date: "1998-09-26", location: "MCG", winner: "Adelaide", loser: "North Melbourne", wState: "SA", lState: "VIC", wGoals: 15, wBehinds: 15, wScore: 105, lGoals: 8, lBehinds: 22, lScore: 70, wLDiff: 35 },
  { year: 1999, date: "1999-09-25", location: "MCG", winner: "North Melbourne", loser: "Carlton", wState: "VIC", lState: "VIC", wGoals: 19, wBehinds: 10, wScore: 124, lGoals: 12, lBehinds: 17, lScore: 89, wLDiff: 35 },
  { year: 2000, date: "2000-09-02", location: "MCG", winner: "Essendon", loser: "Melbourne", wState: "VIC", lState: "VIC", wGoals: 19, wBehinds: 21, wScore: 135, lGoals: 11, lBehinds: 9, lScore: 75, wLDiff: 60 },
  { year: 2001, date: "2001-09-29", location: "MCG", winner: "Brisbane", loser: "Essendon", wState: "QLD", lState: "VIC", wGoals: 15, wBehinds: 18, wScore: 108, lGoals: 12, lBehinds: 10, lScore: 82, wLDiff: 26 },
  { year: 2002, date: "2002-09-28", location: "MCG", winner: "Brisbane", loser: "Collingwood", wState: "QLD", lState: "VIC", wGoals: 10, wBehinds: 15, wScore: 75, lGoals: 9, lBehinds: 12, lScore: 66, wLDiff: 9 },
  { year: 2003, date: "2003-09-27", location: "MCG", winner: "Brisbane", loser: "Collingwood", wState: "QLD", lState: "VIC", wGoals: 20, wBehinds: 14, wScore: 134, lGoals: 12, lBehinds: 12, lScore: 84, wLDiff: 50 },
  { year: 2004, date: "2004-09-25", location: "MCG", winner: "Port Adelaide", loser: "Brisbane", wState: "SA", lState: "QLD", wGoals: 17, wBehinds: 11, wScore: 113, lGoals: 10, lBehinds: 13, lScore: 73, wLDiff: 40 },
  { year: 2005, date: "2005-09-24", location: "MCG", winner: "Sydney", loser: "West Coast", wState: "NSW", lState: "WA", wGoals: 8, wBehinds: 10, wScore: 58, lGoals: 7, lBehinds: 12, lScore: 54, wLDiff: 4 },
  { year: 2006, date: "2006-09-30", location: "MCG", winner: "West Coast", loser: "Sydney", wState: "WA", lState: "NSW", wGoals: 12, wBehinds: 13, wScore: 85, lGoals: 12, lBehinds: 12, lScore: 84, wLDiff: 1 },
  { year: 2007, date: "2007-09-29", location: "MCG", winner: "Geelong", loser: "Port Adelaide", wState: "VIC", lState: "SA", wGoals: 24, wBehinds: 19, wScore: 163, lGoals: 6, lBehinds: 8, lScore: 44, wLDiff: 119 },
  { year: 2008, date: "2008-09-27", location: "MCG", winner: "Hawthorn", loser: "Geelong", wState: "VIC", lState: "VIC", wGoals: 18, wBehinds: 7, wScore: 115, lGoals: 11, lBehinds: 23, lScore: 89, wLDiff: 26 },
  { year: 2009, date: "2009-09-26", location: "MCG", winner: "Geelong", loser: "St Kilda", wState: "VIC", lState: "VIC", wGoals: 12, wBehinds: 8, wScore: 80, lGoals: 9, lBehinds: 14, lScore: 68, wLDiff: 12 },
  { year: 2010, date: "2010-09-25", location: "MCG", winner: "Collingwood", loser: "St Kilda", wState: "VIC", lState: "VIC", wGoals: 9, wBehinds: 14, wScore: 68, lGoals: 10, lBehinds: 8, lScore: 68, wLDiff: 0 },
  { year: 2010, date: "2010-10-02", location: "MCG", winner: "Collingwood", loser: "St Kilda", wState: "VIC", lState: "VIC", wGoals: 16, wBehinds: 12, wScore: 108, lGoals: 7, lBehinds: 10, lScore: 52, wLDiff: 56 },
  { year: 2011, date: "2011-10-01", location: "MCG", winner: "Geelong", loser: "Collingwood", wState: "VIC", lState: "VIC", wGoals: 18, wBehinds: 11, wScore: 119, lGoals: 12, lBehinds: 9, lScore: 81, wLDiff: 38 },
  { year: 2012, date: "2012-09-29", location: "MCG", winner: "Sydney", loser: "Hawthorn", wState: "NSW", lState: "VIC", wGoals: 14, wBehinds: 7, wScore: 91, lGoals: 11, lBehinds: 15, lScore: 81, wLDiff: 10 },
  { year: 2013, date: "2013-09-28", location: "MCG", winner: "Hawthorn", loser: "Fremantle", wState: "VIC", lState: "WA", wGoals: 11, wBehinds: 11, wScore: 77, lGoals: 8, lBehinds: 14, lScore: 62, wLDiff: 15 },
  { year: 2014, date: "2014-09-27", location: "MCG", winner: "Hawthorn", loser: "Sydney", wState: "VIC", lState: "NSW", wGoals: 21, wBehinds: 11, wScore: 137, lGoals: 11, lBehinds: 8, lScore: 74, wLDiff: 63 },
  { year: 2015, date: "2015-10-03", location: "MCG", winner: "Hawthorn", loser: "West Coast", wState: "VIC", lState: "WA", wGoals: 16, wBehinds: 11, wScore: 107, lGoals: 8, lBehinds: 13, lScore: 61, wLDiff: 46 },
  { year: 2016, date: "2016-10-01", location: "MCG", winner: "Western Bulldogs", loser: "Sydney", wState: "VIC", lState: "NSW", wGoals: 13, wBehinds: 11, wScore: 89, lGoals: 10, lBehinds: 7, lScore: 67, wLDiff: 22 },
  { year: 2017, date: "2017-09-30", location: "MCG", winner: "Richmond", loser: "Adelaide", wState: "VIC", lState: "SA", wGoals: 16, wBehinds: 12, wScore: 108, lGoals: 8, lBehinds: 12, lScore: 60, wLDiff: 48 },
  { year: 2018, date: "2018-09-29", location: "MCG", winner: "West Coast", loser: "Collingwood", wState: "WA", lState: "VIC", wGoals: 11, wBehinds: 13, wScore: 79, lGoals: 11, lBehinds: 8, lScore: 74, wLDiff: 5 },
  { year: 2019, date: "2019-09-28", location: "MCG", winner: "Richmond", loser: "Greater Western Sydney", wState: "VIC", lState: "NSW", wGoals: 17, wBehinds: 12, wScore: 114, lGoals: 3, lBehinds: 7, lScore: 25, wLDiff: 89 },
  { year: 2020, date: "2020-10-24", location: "Gabba", winner: "Richmond", loser: "Geelong", wState: "VIC", lState: "VIC", wGoals: 12, wBehinds: 9, wScore: 81, lGoals: 7, lBehinds: 8, lScore: 50, wLDiff: 31 },
  { year: 2021, date: "2021-09-25", location: "Optus Stadium", winner: "Melbourne", loser: "Western Bulldogs", wState: "VIC", lState: "VIC", wGoals: 21, wBehinds: 14, wScore: 140, lGoals: 10, lBehinds: 6, lScore: 66, wLDiff: 74 },
  { year: 2022, date: "2022-09-25", location: "MCG", winner: "Geelong", loser: "Sydney", wState: "VIC", lState: "NSW", wGoals: 20, wBehinds: 13, wScore: 133, lGoals: 8, lBehinds: 4, lScore: 52, wLDiff: 81 },
  { year: 2023, date: "2023-09-30", location: "MCG", winner: "Collingwood", loser: "Brisbane", wState: "VIC", lState: "QLD", wGoals: 12, wBehinds: 18, wScore: 90, lGoals: 13, lBehinds: 8, lScore: 86, wLDiff: 4 },
  { year: 2024, date: "2024-09-28", location: "MCG", winner: "Brisbane", loser: "Sydney", wState: "QLD", lState: "NSW", wGoals: 18, wBehinds: 12, wScore: 120, lGoals: 9, lBehinds: 6, lScore: 60, wLDiff: 60 },
  { year: 2025, date: "2025-09-27", location: "MCG", winner: "Brisbane", loser: "Geelong", wState: "QLD", lState: "VIC", wGoals: 18, wBehinds: 14, wScore: 122, lGoals: 11, lBehinds: 9, lScore: 75, wLDiff: 47 }
];

/*  3) Census data for religions across the 82 to current window */
const absRelStats = [
  {
    censusYear: 1986,
    // VIC data unavailable in 1986 — omit `vic`
    aus: {
        "Catholic": 4064000,
        "Anglican": 3272340,
        "Uniting Church": 1182300,
        "Presbyterian and Reformed": 560000,
        "Orthodox": 427400,
        "Christian n.e.i.": 346400,
        "Lutheran": 208300,
        "Other Protestant n.e.i.": 199400,
        "Baptist": 196800,
        "Muslim": 109500,
        "No religion": 1977500,
        "Not stated": 1863600,
        "AFL": 89085 
    }
  },
  {
    censusYear: 1991,
    vic: {
        "Catholic": 1237399,
        "Anglican": 772632,
        "Uniting Church": 342493,
        "Presbyterian": 193300,
        "Orthodox, Greek": 156056,
        "Baptist": 60484,
        "Islam": 49617,
        "Christian, Other": 44391,
        "Orthodox, Other": 43007,
        "Buddhist": 42350,
        "No religion": 612074,
        "Not stated": 474921,
        "AFL": 108756 
    },
    aus: {
        "Catholic": 4606651,
        "Anglican": 4018779,
        "Uniting Church": 1387710,
        "Presbyterian": 732039,
        "Greek Orthodox": 357522,
        "Baptist": 279828,
        "Lutheran": 250890,
        "Christian, Other": 199193,
        "Pentecostal": 150599,
        "Islam": 147487,
        "No religion": 2176590,
        "Not stated": 1712304,
        "AFL": 160082
    }
  },
  {
    censusYear: 1996,
    vic: {
        "Catholic": 1262077,
        "Anglican": 716356,
        "Uniting Church": 319901,       
        "Orthodox": 205359,
        "Presbyterian and Reformed": 168718,
        "Islam": 67047,
        "Buddhism": 62784,
        "Baptist": 62155,
        "Lutheran": 42529,
        "Christian, nfd": 39466,
        "No religion": 815014,
        "Not stated": 386673,           
        "AFL": 170917
    },
    aus: {
        "Catholic": 4798950,
        "Anglican": 3903324,
        "Uniting Church": 1334917,
        "Presbyterian and Reformed": 675534,
        "Orthodox": 497015,
        "Baptist": 295178,
        "Lutheran": 249989,
        "Islam": 200885,
        "Buddhism": 199812,
        "No religion": 2948888,
        "Not stated": 1550585,      
        "AFL": 279277
    }
  },
  {
    censusYear: 2001,
    vic: {
        "Catholic": 1310390,
        "Anglican": 705110,
        "Uniting Church": 296773,
        "Orthodox": 217764,
        "Presbyterian and Reformed": 155013,
        "Buddhism": 111498,
        "Islam": 92742,
        "Baptist": 66421,
        "Other Christian": 58619,
        "Lutheran": 41531,
        "No religion": 798393,
        "Not stated": 457286,          
        "AFL": 263150
    },
    aus: {
        "Catholic": 5001624,
        "Anglican": 3881162,
        "Uniting Church": 1248674,
        "Presbyterian and Reformed": 637530,
        "Orthodox": 529444,
        "Buddhism": 357813,
        "Baptist": 309205,
        "Other Christian": 285926,
        "Islam": 281578,
        "Lutheran": 250356,
        "No religion": 2905993,
        "Not stated": 1835598,           
        "AFL": 447359
    }
  },
  {
    censusYear: 2006,
    vic: {
        "Catholic": 1355905,
        "Anglican": 671772,
        "Uniting Church": 274056,
        "Eastern Orthodox": 224037,
        "Presbyterian and Reformed": 143144,
        "Buddhism": 132634,
        "Islam": 109370,
        "Baptist": 69117,
        "Christian, nfd": 68847,
        "Lutheran": 42420,
        "No religion": 1007416,
        "Not stated": 550313,           
        "AFL": 296695
    },
    aus: {
        "Catholic": 5126884,
        "Anglican": 3718241,
        "Uniting Church": 1135417,
        "Presbyterian and Reformed": 596672,
        "Eastern Orthodox": 544165,
        "Buddhism": 418749,
        "Islam": 340394,
        "Baptist": 316744,
        "Christian, nfd": 313192,
        "Lutheran": 251107,
        "No religion": 3706550,
        "Not stated": 2223957,           
        "AFL": 519126
    }
  },
  {
    censusYear: 2011,
    vic: {
        "Catholic": 1428759,
        "Anglican": 656706,
        "Uniting Church": 250939,
        "Eastern Orthodox": 231133,
        "Buddhism": 168637,
        "Islam": 152775,
        "Presbyterian and Reformed": 142216,
        "Christian, nfd": 100221,
        "Hinduism": 83137,
        "Baptist": 77857,

        "No religion": 1283881,
        "Not stated": 446369,           
        "AFL": 450418
    },
    aus: {
        "Catholic": 5439268,
        "Anglican": 3679907,
        "Uniting Church": 1065796,
        "Presbyterian and Reformed": 599516,
        "Eastern Orthodox": 563074,
        "Buddhism": 528977,
        "Islam": 476291,
        "Christian, nfd": 470942,
        "Baptist": 352499,
        "Hinduism": 275534,
        "No religion": 4796785,
        "Not stated": 1839649,           
        "AFL": 699864
    },
  },
  {
    censusYear: 2016,
    vic: {
        "Catholic": 1377134,
        "Anglican": 530710,
        "Eastern Orthodox": 204587,
        "Uniting Church": 197572,
        "Islam": 197030,
        "Buddhism": 181938,
        "Christian, nfd": 146441,
        "Hinduism": 134939,
        "Presbyterian and Reformed": 117036,
        "Baptist": 77469,
        "No religion": 1876738,
        "Not stated": 555956,           
        "AFL": 542095
    },
    aus: {
        "Catholic": 5291834,
        "Anglican": 3101185,
        "Uniting Church": 870183,
        "Christianity, nfd": 612371,
        "Islam": 604240,
        "Buddhism": 563674,
        "Presbyterian and Reformed": 526689,
        "Eastern Orthodox": 502801,
        "Hinduism": 440300,
        "Baptist": 345142,
        "No religion": 6933708,
        "Not stated": 2238735,            
        "AFL": 875197
    }
  },
  {
    censusYear: 2021,
    vic: {
        "Catholic": 1335784,
        "Anglican": 425007,
        "Islam": 273028,
        "Eastern Orthodox": 216791,
        "Hinduism": 214058,
        "Buddhism": 204493,
        "Christianity, nfd": 165834,
        "Uniting": 156166,
        "Sikhism": 91745,
        "Presbyterian and Reformed": 88797,
        "No religion": 2523448,
        "Not stated": 438497,           
        "AFL": 699835
    },
    aus: {
        "Catholic": 5075907,
        "Anglican": 2496273,
        "Islam": 813392,
        "Christianity, nfd": 688440,
        "Hinduism": 684002,
        "Uniting Church": 673260,
        "Buddhism": 615823,
        "Eastern Orthodox": 535470,
        "Presbyterian and Reformed": 414882,
        "Baptist": 347334,
        "No religion": 9767448,
        "Not stated": 1848426,             
        "AFL": 1113441
    }
  }    

];
