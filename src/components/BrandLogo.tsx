import logoAsset from "@/assets/citadeltwin-logo.webp.asset.json";

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo = ({ className = "h-10 w-auto" }: BrandLogoProps) => (
  <img src={logoAsset.url} alt="CitadelTwin" className={className} />
);