
import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, subMonths, isWithinInterval, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem } from "../services/inventory";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const CHART_COLORS = [
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#0EA5E9", // Blue
  "#10B981", // Green
  "#F43F5E", // Red
  "#FBBF24", // Yellow
];

interface DashboardViewProps {
  items: InventoryItem[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ items }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("6");

  // Extract unique product names for the filter
  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    items.forEach(item => products.add(item.product));
    return Array.from(products).sort();
  }, [items]);

  // Generate data for the chart based on selected filters
  const chartData = useMemo(() => {
    // Get date range for selected period
    const endDate = new Date();
    const startDate = subMonths(endDate, parseInt(selectedPeriod));
    
    // Filter items by selected product and period using prepared date
    const filteredItems = items.filter(item => {
      // Parse prepared date string to Date object for comparison
      const itemDate = parseISO(item.preparedDate);
      
      // Filter by product if a specific one is selected
      const productMatch = selectedProduct === "all" || item.product === selectedProduct;
      
      // Filter by date range using prepared date
      const dateMatch = isWithinInterval(itemDate, { start: startDate, end: endDate });
      
      return productMatch && dateMatch;
    });

    // Generate month labels for the chart
    const months = [];
    for (let i = 0; i < parseInt(selectedPeriod); i++) {
      const monthDate = subMonths(endDate, i);
      months.unshift(format(monthDate, "MMM yyyy"));
    }

    // Count items by month and product using prepared date
    const monthlyData: { [month: string]: { [product: string]: number } } = {};
    months.forEach(month => {
      monthlyData[month] = {};
    });

    // Group items by month and product using prepared date
    filteredItems.forEach(item => {
      const itemMonth = format(parseISO(item.preparedDate), "MMM yyyy");
      if (months.includes(itemMonth)) {
        if (!monthlyData[itemMonth][item.product]) {
          monthlyData[itemMonth][item.product] = 0;
        }
        monthlyData[itemMonth][item.product]++;
      }
    });

    // Transform grouped data to chart format
    return months.map(month => {
      const monthData: { month: string, [key: string]: number | string } = { month };
      
      if (selectedProduct === "all") {
        // Show all products on chart if "all" is selected
        uniqueProducts.forEach(product => {
          monthData[product] = monthlyData[month][product] || 0;
        });
      } else {
        // Show only selected product
        monthData[selectedProduct] = monthlyData[month][selectedProduct] || 0;
      }
      
      return monthData;
    });
  }, [items, selectedProduct, selectedPeriod, uniqueProducts]);

  // Configure chart
  const chartConfig = useMemo(() => {
    const config: { [key: string]: { label: string, color: string } } = {};
    uniqueProducts.forEach((product, index) => {
      config[product] = {
        label: product,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [uniqueProducts]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Consumption Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Filter by Product
              </label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {uniqueProducts.map(product => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Time Period
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="h-[400px] mt-8">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 25,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} />
                  {selectedProduct === "all"
                    ? uniqueProducts.map((product, index) => (
                        <Line
                          key={product}
                          type="monotone"
                          dataKey={product}
                          name={product}
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          activeDot={{ r: 6 }}
                          strokeWidth={2}
                          dot={{ strokeWidth: 2 }}
                        />
                      ))
                    : (
                        <Line
                          type="monotone"
                          dataKey={selectedProduct}
                          name={selectedProduct}
                          stroke={CHART_COLORS[0]}
                          activeDot={{ r: 6 }}
                          strokeWidth={2}
                          dot={{ strokeWidth: 2 }}
                        />
                      )
                  }
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          {chartData.length === 0 && (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              No data available for the selected filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
