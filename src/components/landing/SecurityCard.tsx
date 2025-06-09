
interface SecurityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const SecurityCard = ({ icon, title, description }: SecurityCardProps) => {
  return (
    <div className="text-center">
      <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};
