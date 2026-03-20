// Page 5 (Post-Match Scouting) - Firebase Sync Extension
// This adds the ability to send match data to the server/Firebase with password protection

(function() {
  // Wait for DOM and existing functions to be ready
  if (typeof hashString === 'undefined' || typeof verifyPassword === 'undefined') {
    console.warn('app.js not loaded yet');
    setTimeout(arguments.callee, 100);
    return;
  }

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Add Firebase sync button to form controls
  const formControlsTop = document.querySelector('.form-controls-top');
  if (formControlsTop) {
    const syncBtn = document.createElement('button');
    syncBtn.type = 'button';
    syncBtn.id = 'firebase-sync-btn';
    syncBtn.textContent = 'Send to Master Database';
    syncBtn.className = 'firebase-sync-btn';
    syncBtn.style.cssText = 'background-color: #0066cc; color: white; cursor: pointer; margin-left: 10px; padding: 8px 16px; border: none; border-radius: 4px;';
    
    formControlsTop.appendChild(syncBtn);

    syncBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await syncPostMatchFormToFirebase();
    });
  }

  // Function to sync post-match data to Firebase
  window.syncPostMatchFormToFirebase = async function() {
    try {
      // Check if password is set
      if (!localStorage.getItem('scout-pass')) {
        alert('No password set. Please set a password first using "Set/Change Password".');
        return;
      }

      // Verify password
      const verified = await verifyPassword('Enter password to send data to Master Database');
      if (!verified) {
        alert('Password verification failed');
        return;
      }

      // Get all table rows
      const tableBody = document.getElementById('table-body');
      if (!tableBody) {
        alert('No table found');
        return;
      }

      const rows = tableBody.querySelectorAll('tr');
      const submissions = [];

      // Extract all filled rows
      rows.forEach((row, idx) => {
        const inputs = row.querySelectorAll('input');
        const rowData = {};
        let hasData = false;

        inputs.forEach(input => {
          const name = input.getAttribute('name');
          const value = input.value.trim();
          if (value) {
            hasData = true;
            rowData[name] = value;
          }
        });

        // Only include rows with data
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

      if (!submissions.length) {
        alert('No match data to send. Please fill in at least Team Number and one field.');
        return;
      }

      // Send to server
      if (typeof serverSync === 'undefined') {
        alert('Server sync not loaded');
        return;
      }

      const btn = $('#firebase-sync-btn');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        // Send all submissions
        for (const submission of submissions) {
          await serverSync.saveSubmission('postMatchScouting', submission);
        }

        btn.textContent = 'Sent! ✓';
        btn.style.backgroundColor = '#00aa00';

        alert(`✓ Post-Match data sent to Master Database!\n\nRows sent: ${submissions.length}\n\nThe data will now be visible on the List page and Master Dashboard.`);

        setTimeout(() => {
          btn.textContent = 'Send to Master Database';
          btn.style.backgroundColor = '#0066cc';
          btn.disabled = false;
        }, 3000);

      } catch (error) {
        btn.textContent = 'Send to Master Database';
        btn.disabled = false;
        alert(`Error sending to server: ${error.message}\n\nMake sure the server is running.`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Sync failed: ${error.message}`);
    }
  };

  console.log('Page 5 Post-Match Firebase sync loaded');
})();
