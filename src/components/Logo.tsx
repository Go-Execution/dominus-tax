import { Crown } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { shield: 36, crown: 14, title: 'text-base', subtitle: 'text-[8px]' },
  md: { shield: 48, crown: 18, title: 'text-xl', subtitle: 'text-[9px]' },
  lg: { shield: 72, crown: 26, title: 'text-3xl', subtitle: 'text-xs' },
  xl: { shield: 110, crown: 38, title: 'text-5xl', subtitle: 'text-base' },
};

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: s.shield, height: s.shield }}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8D48B" />
              <stop offset="50%" stopColor="#C9A227" />
              <stop offset="100%" stopColor="#A67C00" />
            </linearGradient>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1A1A1A" />
              <stop offset="100%" stopColor="#0A0A0A" />
            </linearGradient>
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#008F6B" />
              <stop offset="100%" stopColor="#004D3A" />
            </linearGradient>
          </defs>

          {/* Laurel wreaths */}
          <path
            d="M20 58 Q14 50 16 40 Q18 30 24 25"
            stroke="url(#goldGrad)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M18 45 Q16 43 14 44 M20 38 Q18 36 16 37 M24 30 Q22 28 20 29"
            stroke="url(#goldGrad)"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M80 58 Q86 50 84 40 Q82 30 76 25"
            stroke="url(#goldGrad)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M82 45 Q84 43 86 44 M80 38 Q82 36 84 37 M76 30 Q78 28 80 29"
            stroke="url(#goldGrad)"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />

          {/* Shield */}
          <path
            d="M50 12 L82 22 L82 52 C82 70 68 82 50 88 C32 82 18 70 18 52 L18 22 Z"
            fill="url(#shieldGrad)"
            stroke="url(#goldGrad)"
            strokeWidth="2"
          />

          {/* Crown */}
          <path
            d="M40 26 L60 26 L57 31 L43 31 Z M50 20 L53 26 L47 26 Z"
            fill="url(#goldGrad)"
          />

          {/* D letter */}
          <text
            x="50"
            y="64"
            fontFamily="Cinzel, serif"
            fontSize="36"
            fontWeight="bold"
            fill="url(#goldGrad)"
            textAnchor="middle"
          >
            D
          </text>

          {/* Emerald ribbon at bottom */}
          <path
            d="M28 80 Q50 86 72 80 L70 86 Q50 92 30 86 Z"
            fill="url(#emeraldGrad)"
            opacity="0.8"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-display font-bold tracking-[0.2em] gold-text ${s.title}`}
            style={{ textShadow: '0 0 20px rgba(201,162,39,0.3)' }}
          >
            DOMINUS
          </span>
          <span
            className={`font-montserrat font-medium tracking-[0.35em] text-dominus-text-secondary uppercase mt-1 ${s.subtitle}`}
          >
            Tax Consultants
          </span>
        </div>
      )}
    </div>
  );
}
