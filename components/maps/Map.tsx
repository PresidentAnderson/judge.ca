import React from 'react';

export interface MapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title?: string;
    description?: string;
  }>;
  width?: number | string;
  height?: number | string;
  className?: string;
  interactive?: boolean;
}

const Map: React.FC<MapProps> = ({
  center = { lat: 45.5017, lng: -73.5673 }, // Montreal coordinates
  zoom = 10,
  markers = [],
  width = '100%',
  height = 400,
  className = '',
  interactive = true
}) => {
  return (
    <div className={`map-container ${className}`} style={{ width, height }}>
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
        {/* Map placeholder */}
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
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-sm">Interactive Map</p>
          <p className="text-xs text-gray-400">
            Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </p>
          <p className="text-xs text-gray-400">
            Markers: {markers.length} | Zoom: {zoom}
          </p>
        </div>

        {/* Grid pattern to simulate map */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-6 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>

        {/* Mock markers */}
        {markers.slice(0, 3).map((marker, index) => (
          <div
            key={marker.id}
            className="absolute w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
            style={{
              left: `${20 + index * 25}%`,
              top: `${30 + index * 15}%`
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Map;