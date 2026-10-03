const {
    generateDailyReport,
    printDailyReport
} = require("./dailyReport");


const today = new Date()
    .toISOString()
    .split("T")[0];


const report = generateDailyReport(today);


printDailyReport(report);