import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { height: 36, width: 240 },
    md: { height: 48, width: 300 },
    lg: { height: 60, width: 360 },
  };

  const { height, width } = sizes[size];

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <svg
        height={height}
        width={width}
        viewBox="0 0 300 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield with lock icon - scaled to fit */}
        <g transform="translate(2, 2)">
          {/* Outer shield */}
          <path
            d="M20 2L4 8v10c0 9 6 17.5 16 21 10-3.5 16-12 16-21V8L20 2z"
            fill="url(#shield-bg)"
          />
          <path
            d="M20 2L4 8v10c0 9 6 17.5 16 21 10-3.5 16-12 16-21V8L20 2z"
            stroke="url(#shield-border)"
            strokeWidth="2"
            fill="none"
          />

          {/* Lock body */}
          <rect
            x="13"
            y="17"
            width="14"
            height="10"
            rx="2"
            fill="#10b981"
          />

          {/* Lock shackle */}
          <path
            d="M15.5 17v-3a4.5 4.5 0 0 1 9 0v3"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Keyhole */}
          <circle cx="20" cy="21.5" r="1.5" fill="#022c22" />
          <path d="M20 22.5v2.5" stroke="#022c22" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Text: SecureSiteScan.com */}
        <text
          x="52"
          y="32"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="700"
          fontSize="22"
          letterSpacing="-0.5"
        >
          <tspan fill="#ffffff">Secure</tspan>
          <tspan fill="#10b981">Site</tspan>
          <tspan fill="#ffffff">Scan</tspan>
          <tspan fill="#6b7280" fontSize="17" fontWeight="500">.com</tspan>
        </text>

        {/* Gradients */}
        <defs>
          <linearGradient id="shield-bg" x1="20" y1="0" x2="20" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#064e3b" />
            <stop offset="1" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="shield-border" x1="20" y1="0" x2="20" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    </Link>
  );
}

export function LogoIcon({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer shield */}
      <path
        d="M22 4L6 10v10c0 9 6.5 17.5 16 21 9.5-3.5 16-12 16-21V10L22 4z"
        fill="url(#shield-bg-icon)"
      />
      <path
        d="M22 4L6 10v10c0 9 6.5 17.5 16 21 9.5-3.5 16-12 16-21V10L22 4z"
        stroke="url(#shield-border-icon)"
        strokeWidth="2"
        fill="none"
      />

      {/* Lock body */}
      <rect
        x="14"
        y="19"
        width="16"
        height="12"
        rx="2"
        fill="#10b981"
      />

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
        <linearGradient id="shield-bg-icon" x1="22" y1="4" x2="22" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#064e3b" />
          <stop offset="1" stopColor="#022c22" />
        </linearGradient>
        <linearGradient id="shield-border-icon" x1="22" y1="4" x2="22" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}
