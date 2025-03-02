import React from 'react';
import { Label } from '../types';
import { Tag, X } from 'lucide-react';

interface LabelFilterProps {
  labels: Label[];
  selectedLabels: Set<string>;
  onSelectLabel: (labelName: string) => void;
  onClearLabels: () => void;
}

const LabelFilter: React.FC<LabelFilterProps> = ({
  labels,
  selectedLabels,
  onSelectLabel,
  onClearLabels,
}) => {
  if (!labels?.length) {
    return null;
  }

  // Ensure selectedLabels is defined
  const labelsSet = selectedLabels || new Set<string>();

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600 font-medium">Filter by labels:</span>
        {labelsSet.size > 0 && (
          <button
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
            onClick={onClearLabels}
          >
            <X size={14} className="mr-1" />
            Clear filters
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {labels.map((label) => (
          <button
            key={label.name}
            onClick={() => onSelectLabel(label.name)}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm ${
              labelsSet.has(label.name)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full mr-1.5"
              style={{ backgroundColor: `#${label.color}` }}
            />
            {label.name}
            <span className="ml-1.5 text-xs">
              ({label.count})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LabelFilter; 