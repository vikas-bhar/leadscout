import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Subtle glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(10, 10, 10, 0) 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <span style={{ fontSize: '72px' }}>🎯</span>
          <span
            style={{
              fontSize: '84px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}
          >
            LeadScout
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '38px',
            fontWeight: 500,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '850px',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          Find freelance clients with AI
        </div>

        {/* Badges */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '44px',
          }}
        >
          {['Google Maps Scraper', 'Instagram Gap Detection', 'Personalized AI Pitches'].map((tag) => (
            <div
              key={tag}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                padding: '10px 24px',
                color: '#e2e8f0',
                fontSize: '18px',
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
