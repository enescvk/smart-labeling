import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { InventoryItem } from "@/services/inventory/types";
import { cn } from "@/lib/utils";

interface AnalyticsChartProps {
  items: InventoryItem[];
  defaultStartDate?: Date;
  defaultEndDate?: Date;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  items, 
  defaultStartDate, 
  defaultEndDate 
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedPreparedBy, setSelectedPreparedBy] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate);

  // Extract unique products and preparers
  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    items.forEach(item => products.add(item.product));
    return Array.from(products).sort();
  }, [items]);

  const uniquePreparers = useMemo(() => {
    const preparers = new Set<string>();
    items.forEach(item => {
      if (item.preparedByProfile?.first_name || item.preparedByProfile?.last_name) {
        const name = `${item.preparedByProfile.first_name || ''} ${item.preparedByProfile.last_name || ''}`.trim();
        preparers.add(name);
      } else {
        preparers.add(item.preparedBy);
      }
    });
    return Array.from(preparers).sort();
  }, [items]);

  // Filter and aggregate data
  const chartData = useMemo(() => {
    let filteredItems = items;

    // Filter by product
    if (selectedProduct !== "all") {
      filteredItems = filteredItems.filter(item => item.product === selectedProduct);
    }

    // Filter by prepared by
    if (selectedPreparedBy !== "all") {
      filteredItems = filteredItems.filter(item => {
        const preparerName = item.preparedByProfile?.first_name || item.preparedByProfile?.last_name
          ? `${item.preparedByProfile.first_name || ''} ${item.preparedByProfile.last_name || ''}`.trim()
          : item.preparedBy;
        return preparerName === selectedPreparedBy;
      });
    }

    // Filter by date range using prepared_date
    if (startDate && endDate) {
      filteredItems = filteredItems.filter(item => {
        const prepDate = parseISO(item.preparedDate);
        return isWithinInterval(prepDate, { start: startDate, end: endDate });
      });
    }

    // Count by status
    const statusCounts = {
      active: 0,
      used: 0,
      waste: 0
    };

    filteredItems.forEach(item => {
      if (item.status === 'active') statusCounts.active++;
      else if (item.status === 'used') statusCounts.used++;
      else if (item.status === 'waste') statusCounts.waste++;
    });

    return [
      {
        name: 'Active Items',
        count: statusCounts.active,
        fill: '#10B981'
      },
      {
        name: 'Used Items',
        count: statusCounts.used,
        fill: '#6B7280'
      },
      {
        name: 'Wasted Items',
        count: statusCounts.waste,
        fill: '#EF4444'
      }
    ];
  }, [items, selectedProduct, selectedPreparedBy, startDate, endDate]);

  const chartConfig = {
    count: {
      label: "Count",
    },
  };

  const clearFilters = () => {
    setSelectedProduct("all");
    setSelectedPreparedBy("all");
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Analytics (Month to Date)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Product Name
            </label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
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
              Prepared By
            </label>
            <Select value={selectedPreparedBy} onValueChange={setSelectedPreparedBy}>
              <SelectTrigger>
                <SelectValue placeholder="All Preparers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Preparers</SelectItem>
                {uniquePreparers.map(preparer => (
                  <SelectItem key={preparer} value={preparer}>
                    {preparer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Start Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              End Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            Showing {chartData.reduce((sum, item) => sum + item.count, 0)} total items prepared in selected period
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        <div className="h-[400px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
