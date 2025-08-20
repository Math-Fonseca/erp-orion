import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface Column {
  key: string;
  header: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface Action {
  icon: LucideIcon;
  label: string;
  onClick: (item: any) => void;
  className?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  actions?: Action[];
  compact?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export default function DataTable({ 
  data, 
  columns, 
  actions, 
  compact = false,
  pagination = false,
  pageSize = 10 
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = pagination ? Math.ceil(data.length / pageSize) : 1;
  const startIndex = pagination ? (currentPage - 1) * pageSize : 0;
  const endIndex = pagination ? startIndex + pageSize : data.length;
  const currentData = pagination ? data.slice(startIndex, endIndex) : data;

  const renderCellValue = (item: any, column: Column) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }
    
    // Default rendering for common patterns
    if (column.key === 'status') {
      return <Badge variant="secondary">{value}</Badge>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    
    if (value === null || value === undefined) {
      return '-';
    }
    
    return String(value);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado encontrado
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 ${compact ? 'py-2' : 'py-4'} whitespace-nowrap text-sm ${
                      column.key === columns[0].key ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {renderCellValue(item, column)}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className={`px-6 ${compact ? 'py-2' : 'py-4'} whitespace-nowrap text-right text-sm font-medium`}>
                    <div className="flex space-x-2">
                      {actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant="ghost"
                          size="sm"
                          onClick={() => action.onClick(item)}
                          className={`h-8 w-8 p-0 ${action.className || ''}`}
                          title={action.label}
                        >
                          <action.icon className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
              <span className="font-medium">{Math.min(endIndex, data.length)}</span> de{' '}
              <span className="font-medium">{data.length}</span> resultados
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
