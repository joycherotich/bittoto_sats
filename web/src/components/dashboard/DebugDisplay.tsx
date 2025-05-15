import React from 'react';

interface DebugDisplayProps {
  data: any;
  title?: string;
}

const DebugDisplay: React.FC<DebugDisplayProps> = ({ data, title = 'Debug Data' }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-md mb-4 border border-gray-300">
      <h3 className="font-bold mb-2">{title}</h3>
      <pre className="text-xs overflow-auto max-h-60">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default DebugDisplay;