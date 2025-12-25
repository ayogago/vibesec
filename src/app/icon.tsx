import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield background */}
          <path
            d="M16 2L4 6v8c0 7 5 13.5 12 16 7-2.5 12-9 12-16V6L16 2z"
            fill="url(#shield-gradient)"
          />
          {/* Shield border */}
          <path
            d="M16 2L4 6v8c0 7 5 13.5 12 16 7-2.5 12-9 12-16V6L16 2z"
            stroke="#34d399"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Lock body */}
          <rect x="10" y="14" width="12" height="9" rx="1.5" fill="#10b981" />
          {/* Lock shackle */}
          <path
            d="M12 14v-3a4 4 0 0 1 8 0v3"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Keyhole */}
          <circle cx="16" cy="18" r="1.5" fill="#022c22" />
          <path d="M16 19v2" stroke="#022c22" strokeWidth="1.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="shield-gradient" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
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
