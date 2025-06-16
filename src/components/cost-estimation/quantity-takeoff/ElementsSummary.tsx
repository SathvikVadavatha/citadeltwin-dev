
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface ElementsSummaryProps {
  elements: any[];
}

export const ElementsSummary = ({ elements }: ElementsSummaryProps) => {
  const getElementTypeColor = (elementType: string) => {
    const colors = {
      wall: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      beam: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50',
      column: 'bg-green-500/20 text-green-400 border-green-400/50',
      slab: 'bg-purple-500/20 text-purple-400 border-purple-400/50',
      foundation: 'bg-orange-500/20 text-orange-400 border-orange-400/50',
    };
    return colors[elementType as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-400/50';
  };

  return (
    <Card className="gradient-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          Available BIM Elements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {elements.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No BIM elements found. Upload and parse a blueprint first.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(
              elements.reduce((acc, element) => {
                acc[element.element_type] = (acc[element.element_type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="text-center">
                <Badge className={getElementTypeColor(type)}>
                  {type}
                </Badge>
                <p className="text-sm mt-1">{count} elements</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
