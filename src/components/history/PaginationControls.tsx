
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center py-4">
      <Pagination>
        <PaginationContent>
          {currentPage === 1 ? (
            <PaginationItem>
              <Button 
                variant="outline" 
                size="default" 
                className="gap-1 pl-2.5"
                disabled={true}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
            </PaginationItem>
          ) : (
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} />
            </PaginationItem>
          )}
          
          {Array.from({ length: totalPages }).map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                isActive={currentPage === i + 1}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          )).filter((_, i) => {
            // Only show 5 pages max, with current page in the middle if possible
            const min = Math.max(0, currentPage - 3);
            const max = Math.min(totalPages - 1, currentPage + 1);
            return i >= min && i <= max;
          })}
          
          {currentPage === totalPages ? (
            <PaginationItem>
              <Button 
                variant="outline" 
                size="default" 
                className="gap-1 pr-2.5"
                disabled={true}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          ) : (
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};
