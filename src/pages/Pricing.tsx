
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Basic',
      price: '$29',
      description: 'Perfect for individual engineers',
      features: ['Basic CAD tools', 'Limited projects', 'Email support']
    },
    {
      name: 'Professional',
      price: '$99',
      description: 'Ideal for engineering teams',
      features: ['Advanced CAD tools', 'Unlimited projects', 'Priority support', 'Team collaboration'],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$299',
      description: 'For large organizations',
      features: ['All features', 'Custom integrations', 'Dedicated support', 'Advanced analytics']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Pricing Plans</h1>
        <p className="text-muted-foreground mt-2">Choose the perfect plan for your engineering needs</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.popular ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.popular && <Badge>Popular</Badge>}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
