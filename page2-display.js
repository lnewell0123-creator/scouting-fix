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

      // Group submissions by team number, only from page5
      const byTeam = {};
      Object.entries(allSubmissions).forEach(([key, submission]) => {
        if (submission.source === 'page5') {
          const teamNum = submission.teamNumber || 'Unknown';
          if (!byTeam[teamNum]) {
            byTeam[teamNum] = [];
          }
          byTeam[teamNum].push({
            id: key,
            ...submission
          });
        }
      });

      // Render grouped data
      let html = '';
      Object.keys(byTeam).sort((a, b) => parseInt(a) - parseInt(b)).forEach(teamNum => {
        const submissions = byTeam[teamNum];
        const matchSubmissions = submissions.filter(s => s.type === 'matchScouting').sort((a, b) => {
          const aTime = new Date(a.sentAt || a.timestamp || 0);
          const bTime = new Date(b.sentAt || b.timestamp || 0);
          if (aTime.getTime() !== bTime.getTime()) {
            return aTime - bTime; // Sort by date ascending
          }
          const aMatch = parseInt(a['match-0'] || a['match'] || 0);
          const bMatch = parseInt(b['match-0'] || b['match'] || 0);
          return aMatch - bMatch; // Then by match number ascending
        });

        html += `
          <details style="background-color: #f9f9f9; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 4px;">
            <summary style="cursor: pointer; font-weight: bold; color: #0066cc; margin-bottom: 10px;">Team ${teamNum}</summary>
            <div style="margin-top: 10px;">
              <button onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';" style="margin-right: 10px;">Pit Scouting</button>
              <button onclick="this.nextElementSibling.nextElementSibling.style.display = this.nextElementSibling.nextElementSibling.style.display === 'none' ? 'block' : 'none';">Match Scouting</button>
              <div style="display: none; margin-top: 10px;">
                <strong>Pit Scouting:</strong> No data available.
              </div>
              <div style="display: none; margin-top: 10px;">
                <strong>Match Scouting:</strong>
                ${renderMatchTable(matchSubmissions)}
              </div>
            </div>
          </details>
        `;
      });

      listDiv.innerHTML = html;
      updateLastSyncTime();

    } catch (error) {
      console.error('Error loading synced data:', error);
      $('#synced-list').innerHTML = `<p style="color: #cc0000;">Error loading data: ${error.message}</p>`;
    }
  }

  function renderMatchTable(matchSubmissions) {
    if (!matchSubmissions.length) return '';

    // Get all unique field names, excluding metadata
    const excludeFields = ['id', 'type', 'source', 'sentAt', 'timestamp', 'collection', 'rowIndex', 'clientTimestamp', 'uuid'];
    const allFields = new Set();
    matchSubmissions.forEach(m => {
      Object.keys(m).forEach(key => {
        if (!excludeFields.includes(key)) allFields.add(key);
      });
    });
    const fields = Array.from(allFields).sort();

    // Add Sent column
    fields.push('Sent');

    let html = `<table style="width: 100%; font-size: 0.85em; border-collapse: collapse; margin-top: 5px;">
      <thead>
        <tr style="background-color: #efefef;">
          ${fields.map(f => `<th style="border: 1px solid #ddd; padding: 4px;">${f}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${matchSubmissions.map(m => `
          <tr>
            ${fields.map(f => {
              if (f === 'Sent') {
                return `<td style="border: 1px solid #ddd; padding: 4px; font-size: 0.8em;">${formatTime(m.sentAt || m.timestamp)}</td>`;
              }
              return `<td style="border: 1px solid #ddd; padding: 4px;">${escapeHtml(m[f] || '')}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>`;

    return html;
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
