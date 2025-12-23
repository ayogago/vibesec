import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'SecureSiteScan - Security Scanner for AI-Generated Apps';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

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
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(5, 150, 105, 0.1) 0%, transparent 50%)',
        }}
      >
        {/* Logo and branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          {/* Shield icon */}
          <svg
            width="80"
            height="90"
            viewBox="0 0 44 50"
            fill="none"
            style={{ marginRight: 20 }}
          >
            <defs>
              <linearGradient id="shield-bg" x1="22" y1="4" x2="22" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#064e3b" />
                <stop offset="1" stopColor="#022c22" />
              </linearGradient>
              <linearGradient id="shield-border" x1="22" y1="4" x2="22" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34d399" />
                <stop offset="1" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path
              d="M22 4L6 10v10c0 9 6.5 17.5 16 21 9.5-3.5 16-12 16-21V10L22 4z"
              fill="url(#shield-bg)"
            />
            <path
              d="M22 4L6 10v10c0 9 6.5 17.5 16 21 9.5-3.5 16-12 16-21V10L22 4z"
              stroke="url(#shield-border)"
              strokeWidth="2"
              fill="none"
            />
            <rect x="14" y="19" width="16" height="12" rx="2" fill="#10b981" />
            <path
              d="M17 19v-4a5 5 0 0 1 10 0v4"
              stroke="#10b981"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="22" cy="24" r="2" fill="#022c22" />
            <path d="M22 25v3" stroke="#022c22" strokeWidth="2" strokeLinecap="round" />
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 52, fontWeight: 700, color: '#ffffff' }}>Secure</span>
              <span style={{ fontSize: 52, fontWeight: 700, color: '#10b981' }}>Site</span>
              <span style={{ fontSize: 52, fontWeight: 700, color: '#ffffff' }}>Scan</span>
              <span style={{ fontSize: 40, fontWeight: 500, color: '#6b7280', marginLeft: 4 }}>.com</span>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Security Scanner for AI-Generated Code
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            marginTop: 50,
            gap: 40,
          }}
        >
          {['40+ Security Checks', 'Instant Results', 'Actionable Fixes'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 9999,
                padding: '12px 24px',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 8 }}
              >
                <polyline points="20,6 9,17 4,12" />
              </svg>
              <span style={{ color: '#10b981', fontSize: 18, fontWeight: 500 }}>
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 18,
            color: '#52525b',
          }}
        >
          Built for Bolt.new • Lovable • v0 • Claude Code
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
