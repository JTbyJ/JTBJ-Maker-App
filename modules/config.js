/**
 * Just Jane Maker Lab - Master App Configuration
 * Path: modules/config.js
 */

window.MAKER_CONFIG = {
  // REPLACE THIS WITH YOUR NEW DEPLOYMENT URL FROM STEP 2
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxUwtz-AkaMkaE8uXjIc5q5vyUuM8DpnGUBJ65pDOxCiv3rLWvWCPAj_Hcp3znTwC43bw/exec',

  /**
   * Save a single row of data to a specific tab in your Google Sheet
   */
  async saveToDatabase(sheetName, rowArray) {
    if (!this.scriptUrl) {
      console.error('[Google Sheets] Web App URL missing');
      return;
    }

    try {
      console.log(`[Google Sheets] Sending row to '${sheetName}'...`);

      const payload = JSON.stringify({ sheet: sheetName, row: rowArray });
      const url = `${this.scriptUrl}?data=${encodeURIComponent(payload)}`;

      // GET requests bypass CORS POST preflight blocks completely in Google Apps Script!
      await fetch(url, { method: 'GET', mode: 'no-cors' });

      console.log(`[Google Sheets] Successfully pushed row to '${sheetName}'!`);
    } catch (err) {
      console.error(`[Google Sheets] Error saving to '${sheetName}':`, err);
    }
  },

  /**
   * Fetch data from a specific tab in your Google Sheet
   */
  async fetchFromDatabase(sheetName) {
    if (!this.scriptUrl) return null;

    try {
      const url = `${this.scriptUrl}?sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`[Google Sheets] Error fetching from '${sheetName}':`, err);
      return null;
    }
  }
};