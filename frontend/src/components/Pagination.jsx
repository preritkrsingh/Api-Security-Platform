import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalItems <= pageSize) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis if needed
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border text-xs">
      <div className="text-muted-foreground font-mono text-[11px]">
        Showing <span className="text-foreground font-medium">{startItem}</span> -{' '}
        <span className="text-foreground font-medium">{endItem}</span> of{' '}
        <span className="text-foreground font-medium">{totalItems}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* Page Number Pills */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-muted-foreground font-mono">
                  &hellip;
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <Button
                key={p}
                size="sm"
                variant={isCurrent ? 'default' : 'ghost'}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 p-0 text-xs font-mono font-medium ${
                  isCurrent ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          title="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
