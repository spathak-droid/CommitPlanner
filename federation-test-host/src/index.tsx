import React, { Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Lazy load the remote module
const RemoteApp = React.lazy(() => import('weeklyCommitRemote/WeeklyCommitApp'));

function Host() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if remote entry is accessible
    fetch('http://localhost:3001/remoteEntry.js')
      .then((res) => {
        if (res.ok) {
          setLoaded(true);
          document.getElementById('status')!.innerHTML =
            '<div class="status ok">Remote loaded from localhost:3001</div>';
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      })
      .catch((err) => {
        setError(err.message);
        document.getElementById('status')!.innerHTML =
          `<div class="status err">Failed to load remote: ${err.message}. Is the frontend running on port 3001?</div>`;
      });
  }, []);

  if (error) return <p>Start the remote: <code>cd frontend && npm run dev</code></p>;

  return (
    <Suspense fallback={<p>Loading remote module...</p>}>
      <RemoteApp />
    </Suspense>
  );
}

const root = createRoot(document.getElementById('remote-container')!);
root.render(<Host />);
