import React, { useState } from 'react';
import { Table, Search, Download, ArrowUpDown } from 'lucide-react';

export default function DataFrameTable({ htmlContent }) {
  const [filterText, setFilterText] = useState('');

  if (!htmlContent) return null;

  return (
    <div className="df-table-container">
      <div className="df-table-header">
        <div className="df-title">
          <Table className="w-4 h-4 text-emerald-400" />
          <span>Pandas DataFrame View</span>
        </div>
      </div>

      {/* Render raw Pyodide HTML Table with custom scrollable CSS wrapper */}
      <div 
        className="df-table-scroll-wrapper"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
