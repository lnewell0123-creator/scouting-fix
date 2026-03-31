// Google Apps Script for receiving scouting data and appending to Google Sheet
// Deploy this as a web app with "Execute as: Me" and "Who has access: Anyone"

function doPost(e) {
  try {
    var submissions = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSheet();

    // Ensure headers exist (run setupHeaders() once manually)
    // setupHeaders();

    submissions.forEach(function(sub) {
      sheet.appendRow([
        sub.teamNumber || '',
        sub.match || '',
        sub.hung || '',
        sub.shotballs || '',
        sub.collected || '',
        sub.timesshot || '',
        sub.dsc || '',
        sub.fullshooting || '',
        sub.accuracy || '',
        sub.ratedriving || '',
        sub.defense || '',
        sub.shuttle || '',
        sub.collectballs || '',
        sub.endgame || '',
        sub.sentAt || ''
      ]);
    });

    return ContentService
      .createTextOutput('Success')
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService
      .createTextOutput('Error: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// Run this function once to set up headers
function setupHeaders() {
  var sheet = SpreadsheetApp.getActiveSheet();
  sheet.clear();
  sheet.appendRow([
    'Team Number',
    'Match#',
    'Hung',
    'Shot Balls',
    'Collected balls from The Middle',
    '# times shot',
    'D S C',
    'Full when shooting?',
    'Accuracy',
    'Rate Driving',
    'Defense',
    'Shuttle',
    'Collect Balls',
    'endgame level',
    'Sent At'
  ]);
}