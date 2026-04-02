// Page 3 (Pit Scouting) - Local Master Sync Extension
// This adds the ability to send form submissions to the local Master Server with password protection

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
  const formControls = document.querySelector('.form-controls');
  if (formControls) {
    const syncBtn = document.createElement('button');
    syncBtn.type = 'button';
    syncBtn.id = 'local-sync-btn';
    syncBtn.textContent = 'Send to Master Database';
    syncBtn.className = 'local-sync-btn';
    syncBtn.style.cssText = 'background-color: #0066cc; color: white; cursor: pointer; margin-left: 10px;';
    
    const qrBtn = document.createElement('button');
    qrBtn.type = 'button';
    qrBtn.id = 'qr-sync-btn';
    qrBtn.textContent = 'Show Sync QR';
    qrBtn.style.cssText = 'background-color: #e67e22; color: white; cursor: pointer; margin-left: 10px;';

    formControls.appendChild(syncBtn);
    formControls.appendChild(qrBtn);

    syncBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await syncPitFormToServer();
    });

    qrBtn.addEventListener('click', () => {
      // Generate QR from all submissions
      const raw = localStorage.getItem('submissions');
      const matches = raw ? JSON.parse(raw) : [];
      if (matches.length === 0) return alert('No submissions to sync!');
      window.qrSync.showAllMatchQR('qr-container', 'submissions');
      document.getElementById('qr-modal').style.display = 'flex';
    });
  }

  // Function to sync the most recent submission to the Local Server
  window.syncPitFormToServer = async function() {
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

      // Get the most recent submission
      const raw = localStorage.getItem('submissions');
      const subs = raw ? JSON.parse(raw) : [];
      
      if (!subs.length) {
        alert('No submissions to send. Please submit a form first.');
        return;
      }

      // Get the last submission
      const lastSubmission = subs[subs.length - 1];

      // Send to server
      if (typeof serverSync === 'undefined') {
        alert('Server sync not loaded');
        return;
      }

      const btn = $('#local-sync-btn');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        await serverSync.saveSubmission('pitScouting', {
          ...lastSubmission,
          sentAt: new Date().toISOString(),
          source: 'page3'
        });

        btn.textContent = 'Sent! ✓';
        btn.style.backgroundColor = '#00aa00';

        alert(`✓ Pit Scouting data sent to Master Database!\n\nTeam: ${lastSubmission.teamNumber}\n\nThe data will now be visible on the List page and Master Dashboard.`);

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

  console.log('Page 3 Local Sync loaded');
})();
