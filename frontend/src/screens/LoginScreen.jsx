import { SignIn } from '@clerk/clerk-react'

export default function LoginScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
      gap: 40,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800, fontSize: '2.5rem',
          letterSpacing: '-0.04em', marginBottom: 8
        }}>
          Dispens<span style={{ color: 'var(--accent)' }}>IA</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
          Video TikTok → ricette in secondi
        </p>
      </div>

      <SignIn
        appearance={{
          variables: {
            colorBackground: '#141416',
            colorText: '#f0f0f2',
            colorTextSecondary: '#a0a0aa',
            colorInputBackground: '#1c1c20',
            colorInputText: '#f0f0f2',
            colorPrimary: '#ff6b35',
            borderRadius: '14px',
            fontFamily: 'DM Sans, sans-serif',
          },
          elements: {
            card: {
              boxShadow: 'none',
              border: '1px solid rgba(255,255,255,0.07)',
            },
            formButtonPrimary: {
              background: '#ff6b35',
            },
            socialButtonsBlockButton: {
              background: '#2a2a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f0f0f2',
            },
            socialButtonsBlockButtonText: {
              color: '#f0f0f2',
            },
            dividerLine: {
              background: 'rgba(255,255,255,0.08)',
            },
            dividerText: {
              color: '#6a6a76',
            },
            formFieldLabel: {
              color: '#a0a0aa',
            },
            formFieldInput: {
              background: '#1c1c20',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f0f0f2',
            },
            footerActionText: {
              color: '#6a6a76',
            },
          }
        }}
      />
    </div>
  )
}
