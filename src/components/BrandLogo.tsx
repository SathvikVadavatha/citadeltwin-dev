import logoAsset from "@/assets/citadeltwin-logo.png.asset.json";

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo = ({ className = "h-10 w-auto" }: BrandLogoProps) => (
  <img src={logoAsset.url} alt="CitadelTwin" className={className} />
);