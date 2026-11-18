'use client';

/**
 * v43: a real error screen instead of the raw "Application error" white
 * page. An unexpected client exception gets ONE automatic reload (session
 * guard) — that alone recovers stale-chunk boots after a deploy — plus a
 * manual reload button if the crash persists.
 */

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const auto = () => {
    try {
      if (!sessionStorage.getItem('slp-crash-reloaded')) {
        sessionStorage.setItem('slp-crash-reloaded', String(Date.now()));
        setTimeout(() => location.reload(), 500);
        return;
      }
    } catch {
      /* storage unavailable */
    }
  };
  if (typeof window !== 'undefined') auto();
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40 }}>⚠️</div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>
            Something went wrong — reloading the app
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>ఏదో తప్పు జరిగింది — యాప్ మళ్ళీ లోడ్ అవుతోంది</p>
          <button
            onClick={() => {
              try {
                sessionStorage.removeItem('slp-chunk-reload');
                sessionStorage.removeItem('slp-crash-reloaded');
              } catch {
                /* ignore */
              }
              location.reload();
            }}
            style={{
              marginTop: 8,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              background: '#1d4ed8',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Open app / యాప్ తెరవండి
          </button>
          <button
            onClick={() => reset()}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, cursor: 'pointer' }}
          >
            Try again in place
          </button>
        </div>
      </body>
    </html>
  );
}
