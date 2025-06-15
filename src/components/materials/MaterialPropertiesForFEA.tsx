
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ComprehensiveMaterial, MaterialProperty } from '@/types/materials';
import { Calculator, FileText, AlertTriangle } from 'lucide-react';

interface MaterialPropertiesForFEAProps {
  material: ComprehensiveMaterial;
  onExportForFEA?: () => void;
  onViewCompliance?: () => void;
}

export const MaterialPropertiesForFEA = ({ 
  material, 
  onExportForFEA, 
  onViewCompliance 
}: MaterialPropertiesForFEAProps) => {
  
  const formatProperty = (prop: MaterialProperty) => {
    return `${prop.value} ${prop.unit}`;
  };

  const getPropertyStatus = (prop: MaterialProperty) => {
    // Check if property has source verification
    if (prop.source) {
      return { status: 'verified', color: 'bg-green-500/20 text-green-400' };
    }
    return { status: 'estimated', color: 'bg-yellow-500/20 text-yellow-400' };
  };

  const getRequiredPropertiesForFEA = () => {
    const required = ['elasticModulus', 'poissonRatio', 'density'];
    const optional = ['shearModulus', 'yieldStrength', 'ultimateStrength', 'thermalExpansion'];
    
    const availableRequired = required.filter(prop => 
      material.structuralProperties[prop as keyof typeof material.structuralProperties]
    );
    
    const availableOptional = optional.filter(prop => 
      material.structuralProperties[prop as keyof typeof material.structuralProperties]
    );

    return {
      required: required.length,
      availableRequired: availableRequired.length,
      optional: optional.length,
      availableOptional: availableOptional.length,
      isComplete: availableRequired.length === required.length
    };
  };

  const feaReadiness = getRequiredPropertiesForFEA();

  return (
    <Card className="gradient-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            FEA Material Properties
          </CardTitle>
          <div className="flex gap-2">
            {feaReadiness.isComplete ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                FEA Ready
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/50">
                Incomplete
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* FEA Readiness Status */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {feaReadiness.isComplete ? (
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="font-medium">
              FEA Analysis Readiness: {feaReadiness.availableRequired}/{feaReadiness.required} required properties
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {feaReadiness.availableOptional} optional properties available for enhanced analysis
          </p>
        </div>

        {/* Essential Properties for FEA */}
        <div>
          <h4 className="font-semibold mb-3 text-green-400">Essential FEA Properties</h4>
          <div className="grid gap-3">
            {[
              { key: 'elasticModulus', label: 'Elastic Modulus (E)' },
              { key: 'poissonRatio', label: 'Poisson Ratio (ν)' },
              { key: 'density', label: 'Density (ρ)' }
            ].map(({ key, label }) => {
              const prop = material.structuralProperties[key as keyof typeof material.structuralProperties];
              const status = prop ? getPropertyStatus(prop) : null;
              
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-card rounded border">
                  <div>
                    <span className="font-medium">{label}</span>
                    {prop?.source && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {prop.source}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {prop ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatProperty(prop)}</span>
                        <div className={`px-2 py-1 rounded text-xs ${status?.color}`}>
                          {status?.status}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not defined</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Strength Properties */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-400">Strength Properties</h4>
          <div className="grid gap-3">
            {[
              { key: 'yieldStrength', label: 'Yield Strength (fy)' },
              { key: 'ultimateStrength', label: 'Ultimate Strength (fu)' },
              { key: 'compressiveStrength', label: 'Compressive Strength (fc)' },
              { key: 'shearStrength', label: 'Shear Strength (fv)' }
            ].map(({ key, label }) => {
              const prop = material.structuralProperties[key as keyof typeof material.structuralProperties];
              const status = prop ? getPropertyStatus(prop) : null;
              
              if (!prop) return null;
              
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-card rounded border">
                  <div>
                    <span className="font-medium">{label}</span>
                    {prop.source && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {prop.source}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatProperty(prop)}</span>
                      <div className={`px-2 py-1 rounded text-xs ${status?.color}`}>
                        {status?.status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Design Values & Factors */}
        {material.designValues && (
          <div>
            <h4 className="font-semibold mb-3 text-purple-400">Design Values & Factors</h4>
            <div className="space-y-3">
              {material.designValues.reductionFactors && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Reduction Factors (φ)</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(material.designValues.reductionFactors).map(([factor, value]) => (
                      <div key={factor} className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="capitalize">{factor}:</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {material.designValues.modificationFactors && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Modification Factors</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(material.designValues.modificationFactors).map(([factor, value]) => (
                      <div key={factor} className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="capitalize">{factor.replace('_', ' ')}:</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onExportForFEA && (
            <Button 
              onClick={onExportForFEA}
              disabled={!feaReadiness.isComplete}
              className="cyber-button flex-1"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Export for FEA
            </Button>
          )}
          
          {onViewCompliance && (
            <Button 
              onClick={onViewCompliance}
              variant="outline"
              className="cyber-button flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Compliance
            </Button>
          )}
        </div>

        {!feaReadiness.isComplete && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-400">Incomplete FEA Properties</p>
                <p className="text-muted-foreground mt-1">
                  Missing essential properties will limit FEA analysis capabilities. 
                  Consider importing from standard library or adding missing properties manually.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
