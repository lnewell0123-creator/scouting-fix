// Page 5 (Post-Match Scouting) - Firebase Sync Extension
// This adds the ability to send match data to the server/Firebase with password protection

(function() {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function setupPostMatchButtons() {
    const formControlsTop = document.querySelector('.form-controls-top');
    if (!formControlsTop) {
      console.error('form-controls-top not found (post-match controls).');
      return;
    }

    if ($('#firebase-sync-btn')) return; // avoid duplicates

    const syncBtn = document.createElement('button');
    syncBtn.type = 'button';
    syncBtn.id = 'firebase-sync-btn';
    syncBtn.textContent = 'Send to Master Database';
    syncBtn.style.cssText = 'background-color: #0066cc; color: white; cursor: pointer; margin-left: 10px; padding: 8px 16px; border: none; border-radius: 4px;';
    formControlsTop.appendChild(syncBtn);

    syncBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await syncPostMatchFormToFirebase();
    });

    const setSheetsUrlBtn = document.createElement('button');
    setSheetsUrlBtn.type = 'button';
    setSheetsUrlBtn.id = 'set-sheets-url-btn';
    setSheetsUrlBtn.textContent = 'Set Google Sheets URL';
    setSheetsUrlBtn.style.cssText = 'background-color: #34a853; color: white; cursor: pointer; margin-left: 10px; padding: 8px 16px; border: none; border-radius: 4px;';
    formControlsTop.appendChild(setSheetsUrlBtn);

    setSheetsUrlBtn.addEventListener('click', () => {
      const url = prompt('Enter your Google Apps Script web app URL:');
      if (url) {
        localStorage.setItem('googleSheetsUrl', url);
        alert('Google Sheets URL set!');
      }
    });

    const sendSheetsBtn = document.createElement('button');
    sendSheetsBtn.type = 'button';
    sendSheetsBtn.id = 'send-sheets-btn';
    sendSheetsBtn.textContent = 'Send to Google Sheets';
    sendSheetsBtn.style.cssText = 'background-color: #34a853; color: white; cursor: pointer; margin-left: 10px; padding: 8px 16px; border: none; border-radius: 4px;';
    formControlsTop.appendChild(sendSheetsBtn);

    sendSheetsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await sendToGoogleSheets();
    });

    console.log('Post-match sync buttons set up');
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupPostMatchButtons);
    } else {
      setupPostMatchButtons();
    }
  }

  function getSubmissions() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return [];

    const rows = tableBody.querySelectorAll('tr');
    const submissions = [];

    rows.forEach((row, idx) => {
      const inputs = row.querySelectorAll('input');
      const rowData = {};
      let hasData = false;

      inputs.forEach(input => {
        const name = input.getAttribute('name') || '';
        const value = input.value.trim();
        if (value) {
          hasData = true;
          const fieldName = name.split('-')[0];
          if (fieldName) rowData[fieldName] = value;
        }
      });

      if (hasData && rowData.teamNumber) {
        submissions.push({
          ...rowData,
          rowIndex: idx,
          type: 'postMatch',
          sentAt: new Date().toISOString(),
          source: 'page5'
        });
      }
    });

    return submissions;
  }

  window.syncPostMatchFormToFirebase = async function() {
    try {
      if (!localStorage.getItem('scout-pass')) {
        alert('No password set. Please set a password first using "Set/Change Password".');
        return;
      }

      const verified = await (typeof verifyPassword === 'function' ? verifyPassword('Enter password to send data to Master Database') : false);
      if (!verified) {
        alert('Password verification failed');
        return;
      }

      const submissions = getSubmissions();
      if (!submissions.length) {
        alert('No match data to send. Please fill in at least Team Number and one field.');
        return;
      }

      if (typeof serverSync === 'undefined') {
        alert('Server sync not loaded');
        return;
      }

      const btn = $('#firebase-sync-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
      }

      for (const submission of submissions) {
        await serverSync.saveSubmission('postMatchScouting', submission);
      }

      if (btn) {
        btn.textContent = 'Sent! ✓';
        btn.style.backgroundColor = '#00aa00';
      }

      alert(`✓ Post-Match data sent to Master Database!\n\nRows sent: ${submissions.length}\n\nThe data will now be visible on the List page and Master Dashboard.`);

      setTimeout(() => {
        if (btn) {
          btn.textContent = 'Send to Master Database';
          btn.style.backgroundColor = '#0066cc';
          btn.disabled = false;
        }
      }, 3000);
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Sync failed: ${error.message}`);
      const btn = $('#firebase-sync-btn');
      if (btn) {
        btn.textContent = 'Send to Master Database';
        btn.disabled = false;
      }
    }
  };

  async function sendToGoogleSheets() {
    try {
      const sheetsUrl = localStorage.getItem('googleSheetsUrl');
      if (!sheetsUrl) {
        alert('Google Sheets URL not set. Please use "Set Google Sheets URL" first.');
        return;
      }

      const submissions = getSubmissions();
      if (!submissions.length) {
        alert('No match data to send. Please fill in at least Team Number and one field.');
        return;
      }

      const btn = $('#send-sheets-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
      }

      const response = await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissions)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      if (btn) {
        btn.textContent = 'Sent! ✓';
        btn.style.backgroundColor = '#00aa00';
      }

      alert(`✓ Data sent to Google Sheets!\n\nRows sent: ${submissions.length}`);

      setTimeout(() => {
        if (btn) {
          btn.textContent = 'Send to Google Sheets';
          btn.style.backgroundColor = '#34a853';
          btn.disabled = false;
        }
      }, 3000);
    } catch (error) {
      console.error('Sheets sync error:', error);
      alert(`Sheets sync failed: ${error.message}`);
      const btn = $('#send-sheets-btn');
      if (btn) {
        btn.textContent = 'Send to Google Sheets';
        btn.disabled = false;
      }
    }
  }

  init();
})();
