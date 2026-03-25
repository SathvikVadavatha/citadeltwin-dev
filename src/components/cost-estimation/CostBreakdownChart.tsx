
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { CostLineItem, CostSummary } from '@/types/cost-estimation';

interface CostBreakdownChartProps {
  lineItems: CostLineItem[];
  costSummary: CostSummary;
}

export const CostBreakdownChart = ({ lineItems, costSummary }: CostBreakdownChartProps) => {
  const categoryData = [
    { name: 'Materials', value: costSummary.totalMaterialCost, color: '#3B82F6' },
    { name: 'Labor', value: costSummary.totalLaborCost, color: '#10B981' },
    { name: 'Equipment', value: costSummary.totalEquipmentCost, color: '#F59E0B' },
    { name: 'Markup', value: costSummary.markup, color: '#8B5CF6' },
    { name: 'Contingency', value: costSummary.contingency, color: '#EF4444' },
  ].filter(item => item.value > 0);

  const lineItemData = lineItems.slice(0, 10).map(item => ({
    name: item.item_description.substring(0, 20) + (item.item_description.length > 20 ? '...' : ''),
    cost: item.total_cost,
    hours: item.total_labor_hours,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cost Breakdown Pie Chart */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle>Cost Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm">{item.name}: ${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Line Items Bar Chart */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle>Top Line Items by Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineItemData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'cost' ? `$${value.toLocaleString()}` : `${value.toFixed(1)} hrs`,
                    name === 'cost' ? 'Cost' : 'Labor Hours'
                  ]}
                />
                <Legend />
                <Bar dataKey="cost" fill="#3B82F6" name="Cost" />
                <Bar dataKey="hours" fill="#10B981" name="Labor Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary Details */}
      <Card className="gradient-border lg:col-span-2">
        <CardHeader>
          <CardTitle>Detailed Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Direct Costs</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Materials:</span>
                  <span>${costSummary.totalMaterialCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor:</span>
                  <span>${costSummary.totalLaborCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipment:</span>
                  <span>${costSummary.totalEquipmentCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Subtotal:</span>
                  <span>${costSummary.subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Indirect Costs</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Markup:</span>
                  <span>${costSummary.markup.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contingency:</span>
                  <span>${costSummary.contingency.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span className="shadow-sm">${costSummary.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Labor Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Hours:</span>
                  <span>{costSummary.totalLaborHours.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{costSummary.estimatedDuration} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Daily Hours:</span>
                  <span>{costSummary.estimatedDuration > 0 ? (costSummary.totalLaborHours / costSummary.estimatedDuration).toFixed(1) : '0'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Cost Ratios</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Cost/Sq Ft:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor %:</span>
                  <span>{costSummary.subtotal > 0 ? ((costSummary.totalLaborCost / costSummary.subtotal) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Material %:</span>
                  <span>{costSummary.subtotal > 0 ? ((costSummary.totalMaterialCost / costSummary.subtotal) * 100).toFixed(1) : '0'}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
