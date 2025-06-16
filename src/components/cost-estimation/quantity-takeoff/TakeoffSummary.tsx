
import { Separator } from '@/components/ui/separator';
import type { QuantityTakeoff } from '@/types/cost-estimation';

interface TakeoffSummaryProps {
  takeoffs: QuantityTakeoff[];
}

export const TakeoffSummary = ({ takeoffs }: TakeoffSummaryProps) => {
  return (
    <>
      <Separator />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        <div>
          <span className="text-sm text-muted-foreground">Total Items:</span>
          <p className="font-medium">{takeoffs.length}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Concrete (cy):</span>
          <p className="font-medium">
            {takeoffs
              .filter(t => t.unit_of_measure === 'cy')
              .reduce((sum, t) => sum + t.calculated_quantity, 0)
              .toFixed(2)}
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Area (sf):</span>
          <p className="font-medium">
            {takeoffs
              .filter(t => t.unit_of_measure === 'sf')
              .reduce((sum, t) => sum + t.calculated_quantity, 0)
              .toFixed(2)}
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Count (ea):</span>
          <p className="font-medium">
            {takeoffs
              .filter(t => t.unit_of_measure === 'ea')
              .reduce((sum, t) => sum + t.calculated_quantity, 0)
              .toFixed(0)}
          </p>
        </div>
      </div>
    </>
  );
};
