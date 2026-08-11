import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Search } from 'lucide-react';
import type { ResolveLocationInput } from '@/hooks/site-requirements/useResolveLocation';

interface LocationInputFormProps {
  onSubmit: (input: ResolveLocationInput) => void;
  isSubmitting: boolean;
  initialValues?: Partial<ResolveLocationInput>;
}

export const LocationInputForm: React.FC<LocationInputFormProps> = ({
  onSubmit,
  isSubmitting,
  initialValues,
}) => {
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [zip, setZip] = useState(initialValues?.zip ?? '');
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>(
    initialValues?.propertyType ?? 'commercial'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !zip.trim()) return;
    onSubmit({ address: address.trim(), zip: zip.trim(), propertyType });
  };

  return (
    <Card className="skeuo-card">
      <CardHeader>
        <CardTitle>Site & Federal Requirements</CardTitle>
        <CardDescription>
          Enter a property address to see the federal requirements and site hazard conditions
          that apply. This does not check your design and does not determine compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Property address</Label>
            <Input
              id="address"
              placeholder="123 Main St, Columbus, OH"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 max-w-xs">
            <Label htmlFor="zip">ZIP code</Label>
            <Input
              id="zip"
              placeholder="43215"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Property type</Label>
            <RadioGroup
              value={propertyType}
              onValueChange={(v) => setPropertyType(v as 'residential' | 'commercial')}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="residential" id="residential" />
                <Label htmlFor="residential" className="font-normal cursor-pointer">Residential</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="commercial" id="commercial" />
                <Label htmlFor="commercial" className="font-normal cursor-pointer">Commercial</Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" disabled={isSubmitting} className="flex items-center space-x-2">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Resolving…' : 'Look up requirements'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
