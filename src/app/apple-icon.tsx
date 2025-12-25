import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#022c22',
          borderRadius: '22%',
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 44 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield background */}
          <path
            d="M22 4L6 10v10c0 9 6.5 17.5 16 21 9.5-3.5 16-12 16-21V10L22 4z"
            fill="url(#shield-gradient)"
          />
          {/* Shield border */}
          <path
            d="M22 4L6 10v10c0 9 6.5 17.5 16 21 9.5-3.5 16-12 16-21V10L22 4z"
            stroke="#34d399"
            strokeWidth="2"
            fill="none"
          />
          {/* Lock body */}
          <rect x="14" y="19" width="16" height="12" rx="2" fill="#10b981" />
          {/* Lock shackle */}
          <path
            d="M17 19v-4a5 5 0 0 1 10 0v4"
            stroke="#10b981"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Keyhole */}
          <circle cx="22" cy="24" r="2" fill="#022c22" />
          <path d="M22 25v3" stroke="#022c22" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id="shield-gradient" x1="22" y1="4" x2="22" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#064e3b" />
              <stop offset="1" stopColor="#022c22" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
