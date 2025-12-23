import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { height: 32, width: 220 },
    md: { height: 44, width: 280 },
    lg: { height: 56, width: 340 },
  };

  const { height, width } = sizes[size];

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <svg
        height={height}
        width={width}
        viewBox="0 0 280 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield with lock icon */}
        <g>
          {/* Outer shield */}
          <path
            d="M22 3L5 10v12c0 11 7.2 21.3 17 25.5 9.8-4.2 17-14.5 17-25.5V10L22 3z"
            fill="url(#shield-bg)"
          />
          <path
            d="M22 3L5 10v12c0 11 7.2 21.3 17 25.5 9.8-4.2 17-14.5 17-25.5V10L22 3z"
            stroke="url(#shield-border)"
            strokeWidth="2"
            fill="none"
          />

          {/* Lock body */}
          <rect
            x="14"
            y="20"
            width="16"
            height="12"
            rx="2"
            fill="#10b981"
          />

          {/* Lock shackle */}
          <path
            d="M17 20v-4a5 5 0 0 1 10 0v4"
            stroke="#10b981"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Keyhole */}
          <circle cx="22" cy="25" r="2" fill="#022c22" />
          <path d="M22 26v3" stroke="#022c22" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Text: SecureSiteScan.com */}
        <text
          x="50"
          y="29"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="700"
          fontSize="20"
          letterSpacing="-0.5"
        >
          <tspan fill="#ffffff">Secure</tspan>
          <tspan fill="#10b981">Site</tspan>
          <tspan fill="#ffffff">Scan</tspan>
          <tspan fill="#6b7280" fontSize="16" fontWeight="500">.com</tspan>
        </text>

        {/* Gradients */}
        <defs>
          <linearGradient id="shield-bg" x1="22" y1="3" x2="22" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#064e3b" />
            <stop offset="1" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="shield-border" x1="22" y1="3" x2="22" y2="50" gradientUnits="userSpaceOnUse">
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
      viewBox="0 0 44 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer shield */}
      <path
        d="M22 3L5 10v12c0 11 7.2 21.3 17 25.5 9.8-4.2 17-14.5 17-25.5V10L22 3z"
        fill="url(#shield-bg-icon)"
      />
      <path
        d="M22 3L5 10v12c0 11 7.2 21.3 17 25.5 9.8-4.2 17-14.5 17-25.5V10L22 3z"
        stroke="url(#shield-border-icon)"
        strokeWidth="2"
        fill="none"
      />

      {/* Lock body */}
      <rect
        x="14"
        y="20"
        width="16"
        height="12"
        rx="2"
        fill="#10b981"
      />

      {/* Lock shackle */}
      <path
        d="M17 20v-4a5 5 0 0 1 10 0v4"
        stroke="#10b981"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Keyhole */}
      <circle cx="22" cy="25" r="2" fill="#022c22" />
      <path d="M22 26v3" stroke="#022c22" strokeWidth="2" strokeLinecap="round" />

      <defs>
        <linearGradient id="shield-bg-icon" x1="22" y1="3" x2="22" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#064e3b" />
          <stop offset="1" stopColor="#022c22" />
        </linearGradient>
        <linearGradient id="shield-border-icon" x1="22" y1="3" x2="22" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}
