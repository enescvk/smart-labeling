
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchColumn: string;
  setSearchColumn: (column: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  searchColumn,
  setSearchColumn,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
      <div className="flex w-full md:w-auto md:flex-1 space-x-2">
        <div className="relative w-full max-w-[150px]">
          <Select 
            value={searchColumn} 
            onValueChange={setSearchColumn}
          >
            <SelectTrigger>
              <SelectValue placeholder="Search by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="barcode">Barcode</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kitchen-400" size={18} />
          <Input
            type="search"
            placeholder={`Search by ${searchColumn}...`}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="used">Used</TabsTrigger>
          <TabsTrigger value="waste">Wasted</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
