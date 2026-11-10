interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 sm:h-8 md:h-9',
  md: 'h-8 sm:h-10 md:h-12',
  lg: 'h-9 sm:h-11 md:h-14 lg:h-16',
  xl: 'h-20 sm:h-20 md:h-24 lg:h-28',
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/logo-320.webp"
        alt="Dominus Tax Consultants Logo"
        className={`w-auto object-contain flex-shrink-0 ${sizeClasses[size]}`}
        loading="eager"
        width={320}
        height={213}
      />
    </div>
  );
}
