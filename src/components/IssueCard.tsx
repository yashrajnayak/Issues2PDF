import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Issue } from '../types';
import { FileDown } from 'lucide-react';
import { generateSingleIssuePDF } from '../services/pdf';

interface IssueCardProps {
  issue: Issue;
  registerRef: (element: HTMLDivElement, index: number) => void;
  index: number;
  hideMetadata: boolean;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, registerRef, index, hideMetadata }) => {
  const issueRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (issueRef.current) {
      registerRef(issueRef.current, index);
    }
  }, [registerRef, index]);

  const handleDownload = async () => {
    if (issueRef.current) {
      try {
        await generateSingleIssuePDF(issueRef.current, issue, hideMetadata);
      } catch (error) {
        console.error('Error downloading issue:', error);
        alert('Failed to download issue as PDF');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div 
      ref={issueRef}
      className="bg-white rounded-lg shadow-md p-6 mb-6 break-words"
      data-pdf-content
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-800">#{issue.number}: {issue.title}</h2>
          {!hideMetadata && (
            <div className="flex items-center mt-2">
              <img 
                src={issue.user.avatar_url} 
                alt={issue.user.login} 
                className="w-6 h-6 rounded-full mr-2"
              />
              <span className="text-sm text-gray-600">
                Opened by <span className="font-medium">{issue.user.login}</span> on {formatDate(issue.created_at)}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm ml-4"
          data-pdf-exclude
        >
          <FileDown size={16} className="mr-1" />
          PDF
        </button>
      </div>
      
      {!hideMetadata && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {issue.labels.map((label) => (
            <span 
              key={label.name}
              className="px-2 py-1 text-xs rounded-full"
              style={{ 
                backgroundColor: `#${label.color}`, 
                color: parseInt(label.color, 16) > 0xffffff / 2 ? '#000' : '#fff'
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      
      <div className="prose prose-sm max-w-none mt-4 text-gray-700">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({node, ...props}) => (
              <a {...props} className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer" />
            ),
            pre: ({node, ...props}) => (
              <pre {...props} className="bg-gray-100 rounded-md p-4 overflow-x-auto" />
            ),
            code: ({node, inline, ...props}) => (
              inline 
                ? <code {...props} className="bg-gray-100 rounded px-1 py-0.5" />
                : <code {...props} className="block" />
            ),
            blockquote: ({node, ...props}) => (
              <blockquote {...props} className="border-l-4 border-gray-200 pl-4 italic" />
            ),
            img: ({node, ...props}) => (
              <img {...props} className="max-w-full h-auto rounded-lg" />
            ),
            table: ({node, ...props}) => (
              <div className="overflow-x-auto">
                <table {...props} className="min-w-full divide-y divide-gray-200" />
              </div>
            ),
            th: ({node, ...props}) => (
              <th {...props} className="px-4 py-2 bg-gray-50" />
            ),
            td: ({node, ...props}) => (
              <td {...props} className="px-4 py-2 border-t" />
            ),
          }}
        >
          {issue.body || 'No description provided.'}
        </ReactMarkdown>
      </div>
      
      {!hideMetadata && (
        <div className="mt-4 text-sm text-gray-500">
          <span className={`inline-flex items-center px-2 py-1 rounded-full ${
            issue.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {issue.state === 'open' ? 'Open' : 'Closed'}
          </span>
          <span className="ml-4">Last updated: {formatDate(issue.updated_at)}</span>
        </div>
      )}
    </div>
  );
};

export default IssueCard;