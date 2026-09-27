import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          padding: '60px',
        }}
      >
        <div style={{
          fontSize: '28px',
          color: '#378ADD',
          marginBottom: '24px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          🎯 LeadScout
        </div>

        <div style={{
          fontSize: '56px',
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: '1.15',
          marginBottom: '24px',
          maxWidth: '900px'
        }}>
          Find freelance clients who need you right now
        </div>

        <div style={{
          fontSize: '24px',
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: '700px',
          marginBottom: '48px'
        }}>
          AI scans Google Maps and Instagram.
          Finds the gaps. Writes your pitch.
        </div>

        <div style={{
          display: 'flex',
          gap: '32px'
        }}>
          {['Google Maps', 'Instagram', 'AI Analysis', 'Pitches'].map(tag => (
            <div key={tag} style={{
              background: 'rgba(55,138,221,0.2)',
              border: '1px solid rgba(55,138,221,0.4)',
              borderRadius: '100px',
              padding: '10px 24px',
              color: '#378ADD',
              fontSize: '18px',
              fontWeight: '500'
            }}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
