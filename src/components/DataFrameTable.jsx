import React from 'react';
import { Table } from 'lucide-react';
import { sanitizeHtml } from '../lib/sanitize';

export default function DataFrameTable({ htmlContent }) {

  if (!htmlContent) return null;

  return (
    <div className="df-table-container">
      <div className="df-table-header">
        <div className="df-title">
          <Table className="w-4 h-4 text-emerald-400" />
          <span>Pandas DataFrame View</span>
        </div>
      </div>

      <div 
        className="df-table-scroll-wrapper"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
      />
    </div>
  );
}
