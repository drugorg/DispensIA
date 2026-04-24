import { Browser } from '@capacitor/browser'
 
export default function LoginScreen() {
  const openLogin = async () => {
    await Browser.open({
      url: 'https://accounts.dispensia.app/sign-in',
      presentationStyle: 'popover',
    })
  }
 
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      gap: 40,
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '2.8rem',
          letterSpacing: '-0.04em',
          marginBottom: 10,
        }}>
          Dispens<span style={{ color: 'var(--accent)' }}>IA</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.95rem', lineHeight: 1.4 }}>
          Video TikTok → ricette in secondi
        </p>
      </div>
 
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={openLogin}
          className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
        >
          Accedi / Registrati
        </button>
 
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>
          Accedi con Email, Google o Apple.<br />
          Dopo il login torna all'app.
        </p>
      </div>
    </div>
  )
}
