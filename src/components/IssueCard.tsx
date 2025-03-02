import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Issue } from '../types';
import { FileDown } from 'lucide-react';
import { generateSingleIssuePDF } from '../services/pdf';
import type { Components } from 'react-markdown';

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

  const markdownComponents: Partial<Components> = {
    // Add spacing between paragraphs
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
      <p className="mb-4" {...props}>{children}</p>
    ),
    // Add spacing after headings
    h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
      <h1 className="text-2xl font-bold mb-6 mt-8" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
      <h2 className="text-xl font-bold mb-4 mt-6" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
      <h3 className="text-lg font-bold mb-3 mt-5" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }: React.ComponentPropsWithoutRef<'h4'>) => (
      <h4 className="text-base font-bold mb-2 mt-4" {...props}>{children}</h4>
    ),
    // Style links
    a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
      <a 
        href={href}
        className="text-blue-600 hover:text-blue-800" 
        target="_blank" 
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    // Style code blocks and inline code
    code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
      const isInline = !className?.includes('language-');
      
      if (isInline) {
        return (
          <code 
            className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono" 
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <div className="mb-4">
          <pre className="bg-gray-100 rounded-md p-4 overflow-x-auto">
            <code 
              className={`block text-sm font-mono ${className || ''}`}
              {...props}
            >
              {children}
            </code>
          </pre>
        </div>
      );
    },
    // Remove pre component since it's handled in code component
    pre: ({ children }) => <>{children}</>,
    // Style blockquotes
    blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
      <blockquote 
        className="border-l-4 border-gray-200 pl-4 italic my-4"
        {...props}
      >
        {children}
      </blockquote>
    ),
    // Style images
    img: ({ src, alt, ...props }: React.ComponentPropsWithoutRef<'img'>) => (
      <img 
        src={src} 
        alt={alt} 
        className="max-w-full h-auto rounded-lg my-4"
        {...props}
      />
    ),
    // Style lists
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mb-1">
        {children}
      </li>
    ),
    // Style tables
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 bg-gray-50 font-medium">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 border-t">
        {children}
      </td>
    ),
    // Add spacing between horizontal rules
    hr: () => (
      <hr className="my-8 border-t-2 border-gray-200" />
    ),
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
          components={markdownComponents}
        >
          {issue.body || 'No description provided.'}
        </ReactMarkdown>
      </div>
      
      {!hideMetadata && (
        <div className="mt-6 text-sm text-gray-500">
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