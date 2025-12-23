import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { height: 24, iconSize: 20, textSize: 14, gap: 6 },
    md: { height: 32, iconSize: 26, textSize: 18, gap: 8 },
    lg: { height: 40, iconSize: 32, textSize: 22, gap: 10 },
  };

  const { height, iconSize, textSize, gap } = sizes[size];

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <svg
        height={height}
        viewBox="0 0 200 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield icon with scan lines */}
        <g>
          {/* Shield background */}
          <path
            d="M20 4L6 10v10c0 9.55 5.97 18.48 14 22 8.03-3.52 14-12.45 14-22V10L20 4z"
            fill="url(#shield-gradient)"
          />
          {/* Shield border */}
          <path
            d="M20 4L6 10v10c0 9.55 5.97 18.48 14 22 8.03-3.52 14-12.45 14-22V10L20 4z"
            stroke="url(#border-gradient)"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Scan lines */}
          <path
            d="M12 16h16M12 20h16M12 24h12"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Checkmark */}
          <path
            d="M15 20l3 3 7-7"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Text: SecureSiteScan */}
        <text
          x="46"
          y="26"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="18"
          fill="#ffffff"
        >
          Secure
          <tspan fill="#10b981">Site</tspan>
          <tspan fill="#ffffff">Scan</tspan>
        </text>

        {/* Gradients */}
        <defs>
          <linearGradient id="shield-gradient" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#064e3b" />
            <stop offset="1" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="border-gradient" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    </Link>
  );
}

export function LogoIcon({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield background */}
      <path
        d="M20 4L6 10v10c0 9.55 5.97 18.48 14 22 8.03-3.52 14-12.45 14-22V10L20 4z"
        fill="url(#shield-gradient-icon)"
      />
      {/* Shield border */}
      <path
        d="M20 4L6 10v10c0 9.55 5.97 18.48 14 22 8.03-3.52 14-12.45 14-22V10L20 4z"
        stroke="url(#border-gradient-icon)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Scan lines */}
      <path
        d="M12 16h16M12 20h16M12 24h12"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Checkmark */}
      <path
        d="M15 20l3 3 7-7"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <defs>
        <linearGradient id="shield-gradient-icon" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#064e3b" />
          <stop offset="1" stopColor="#022c22" />
        </linearGradient>
        <linearGradient id="border-gradient-icon" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}
