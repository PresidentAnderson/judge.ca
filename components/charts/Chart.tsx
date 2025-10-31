import React from 'react';

export interface ChartProps {
  data?: any[];
  type?: 'line' | 'bar' | 'pie' | 'area';
  width?: number | string;
  height?: number | string;
  className?: string;
  title?: string;
}

const Chart: React.FC<ChartProps> = ({
  data = [],
  type = 'line',
  width = '100%',
  height = 300,
  className = '',
  title
}) => {
  return (
    <div className={`chart-container ${className}`} style={{ width, height }}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      )}
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm">Chart Component</p>
          <p className="text-xs text-gray-400">
            Type: {type} | Items: {data.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chart;