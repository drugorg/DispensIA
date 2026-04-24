import { UserButton, useUser } from '@clerk/clerk-react'

export default function SettingsScreen() {
  const { user } = useUser()

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="top-bar-logo">Dispens<span>IA</span></span>
      </div>

      <div style={{ padding: '8px 20px 28px' }}>
        <h1 className="screen-title">Profilo</h1>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Profile card */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <UserButton appearance={{
              elements: {
                avatarBox: { width: 52, height: 52, borderRadius: 14 }
              }
            }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.fullName || user?.firstName || 'Utente'}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 2 }}>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="card">
          {[
            { label: 'Informazioni', icon: 'ℹ️' },
            { label: 'Privacy & Dati', icon: '🔒' },
            { label: 'Termini di servizio', icon: '📄' },
          ].map((item, i) => (
            <div key={i} className="settings-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span className="settings-row-label">{item.label}</span>
              </div>
              <span style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>›</span>
            </div>
          ))}
        </div>

        {/* Version */}
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text3)', paddingTop: 8 }}>
          DispensIA v2.0 · fatto con ❤️ e AI
        </p>
      </div>
    </div>
  )
}
