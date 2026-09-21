interface BrandLogoProps {
  className?: string;
}

export const BrandLogo = ({ className = "h-10 w-auto" }: BrandLogoProps) => (
  <img src="/citadeltwin-logo.webp" alt="CitadelTwin" className={className} />
);