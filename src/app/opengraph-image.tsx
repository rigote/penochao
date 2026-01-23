import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Penochão - Controle Financeiro Inteligente com IA'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* PiggyBank icon simplified */}
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
              <path d="M2 9v1c0 1.1.9 2 2 2h1" />
              <path d="M16 11h0" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 16,
            textShadow: '0 4px 8px rgba(0,0,0,0.2)',
          }}
        >
          Penochão
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: 'rgba(255,255,255,0.9)',
            marginBottom: 40,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Controle Financeiro Inteligente com IA
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 24,
          }}
        >
          {['Leitura de Faturas', 'Dashboard Completo', 'Categorização Automática'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '12px 24px',
                  borderRadius: 50,
                  color: 'white',
                  fontSize: 20,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feature}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            fontSize: 24,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          penochao.app.br
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
