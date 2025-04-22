import { tokens } from "../theme";

export const mockDataTeam = [
  {
    id: 1,
    name: "Jon Snow",
    email: "jonsnow@gmail.com",
    age: 35,
    phone: "(665)121-5454",
    access: "admin",
  },
  {
    id: 2,
    name: "Cersei Lannister",
    email: "cerseilannister@gmail.com",
    age: 42,
    phone: "(421)314-2288",
    access: "manager",
  },
  {
    id: 3,
    name: "Jaime Lannister",
    email: "jaimelannister@gmail.com",
    age: 45,
    phone: "(422)982-6739",
    access: "user",
  },
  {
    id: 4,
    name: "Anya Stark",
    email: "anyastark@gmail.com",
    age: 16,
    phone: "(921)425-6742",
    access: "admin",
  },
  {
    id: 5,
    name: "Daenerys Targaryen",
    email: "daenerystargaryen@gmail.com",
    age: 31,
    phone: "(421)445-1189",
    access: "user",
  },
  {
    id: 6,
    name: "Ever Melisandre",
    email: "evermelisandre@gmail.com",
    age: 150,
    phone: "(232)545-6483",
    access: "manager",
  },
  {
    id: 7,
    name: "Ferrara Clifford",
    email: "ferraraclifford@gmail.com",
    age: 44,
    phone: "(543)124-0123",
    access: "user",
  },
  {
    id: 8,
    name: "Rossini Frances",
    email: "rossinifrances@gmail.com",
    age: 36,
    phone: "(222)444-5555",
    access: "user",
  },
  {
    id: 9,
    name: "Harvey Roxie",
    email: "harveyroxie@gmail.com",
    age: 65,
    phone: "(444)555-6239",
    access: "admin",
  },
];

export const mockDataContacts = [
  {
    id: 1,
    name: "Jon Snow",
    email: "jonsnow@gmail.com",
    age: 35,
    type: "community",
    phone: "(665)121-5454",
    address: "0912 Won Street, Alabama, SY 10001",
    city: "New York",
    zipCode: "10001",
    registrarId: 123512,
  },
  {
    id: 2,
    name: "Cersei Lannister",
    email: "cerseilannister@gmail.com",
    age: 42,
    type: "responder_fire",
    phone: "(421)314-2288",
    address: "1234 Main Street, New York, NY 10001",
    city: "New York",
    zipCode: "13151",
    registrarId: 123512,
  },
  {
    id: 3,
    name: "Jaime Lannister",
    email: "jaimelannister@gmail.com",
    age: 45,
    type: "responder_police",
    phone: "(422)982-6739",
    address: "3333 Want Blvd, Estanza, NAY 42125",
    city: "New York",
    zipCode: "87281",
    registrarId: 4132513,
  },
  {
    id: 4,
    name: "Anya Stark",
    email: "anyastark@gmail.com",
    age: 16,
    type: "responder_fire",
    phone: "(921)425-6742",
    address: "1514 Main Street, New York, NY 22298",
    city: "New York",
    zipCode: "15551",
    registrarId: 123512,
  },
  {
    id: 5,
    name: "Daenerys Targaryen",
    email: "daenerystargaryen@gmail.com",
    age: 31,
    type: "responder_disaster",
    phone: "(421)445-1189",
    address: "11122 Welping Ave, Tenting, CD 21321",
    city: "Tenting",
    zipCode: "14215",
    registrarId: 123512,
  },
  {
    id: 6,
    name: "Ever Melisandre",
    email: "evermelisandre@gmail.com",
    age: 150,
    type: "community",
    phone: "(232)545-6483",
    address: "1234 Canvile Street, Esvazark, NY 10001",
    city: "Esvazark",
    zipCode: "10001",
    registrarId: 123512,
  },
  {
    id: 7,
    name: "Ferrara Clifford",
    email: "ferraraclifford@gmail.com",
    age: 44,
    type: "community",
    phone: "(543)124-0123",
    address: "22215 Super Street, Everting, ZO 515234",
    city: "Evertin",
    zipCode: "51523",
    registrarId: 123512,
  },
  {
    id: 8,
    name: "Rossini Frances",
    email: "rossinifrances@gmail.com",
    age: 36,
    type: "responder_disaster",
    phone: "(222)444-5555",
    address: "4123 Ever Blvd, Wentington, AD 142213",
    city: "Esteras",
    zipCode: "44215",
    registrarId: 512315,
  },
  {
    id: 9,
    name: "Harvey Roxie",
    email: "harveyroxie@gmail.com",
    age: 65,
    type: "community",
    phone: "(444)555-6239",
    address: "51234 Avery Street, Cantory, ND 212412",
    city: "Colunza",
    zipCode: "111234",
    registrarId: 928397,
  },
  {
    id: 10,
    name: "Enteri Redack",
    email: "enteriredack@gmail.com",
    age: 42,
    type: "responder_barangay",
    phone: "(222)444-5555",
    address: "4123 Easer Blvd, Wentington, AD 142213",
    city: "Esteras",
    zipCode: "44215",
    registrarId: 533215,
  },
  {
    id: 11,
    name: "Steve Goodman",
    email: "stevegoodmane@gmail.com",
    age: 11,
    type: "responder_police",
    phone: "(444)555-6239",
    address: "51234 Fiveton Street, CunFory, ND 212412",
    city: "Colunza",
    zipCode: "1234",
    registrarId: 92197,
  },
];

export const mockDataInvoices = [
  {
    id: 1,
    name: "Jon Snow",
    email: "jonsnow@gmail.com",
    cost: "21.24",
    phone: "(665)121-5454",
    date: "03/12/2022",
  },
  {
    id: 2,
    name: "Cersei Lannister",
    email: "cerseilannister@gmail.com",
    cost: "1.24",
    phone: "(421)314-2288",
    date: "06/15/2021",
  },
  {
    id: 3,
    name: "Jaime Lannister",
    email: "jaimelannister@gmail.com",
    cost: "11.24",
    phone: "(422)982-6739",
    date: "05/02/2022",
  },
  {
    id: 4,
    name: "Anya Stark",
    email: "anyastark@gmail.com",
    cost: "80.55",
    phone: "(921)425-6742",
    date: "03/21/2022",
  },
  {
    id: 5,
    name: "Daenerys Targaryen",
    email: "daenerystargaryen@gmail.com",
    cost: "1.24",
    phone: "(421)445-1189",
    date: "01/12/2021",
  },
  {
    id: 6,
    name: "Ever Melisandre",
    email: "evermelisandre@gmail.com",
    cost: "63.12",
    phone: "(232)545-6483",
    date: "11/02/2022",
  },
  {
    id: 7,
    name: "Ferrara Clifford",
    email: "ferraraclifford@gmail.com",
    cost: "52.42",
    phone: "(543)124-0123",
    date: "02/11/2022",
  },
  {
    id: 8,
    name: "Rossini Frances",
    email: "rossinifrances@gmail.com",
    cost: "21.24",
    phone: "(222)444-5555",
    date: "05/02/2021",
  },
];

export const mockTransactions = [
  {
    txId: "IND-20250115-000001-PB1",
    user: "Jose Rizal",
    date: "2025-01-15",
    cost: "5.25",
  },
  {
    txId: "IND-20250203-000002-BNC",
    user: "Andres Bonifacio",
    date: "2025-02-03",
    cost: "9.8",
  },
  {
    txId: "IND-20250128-000003-AGS",
    user: "Emilio Aguinaldo",
    date: "2025-01-28",
    cost: "7.45",
  },
  {
    txId: "IND-20250304-000004-KQT2",
    user: "Melchora Aquino",
    date: "2025-03-04",
    cost: "12.3",
  },
  {
    txId: "IND-20250217-000005-CLL",
    user: "Antonio Luna",
    date: "2025-02-17",
    cost: "6.75",
  },
  {
    txId: "IND-20250301-000006-MTL",
    user: "Apolinario Mabini",
    date: "2025-03-01",
    cost: "10.5",
  },
  {
    txId: "IND-20250109-000007-DNE1",
    user: "Gabriela Silang",
    date: "2025-01-09",
    cost: "8.25",
  },
  {
    txId: "IND-20250222-000008-TMB",
    user: "Gregorio del Pilar",
    date: "2025-02-22",
    cost: "4.3",
  },
];

export const mockBarData = [
  {
    country: "S1",
    fire: 120,
    fireColor: "hsl(0, 70%, 50%)",
    crime: 90,
    crimeColor: "hsl(200, 70%, 50%)",
    medical: 150,
    medicalColor: "hsl(120, 70%, 50%)",
  },
  {
    country: "S2",
    fire: 80,
    fireColor: "hsl(0, 70%, 50%)",
    crime: 50,
    crimeColor: "hsl(200, 70%, 50%)",
    medical: 130,
    medicalColor: "hsl(120, 70%, 50%)",
  },
  {
    country: "S3",
    fire: 95,
    fireColor: "hsl(0, 70%, 50%)",
    crime: 70,
    crimeColor: "hsl(200, 70%, 50%)",
    medical: 110,
    medicalColor: "hsl(120, 70%, 50%)",
  },
  {
    country: "S4",
    fire: 110,
    fireColor: "hsl(0, 70%, 50%)",
    crime: 85,
    crimeColor: "hsl(200, 70%, 50%)",
    medical: 140,
    medicalColor: "hsl(120, 70%, 50%)",
  },
  {
    country: "S5",
    fire: 130,
    fireColor: "hsl(0, 70%, 50%)",
    crime: 95,
    crimeColor: "hsl(200, 70%, 50%)",
    medical: 160,
    medicalColor: "hsl(120, 70%, 50%)",
  },
];

export const mockPieData = [
  {
    id: "hack",
    label: "hack",
    value: 239,
    color: "hsl(104, 70%, 50%)",
  },
  {
    id: "make",
    label: "make",
    value: 170,
    color: "hsl(162, 70%, 50%)",
  },
  {
    id: "go",
    label: "go",
    value: 322,
    color: "hsl(291, 70%, 50%)",
  },
  {
    id: "lisp",
    label: "lisp",
    value: 503,
    color: "hsl(229, 70%, 50%)",
  },
  {
    id: "scala",
    label: "scala",
    value: 584,
    color: "hsl(344, 70%, 50%)",
  },
];

export const mockLineData = [
  {
    id: "Fire",
    color: tokens("dark").redAccent[200],
    data: Array.from({ length: 12 }, (_, i) => ({
      x: `Day ${i + 1}`,
      y: (Math.random() * 5 + 3.0).toFixed(2),
    })),
  },
  {
    id: "Crime",
    color: tokens("dark").blueAccent[300],
    data: Array.from({ length: 12 }, (_, i) => ({
      x: `Day ${i + 1}`,
      y: (Math.random() * 5 + 3.0).toFixed(2),
    })),
  },
  {
    id: "Medical",
    color: tokens("dark").greenAccent[400],
    data: Array.from({ length: 12 }, (_, i) => ({
      x: `Day ${i + 1}`,
      y: (Math.random() * 5 + 3.0).toFixed(2),
    })),
  },
];

export const mockGeographyData = [
  {
    id: "AFG",
    value: 520600,
  },
  {
    id: "AGO",
    value: 949905,
  },
  {
    id: "ALB",
    value: 329910,
  },
  {
    id: "ARE",
    value: 675484,
  },
  {
    id: "ARG",
    value: 432239,
  },
  {
    id: "ARM",
    value: 288305,
  },
  {
    id: "ATA",
    value: 415648,
  },
  {
    id: "ATF",
    value: 665159,
  },
  {
    id: "AUT",
    value: 798526,
  },
  {
    id: "AZE",
    value: 481678,
  },
  {
    id: "BDI",
    value: 496457,
  },
  {
    id: "BEL",
    value: 252276,
  },
  {
    id: "BEN",
    value: 440315,
  },
  {
    id: "BFA",
    value: 343752,
  },
  {
    id: "BGD",
    value: 920203,
  },
  {
    id: "BGR",
    value: 261196,
  },
  {
    id: "BHS",
    value: 421551,
  },
  {
    id: "BIH",
    value: 974745,
  },
  {
    id: "BLR",
    value: 349288,
  },
  {
    id: "BLZ",
    value: 305983,
  },
  {
    id: "BOL",
    value: 430840,
  },
  {
    id: "BRN",
    value: 345666,
  },
  {
    id: "BTN",
    value: 649678,
  },
  {
    id: "BWA",
    value: 319392,
  },
  {
    id: "CAF",
    value: 722549,
  },
  {
    id: "CAN",
    value: 332843,
  },
  {
    id: "CHE",
    value: 122159,
  },
  {
    id: "CHL",
    value: 811736,
  },
  {
    id: "CHN",
    value: 593604,
  },
  {
    id: "CIV",
    value: 143219,
  },
  {
    id: "CMR",
    value: 630627,
  },
  {
    id: "COG",
    value: 498556,
  },
  {
    id: "COL",
    value: 660527,
  },
  {
    id: "CRI",
    value: 60262,
  },
  {
    id: "CUB",
    value: 177870,
  },
  {
    id: "-99",
    value: 463208,
  },
  {
    id: "CYP",
    value: 945909,
  },
  {
    id: "CZE",
    value: 500109,
  },
  {
    id: "DEU",
    value: 63345,
  },
  {
    id: "DJI",
    value: 634523,
  },
  {
    id: "DNK",
    value: 731068,
  },
  {
    id: "DOM",
    value: 262538,
  },
  {
    id: "DZA",
    value: 760695,
  },
  {
    id: "ECU",
    value: 301263,
  },
  {
    id: "EGY",
    value: 148475,
  },
  {
    id: "ERI",
    value: 939504,
  },
  {
    id: "ESP",
    value: 706050,
  },
  {
    id: "EST",
    value: 977015,
  },
  {
    id: "ETH",
    value: 461734,
  },
  {
    id: "FIN",
    value: 22800,
  },
  {
    id: "FJI",
    value: 18985,
  },
  {
    id: "FLK",
    value: 64986,
  },
  {
    id: "FRA",
    value: 447457,
  },
  {
    id: "GAB",
    value: 669675,
  },
  {
    id: "GBR",
    value: 757120,
  },
  {
    id: "GEO",
    value: 158702,
  },
  {
    id: "GHA",
    value: 893180,
  },
  {
    id: "GIN",
    value: 877288,
  },
  {
    id: "GMB",
    value: 724530,
  },
  {
    id: "GNB",
    value: 387753,
  },
  {
    id: "GNQ",
    value: 706118,
  },
  {
    id: "GRC",
    value: 377796,
  },
  {
    id: "GTM",
    value: 66890,
  },
  {
    id: "GUY",
    value: 719300,
  },
  {
    id: "HND",
    value: 739590,
  },
  {
    id: "HRV",
    value: 929467,
  },
  {
    id: "HTI",
    value: 538961,
  },
  {
    id: "HUN",
    value: 146095,
  },
  {
    id: "IDN",
    value: 490681,
  },
  {
    id: "IND",
    value: 549818,
  },
  {
    id: "IRL",
    value: 630163,
  },
  {
    id: "IRN",
    value: 596921,
  },
  {
    id: "IRQ",
    value: 767023,
  },
  {
    id: "ISL",
    value: 478682,
  },
  {
    id: "ISR",
    value: 963688,
  },
  {
    id: "ITA",
    value: 393089,
  },
  {
    id: "JAM",
    value: 83173,
  },
  {
    id: "JOR",
    value: 52005,
  },
  {
    id: "JPN",
    value: 199174,
  },
  {
    id: "KAZ",
    value: 181424,
  },
  {
    id: "KEN",
    value: 60946,
  },
  {
    id: "KGZ",
    value: 432478,
  },
  {
    id: "KHM",
    value: 254461,
  },
  {
    id: "OSA",
    value: 942447,
  },
  {
    id: "KWT",
    value: 414413,
  },
  {
    id: "LAO",
    value: 448339,
  },
  {
    id: "LBN",
    value: 620090,
  },
  {
    id: "LBR",
    value: 435950,
  },
  {
    id: "LBY",
    value: 75091,
  },
  {
    id: "LKA",
    value: 595124,
  },
  {
    id: "LSO",
    value: 483524,
  },
  {
    id: "LTU",
    value: 867357,
  },
  {
    id: "LUX",
    value: 689172,
  },
  {
    id: "LVA",
    value: 742980,
  },
  {
    id: "MAR",
    value: 236538,
  },
  {
    id: "MDA",
    value: 926836,
  },
  {
    id: "MDG",
    value: 840840,
  },
  {
    id: "MEX",
    value: 353910,
  },
  {
    id: "MKD",
    value: 505842,
  },
  {
    id: "MLI",
    value: 286082,
  },
  {
    id: "MMR",
    value: 915544,
  },
  {
    id: "MNE",
    value: 609500,
  },
  {
    id: "MNG",
    value: 410428,
  },
  {
    id: "MOZ",
    value: 32868,
  },
  {
    id: "MRT",
    value: 375671,
  },
  {
    id: "MWI",
    value: 591935,
  },
  {
    id: "MYS",
    value: 991644,
  },
  {
    id: "NAM",
    value: 701897,
  },
  {
    id: "NCL",
    value: 144098,
  },
  {
    id: "NER",
    value: 312944,
  },
  {
    id: "NGA",
    value: 862877,
  },
  {
    id: "NIC",
    value: 90831,
  },
  {
    id: "NLD",
    value: 281879,
  },
  {
    id: "NOR",
    value: 224537,
  },
  {
    id: "NPL",
    value: 322331,
  },
  {
    id: "NZL",
    value: 86615,
  },
  {
    id: "OMN",
    value: 707881,
  },
  {
    id: "PAK",
    value: 158577,
  },
  {
    id: "PAN",
    value: 738579,
  },
  {
    id: "PER",
    value: 248751,
  },
  {
    id: "PHL",
    value: 557292,
  },
  {
    id: "PNG",
    value: 516874,
  },
  {
    id: "POL",
    value: 682137,
  },
  {
    id: "PRI",
    value: 957399,
  },
  {
    id: "PRT",
    value: 846430,
  },
  {
    id: "PRY",
    value: 720555,
  },
  {
    id: "QAT",
    value: 478726,
  },
  {
    id: "ROU",
    value: 259318,
  },
  {
    id: "RUS",
    value: 268735,
  },
  {
    id: "RWA",
    value: 136781,
  },
  {
    id: "ESH",
    value: 151957,
  },
  {
    id: "SAU",
    value: 111821,
  },
  {
    id: "SDN",
    value: 927112,
  },
  {
    id: "SDS",
    value: 966473,
  },
  {
    id: "SEN",
    value: 158085,
  },
  {
    id: "SLB",
    value: 178389,
  },
  {
    id: "SLE",
    value: 528433,
  },
  {
    id: "SLV",
    value: 353467,
  },
  {
    id: "ABV",
    value: 251,
  },
  {
    id: "SOM",
    value: 445243,
  },
  {
    id: "SRB",
    value: 202402,
  },
  {
    id: "SUR",
    value: 972121,
  },
  {
    id: "SVK",
    value: 319923,
  },
  {
    id: "SVN",
    value: 728766,
  },
  {
    id: "SWZ",
    value: 379669,
  },
  {
    id: "SYR",
    value: 16221,
  },
  {
    id: "TCD",
    value: 101273,
  },
  {
    id: "TGO",
    value: 498411,
  },
  {
    id: "THA",
    value: 506906,
  },
  {
    id: "TJK",
    value: 613093,
  },
  {
    id: "TKM",
    value: 327016,
  },
  {
    id: "TLS",
    value: 607972,
  },
  {
    id: "TTO",
    value: 936365,
  },
  {
    id: "TUN",
    value: 898416,
  },
  {
    id: "TUR",
    value: 237783,
  },
  {
    id: "TWN",
    value: 878213,
  },
  {
    id: "TZA",
    value: 442174,
  },
  {
    id: "UGA",
    value: 720710,
  },
  {
    id: "UKR",
    value: 74172,
  },
  {
    id: "URY",
    value: 753177,
  },
  {
    id: "USA",
    value: 658725,
  },
  {
    id: "UZB",
    value: 550313,
  },
  {
    id: "VEN",
    value: 707492,
  },
  {
    id: "VNM",
    value: 538907,
  },
  {
    id: "VUT",
    value: 650646,
  },
  {
    id: "PSE",
    value: 476078,
  },
  {
    id: "YEM",
    value: 957751,
  },
  {
    id: "ZAF",
    value: 836949,
  },
  {
    id: "ZMB",
    value: 714503,
  },
  {
    id: "ZWE",
    value: 405217,
  },
  {
    id: "KOR",
    value: 171135,
  },
];

export const mockCrimeData = [
  // Central Indang
  { lat: 14.1883, lng: 120.8765, intensity: 0.8 },
  { lat: 14.1850, lng: 120.8800, intensity: 0.6 },
  { lat: 14.1901, lng: 120.8702, intensity: 0.7 },
  { lat: 14.1832, lng: 120.8753, intensity: 0.5 },
  { lat: 14.1865, lng: 120.8788, intensity: 1.0 },
  { lat: 14.1820, lng: 120.8725, intensity: 0.9 },
  { lat: 14.1877, lng: 120.8740, intensity: 0.7 },
  { lat: 14.1912, lng: 120.8771, intensity: 0.8 },
  { lat: 14.1844, lng: 120.8736, intensity: 0.6 },
  { lat: 14.1890, lng: 120.8792, intensity: 0.7 },
  { lat: 14.1889, lng: 120.8769, intensity: 0.7 },
  { lat: 14.1861, lng: 120.8783, intensity: 0.6 },
  { lat: 14.1895, lng: 120.8721, intensity: 0.8 },
  { lat: 14.1839, lng: 120.8761, intensity: 0.5 },
  { lat: 14.1856, lng: 120.8777, intensity: 0.9 },
  { lat: 14.1815, lng: 120.8719, intensity: 0.7 },
  { lat: 14.1903, lng: 120.8745, intensity: 0.6 },
  { lat: 14.1920, lng: 120.8784, intensity: 0.8 },
  { lat: 14.1851, lng: 120.8757, intensity: 1.0 },
  { lat: 14.1882, lng: 120.8728, intensity: 0.9 },
  { lat: 14.1868, lng: 120.8733, intensity: 0.7 },
  { lat: 14.1830, lng: 120.8747, intensity: 0.5 },
  { lat: 14.1898, lng: 120.8795, intensity: 0.6 },
  { lat: 14.1910, lng: 120.8705, intensity: 0.7 },
  { lat: 14.1847, lng: 120.8789, intensity: 0.9 },
  { lat: 14.1874, lng: 120.8712, intensity: 1.0 },
  { lat: 14.1829, lng: 120.8731, intensity: 0.8 },
  { lat: 14.1908, lng: 120.8770, intensity: 0.6 },
  { lat: 14.1853, lng: 120.8718, intensity: 0.7 },
  { lat: 14.1880, lng: 120.8755, intensity: 0.9 },

  // Near Municipal Borders
  { lat: 14.1950, lng: 120.8600, intensity: 0.6 },
  { lat: 14.1805, lng: 120.8650, intensity: 0.9 },
  { lat: 14.2001, lng: 120.8752, intensity: 0.5 },
  { lat: 14.1702, lng: 120.8803, intensity: 0.7 },
  { lat: 14.2055, lng: 120.8699, intensity: 0.8 },
  { lat: 14.1688, lng: 120.8744, intensity: 1.0 },
  { lat: 14.2022, lng: 120.8615, intensity: 0.6 },
  { lat: 14.1767, lng: 120.8729, intensity: 0.9 },
  { lat: 14.1989, lng: 120.8684, intensity: 0.7 },
  { lat: 14.1713, lng: 120.8776, intensity: 0.5 },

  // Outskirts - North
  { lat: 14.2101, lng: 120.8632, intensity: 0.6 },
  { lat: 14.2125, lng: 120.8759, intensity: 0.8 },
  { lat: 14.2189, lng: 120.8690, intensity: 1.0 },
  { lat: 14.2234, lng: 120.8804, intensity: 0.5 },
  { lat: 14.2156, lng: 120.8628, intensity: 0.9 },

  // Outskirts - South
  { lat: 14.1608, lng: 120.8901, intensity: 0.7 },
  { lat: 14.1552, lng: 120.8723, intensity: 0.6 },
  { lat: 14.1659, lng: 120.8647, intensity: 0.9 },
  { lat: 14.1721, lng: 120.8556, intensity: 1.0 },
  { lat: 14.1683, lng: 120.8489, intensity: 0.8 },

  // Outskirts - East
  { lat: 14.1872, lng: 120.9054, intensity: 0.6 },
  { lat: 14.1798, lng: 120.9110, intensity: 0.7 },
  { lat: 14.1965, lng: 120.9223, intensity: 0.5 },
  { lat: 14.2023, lng: 120.9176, intensity: 0.8 },
  { lat: 14.1857, lng: 120.9294, intensity: 1.0 },

  // Outskirts - West
  { lat: 14.2005, lng: 120.8456, intensity: 0.7 },
  { lat: 14.1902, lng: 120.8389, intensity: 0.9 },
  { lat: 14.1841, lng: 120.8273, intensity: 0.6 },
  { lat: 14.1969, lng: 120.8332, intensity: 1.0 },
  { lat: 14.2054, lng: 120.8295, intensity: 0.8 },

  // Additional Scattered Points
  { lat: 14.1800, lng: 120.8555, intensity: 0.5 },
  { lat: 14.1756, lng: 120.8933, intensity: 0.7 },
  { lat: 14.1988, lng: 120.9021, intensity: 0.6 },
  { lat: 14.2099, lng: 120.9124, intensity: 0.9 },
  { lat: 14.1956, lng: 120.9187, intensity: 0.8 },
  { lat: 14.1854, lng: 120.9020, intensity: 1.0 },
  { lat: 14.1708, lng: 120.8876, intensity: 0.7 },
];