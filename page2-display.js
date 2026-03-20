// Page 2 (List) - Firebase Data Display Extension
// This fetches synced submissions from the server and displays them

(function() {
  if (typeof serverSync === 'undefined') {
    console.warn('serverSync not loaded yet');
    setTimeout(arguments.callee, 100);
    return;
  }

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Add a section to display synced data
  const main = document.querySelector('main');
  if (main) {
    const syncedSection = document.createElement('section');
    syncedSection.id = 'synced-submissions';
    syncedSection.innerHTML = `
      <h3>Master Database Submissions (Synced)</h3>
      <div style="margin-bottom: 15px;">
        <button id="refresh-synced-data" style="background-color: #0066cc; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
          Refresh Master Data
        </button>
        <span id="last-sync-time" style="margin-left: 15px; color: #666; font-size: 0.9em;"></span>
      </div>
      <div id="synced-list" style="max-height: 600px; overflow-y: auto;">
        <p style="color: #999;">Loading...</p>
      </div>
    `;
    main.appendChild(syncedSection);

    // Load data on page load
    loadSyncedData();

    // Add refresh button listener
    $('#refresh-synced-data').addEventListener('click', loadSyncedData);

    // Auto-refresh every 30 seconds
    setInterval(loadSyncedData, 30000);
  }

  async function loadSyncedData() {
    try {
      const listDiv = $('#synced-list');
      listDiv.innerHTML = '<p style="color: #999;">Loading...</p>';

      // Fetch all synced submissions from server
      const allSubmissions = await serverSync.getSubmissions();

      if (!allSubmissions || Object.keys(allSubmissions).length === 0) {
        listDiv.innerHTML = '<p style="color: #999;">No synced submissions yet.</p>';
        updateLastSyncTime();
        return;
      }

      // Group submissions by team number
      const byTeam = {};
      Object.entries(allSubmissions).forEach(([key, submission]) => {
        const teamNum = submission.teamNumber || 'Unknown';
        if (!byTeam[teamNum]) {
          byTeam[teamNum] = [];
        }
        byTeam[teamNum].push({
          id: key,
          ...submission
        });
      });

      // Render grouped data
      let html = '';
      Object.keys(byTeam).sort((a, b) => parseInt(a) - parseInt(b)).forEach(teamNum => {
        const submissions = byTeam[teamNum];
        const latestPit = submissions.find(s => s.type === 'pit' || s.source === 'page3');
        const matchSubmissions = submissions.filter(s => s.type === 'postMatch' || s.source === 'page5');

        html += `
          <div style="background-color: #f9f9f9; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 4px;">
            <h4 style="margin-top: 0; color: #0066cc;">Team ${teamNum}</h4>
            
            ${latestPit ? `
              <div style="margin-bottom: 10px;">
                <strong>Last Pit Scouting:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${formatSubmission(latestPit).map(line => `<li style="font-size: 0.9em;">${line}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${matchSubmissions.length > 0 ? `
              <div>
                <strong>Match Submissions (${matchSubmissions.length}):</strong>
                <table style="width: 100%; font-size: 0.85em; border-collapse: collapse; margin-top: 5px;">
                  <thead>
                    <tr style="background-color: #efefef;">
                      <th style="border: 1px solid #ddd; padding: 4px;">Match</th>
                      <th style="border: 1px solid #ddd; padding: 4px;">Key Data</th>
                      <th style="border: 1px solid #ddd; padding: 4px;">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${matchSubmissions.map(m => `
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 4px;">${m['match-0'] || m['match'] || 'N/A'}</td>
                        <td style="border: 1px solid #ddd; padding: 4px;">
                          ${m['shotballs-0'] ? `Shots: ${m['shotballs-0']}` : ''}
                          ${m['hung-0'] ? `Hung: ${m['hung-0']}` : ''}
                        </td>
                        <td style="border: 1px solid #ddd; padding: 4px; font-size: 0.8em;">
                          ${formatTime(m.sentAt || m.timestamp)}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <p style="margin: 8px 0 0 0; font-size: 0.85em; color: #999;">
              Synced: ${formatTime(latestPit?.sentAt || latestPit?.timestamp || matchSubmissions[0]?.sentAt)}
            </p>
          </div>
        `;
      });

      listDiv.innerHTML = html;
      updateLastSyncTime();

    } catch (error) {
      console.error('Error loading synced data:', error);
      $('#synced-list').innerHTML = `<p style="color: #cc0000;">Error loading data: ${error.message}</p>`;
    }
  }

  function formatSubmission(sub) {
    const lines = [];
    const excludeFields = ['id', 'type', 'source', 'sentAt', 'timestamp', 'collection', 'teamNumber'];
    
    Object.entries(sub).forEach(([key, value]) => {
      if (!excludeFields.includes(key) && value && value.trim && value.trim()) {
        const label = key
          .replace(/[a-z]([A-Z])/g, (m) => m[0] + ' ' + m[1])
          .replace(/^./, (m) => m.toUpperCase());
        lines.push(`${label}: ${escapeHtml(value)}`);
      }
    });
    
    return lines.slice(0, 5); // Show first 5 fields
  }

  function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'N/A';
    }
  }

  function updateLastSyncTime() {
    const timeSpan = $('#last-sync-time');
    if (timeSpan) {
      const now = new Date();
      timeSpan.textContent = `Last refreshed: ${now.toLocaleTimeString()}`;
    }
  }

  // Utility function
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  console.log('Page 2 synced data display loaded');
})();
