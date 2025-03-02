import jsPDF from 'jspdf';
import { Issue } from '../types';
import { marked } from 'marked';

// Convert markdown to plain text while preserving formatting
const markdownToPlainText = (markdown: string): string => {
  try {
    // Configure marked for better formatting
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // Remove HTML tags that might be in the markdown
    const cleanMarkdown = markdown.replace(/<[^>]*>/g, '');
    
    // Parse markdown to HTML
    const html = marked.parse(cleanMarkdown) as string;
    
    // Convert HTML to plain text while preserving structure
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '• ')  // Add bullet points for list items
      .replace(/<hr\s*\/?>/gi, '\n---\n')  // Handle horizontal rules
      .replace(/<strong>(.*?)<\/strong>/gi, '$1')  // Keep text from strong tags
      .replace(/<em>(.*?)<\/em>/gi, '$1')  // Keep text from em tags
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')  // Preserve inline code
      .replace(/<pre><code>(.*?)<\/code><\/pre>/gis, '\n$1\n')  // Handle code blocks
      .replace(/<[^>]*>/g, '')  // Remove remaining HTML tags
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove extra blank lines
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Handle bold text
      .replace(/\*(.*?)\*/g, '$1')  // Handle italic text
      .replace(/`([^`]+)`/g, '$1')  // Handle inline code
      .replace(/^\s*[-*+]\s+/gm, '• ')  // Handle list items
      .replace(/^\s*\d+\.\s+/gm, '• ')  // Handle numbered lists
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')  // Handle links
      .trim();
  } catch (error) {
    console.error('Error converting markdown to plain text:', error);
    return markdown; // Return original text if conversion fails
  }
};

const addIssueToPdf = (pdf: jsPDF, issue: Issue, hideMetadata: boolean, isNewPage: boolean = false) => {
  try {
    if (isNewPage) {
      pdf.addPage();
    }

    const margin = 20; // mm
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = margin;
    const lineHeight = 7; // mm
    const maxWidth = pageWidth - (2 * margin);

    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const title = `#${issue.number}: ${issue.title}`;
    const titleLines = pdf.splitTextToSize(title, maxWidth);
    pdf.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * lineHeight) + 5;

    // Add metadata if not hidden
    if (!hideMetadata) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const openedBy = `Opened by ${issue.user.login} on ${new Date(issue.created_at).toLocaleDateString()}`;
      pdf.text(openedBy, margin, yPosition);
      yPosition += lineHeight;

      // Add labels
      if (issue.labels.length > 0) {
        yPosition += 3;
        const labels = issue.labels.map(label => label.name).join(', ');
        const labelLines = pdf.splitTextToSize(`Labels: ${labels}`, maxWidth);
        pdf.text(labelLines, margin, yPosition);
        yPosition += (labelLines.length * lineHeight) + 3;
      }

      // Add state and last updated
      const status = `Status: ${issue.state.charAt(0).toUpperCase() + issue.state.slice(1)}`;
      const lastUpdated = `Last updated: ${new Date(issue.updated_at).toLocaleDateString()}`;
      pdf.text([status, lastUpdated], margin, yPosition);
      yPosition += lineHeight * 2;
    }

    // Add body
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');  // Explicitly set normal font weight for body
    const body = issue.body ? markdownToPlainText(issue.body) : 'No description provided.';
    
    // Split body into paragraphs and handle each paragraph
    const paragraphs = body.split('\n\n');
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        // Check if we need a new page
        if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
          pdf.setFont('helvetica', 'normal');  // Reset font after new page
        }

        // Handle code blocks
        if (paragraph.startsWith('    ') || paragraph.startsWith('\t') || /^```[\s\S]*```$/.test(paragraph)) {
          // Remove code block markers
          const code = paragraph.replace(/^```(\w+)?\n?/, '').replace(/```$/, '');
          
          pdf.setFont('courier', 'normal');
          const lines = pdf.splitTextToSize(code.trim(), maxWidth - 10);
          
          // Add light gray background for code blocks
          const blockHeight = lines.length * lineHeight;
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin - 2, yPosition - 2, maxWidth + 4, blockHeight + 4, 'F');
          
          // Add code text
          pdf.text(lines, margin + 5, yPosition);
          yPosition += blockHeight + 6;
          pdf.setFont('helvetica', 'normal');
        }
        // Handle bullet points
        else if (paragraph.startsWith('• ')) {
          const lines = pdf.splitTextToSize(paragraph, maxWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += (lines.length * lineHeight) + 3;
        }
        // Handle horizontal rules
        else if (paragraph === '---') {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += lineHeight;
        }
        // Regular paragraph
        else {
          const lines = pdf.splitTextToSize(paragraph.trim(), maxWidth);
          pdf.text(lines, margin, yPosition);
          yPosition += (lines.length * lineHeight) + 3;
        }
      }
    });

    return yPosition;
  } catch (error) {
    console.error('Error adding issue to PDF:', error);
    throw error;
  }
};

export const generateSingleIssuePDF = async (
  _element: HTMLDivElement, 
  issue: Issue,
  hideMetadata: boolean
): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    addIssueToPdf(pdf, issue, hideMetadata);
    pdf.save(`issue-${issue.number}-${issue.title.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.pdf`);
  } catch (error) {
    console.error('Error generating single issue PDF:', error);
    throw error;
  }
};

export const generateAllIssuesPDF = async (
  _elements: HTMLDivElement[],
  issues: Issue[],
  hideMetadata: boolean,
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (!issues.length) {
    throw new Error('No issues to generate PDF from');
  }

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < issues.length; i++) {
      try {
        addIssueToPdf(pdf, issues[i], hideMetadata, i > 0);

        if (onProgress) {
          onProgress(i + 1);
        }
      } catch (error) {
        console.error(`Error processing issue ${i + 1}:`, error);
        // Continue with next issue
      }
    }

    const date = new Date().toISOString().split('T')[0];
    pdf.save(`github-issues-${date}.pdf`);
  } catch (error) {
    console.error('Error generating combined PDF:', error);
    throw error;
  }
};