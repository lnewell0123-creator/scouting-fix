// Page 5 (Post-Match Scouting) - Firebase Sync Extension
// This adds the ability to send match data to the server/Firebase with password protection

(function() {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function setupPostMatchButtons() {
    const formControls = document.querySelector('.form-controls');
    if (!formControls) {
      console.error('form-controls not found (post-match controls).');
      return;
    }

    if ($('#firebase-sync-btn')) return; // avoid duplicates

    const syncBtn = document.createElement('button');
    syncBtn.type = 'button';
    syncBtn.id = 'firebase-sync-btn';
    syncBtn.textContent = 'Send to Master Database';
    syncBtn.style.cssText = 'background-color: #0066cc; color: white; cursor: pointer; margin-left: 10px; padding: 8px 16px; border: none; border-radius: 4px;';
    formControls.appendChild(syncBtn);

    syncBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await syncPostMatchFormToFirebase();
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

    // Get all column names from the header
    const tableHead = document.getElementById('table-head');
    const headers = tableHead ? Array.from(tableHead.querySelectorAll('th')).map(th => th.textContent.trim()) : [];

    rows.forEach((row, idx) => {
      const inputs = row.querySelectorAll('input');
      const rowData = {};
      let hasData = false;

      // Initialize all fields to empty
      headers.forEach(header => {
        rowData[header] = '';
      });

      inputs.forEach(input => {
        const name = input.getAttribute('name') || '';
        const value = input.value.trim();
        const fieldName = name.split('-')[0];
        if (fieldName) {
          rowData[fieldName] = value;
          if (value) hasData = true;
        }
      });

      if (hasData && rowData.teamNumber) {
        submissions.push({
          ...rowData,
          rowIndex: idx,
          type: 'matchScouting',
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
        await serverSync.saveSubmission('matchScouting', submission);
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

  init();
})();
