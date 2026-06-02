import React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  className,
  emptyMessage = "NO_DATA_FOUND"
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-hidden border border-border/50 rounded-lg bg-card/10 backdrop-blur-sm", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/20">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-3 text-xxs font-black uppercase tracking-widest text-muted-foreground",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {data.length > 0 ? (
            data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "hover:bg-primary/5 transition-colors group",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "px-4 py-3 text-xs font-mono text-foreground/80 group-hover:text-primary transition-colors",
                      col.className
                    )}
                  >
                    {typeof col.accessor === 'function'
                      ? col.accessor(item)
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-xs font-mono text-muted-foreground uppercase italic tracking-widest">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Table Footer / Scanner Effect */}
      <div className="h-1 w-full bg-primary/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1/3 bg-primary/30 animate-[scan_3s_linear_infinite]" />
      </div>
    </div>
  );
}

