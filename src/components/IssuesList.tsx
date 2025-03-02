import React from 'react';
import IssueCard from './IssueCard';
import { Issue } from '../types';
import { FileDown } from 'lucide-react';

interface DownloadButtonsProps {
  onDownloadSelected: () => void;
  onDownloadAll: () => void;
  selectedCount: number;
}

const DownloadButtons: React.FC<DownloadButtonsProps> = ({
  onDownloadSelected,
  onDownloadAll,
  selectedCount
}) => (
  <div className="flex items-center gap-2">
    <button 
      onClick={onDownloadSelected}
      className={`flex items-center px-3 py-2 rounded text-sm whitespace-nowrap ${
        selectedCount > 0
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      disabled={selectedCount === 0}
    >
      <FileDown size={16} className="mr-1 shrink-0" />
      <span>Download Selected</span>
    </button>
    <button 
      onClick={onDownloadAll}
      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm whitespace-nowrap"
    >
      <FileDown size={16} className="mr-1 shrink-0" />
      <span>Download All</span>
    </button>
  </div>
);

interface IssuesListProps {
  issues: Issue[];
  loading: boolean;
  hideMetadata: boolean;
  onRegisterRef: (element: HTMLDivElement | null, index: number) => void;
  onToggleSelect: (index: number) => void;
  selectedIssues: Set<number>;
}

const IssuesList: React.FC<IssuesListProps> = ({
  issues,
  loading,
  hideMetadata,
  onRegisterRef,
  onToggleSelect,
  selectedIssues
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <div>
      {issues.map((issue, index) => (
        <div key={issue.id} className="flex items-start space-x-4">
          <div className="pt-6">
            <input
              type="checkbox"
              checked={selectedIssues.has(index)}
              onChange={() => onToggleSelect(index)}
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
            />
          </div>
          <div className="flex-1">
            <IssueCard 
              issue={issue} 
              registerRef={(element) => onRegisterRef(element, index)}
              index={index}
              hideMetadata={hideMetadata}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export { IssuesList as default, DownloadButtons };