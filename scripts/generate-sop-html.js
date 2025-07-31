const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// HTML template for SOPs with Judge.ca branding
const getHTMLTemplate = (title, content, sopNumber, version) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Judge.ca SOP</title>
    <style>
        :root {
            --quebec-blue: #003f88;
            --trust-blue: #1e40af;
            --professional-gray: #374151;
            --warm-gray: #6b7280;
            --light-gray: #f9fafb;
            --success: #059669;
            --warning: #f59e0b;
            --error: #dc2626;
            --background: #ffffff;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--professional-gray);
            background-color: var(--background);
            font-size: 14px;
        }

        .container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            background: white;
            min-height: 11in;
        }

        .header {
            border-bottom: 3px solid var(--quebec-blue);
            padding-bottom: 1rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo-section {
            display: flex;
            align-items: center;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: var(--quebec-blue);
            margin-right: 1rem;
        }

        .company-info {
            font-size: 12px;
            color: var(--warm-gray);
        }

        .document-info {
            text-align: right;
            font-size: 12px;
            color: var(--warm-gray);
        }

        .document-title {
            background: linear-gradient(135deg, var(--quebec-blue), var(--trust-blue));
            color: white;
            padding: 1.5rem;
            margin: -1rem -1rem 2rem -1rem;
            text-align: center;
        }

        .document-title h1 {
            font-size: 28px;
            margin-bottom: 0.5rem;
        }

        .document-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }

        .metadata {
            background: var(--light-gray);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .metadata-item {
            display: flex;
            flex-direction: column;
        }

        .metadata-label {
            font-weight: 600;
            color: var(--quebec-blue);
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
        }

        .metadata-value {
            font-size: 14px;
            color: var(--professional-gray);
        }

        .content {
            margin-bottom: 2rem;
        }

        h1, h2, h3, h4, h5, h6 {
            color: var(--quebec-blue);
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }

        h1 { font-size: 24px; }
        h2 { font-size: 20px; }
        h3 { font-size: 18px; }
        h4 { font-size: 16px; }
        h5 { font-size: 14px; }
        h6 { font-size: 12px; }

        p {
            margin-bottom: 1rem;
            text-align: justify;
        }

        ul, ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
        }

        li {
            margin-bottom: 0.5rem;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
            font-size: 12px;
        }

        th, td {
            border: 1px solid var(--warm-gray);
            padding: 0.75rem;
            text-align: left;
        }

        th {
            background: var(--quebec-blue);
            color: white;
            font-weight: 600;
        }

        tr:nth-child(even) {
            background: var(--light-gray);
        }

        .alert {
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            border-left: 4px solid;
        }

        .alert-info {
            background: #dbeafe;
            border-color: var(--trust-blue);
            color: #1e40af;
        }

        .alert-warning {
            background: #fef3c7;
            border-color: var(--warning);
            color: #92400e;
        }

        .alert-error {
            background: #fee2e2;
            border-color: var(--error);
            color: #991b1b;
        }

        .alert-success {
            background: #d1fae5;
            border-color: var(--success);
            color: #065f46;
        }

        blockquote {
            border-left: 4px solid var(--quebec-blue);
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            color: var(--warm-gray);
        }

        code {
            background: var(--light-gray);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 12px;
        }

        pre {
            background: var(--light-gray);
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            margin-bottom: 1rem;
        }

        .footer {
            border-top: 1px solid var(--warm-gray);
            padding-top: 1rem;
            margin-top: 3rem;
            font-size: 11px;
            color: var(--warm-gray);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-left {
            display: flex;
            flex-direction: column;
        }

        .footer-right {
            text-align: right;
        }

        .page-break {
            page-break-before: always;
        }

        .no-break {
            page-break-inside: avoid;
        }

        /* Print styles */
        @media print {
            .container {
                padding: 0.5in;
                margin: 0;
                max-width: none;
            }
            
            .document-title {
                margin: -0.5in -0.5in 1rem -0.5in;
            }
            
            body {
                font-size: 12px;
            }
            
            .no-print {
                display: none;
            }
        }

        /* PDF download button */
        .download-section {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }

        .btn-download {
            background: var(--quebec-blue);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 6px rgba(0, 63, 136, 0.1);
            transition: all 0.2s;
        }

        .btn-download:hover {
            background: #002f66;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 63, 136, 0.2);
        }

        @media print {
            .download-section {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="download-section no-print">
        <button class="btn-download" onclick="downloadPDF()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            Download PDF
        </button>
    </div>

    <div class="container">
        <div class="header">
            <div class="logo-section">
                <div class="logo">Judge.ca</div>
                <div class="company-info">
                    Professional Legal Services Platform<br>
                    Quebec, Canada
                </div>
            </div>
            <div class="document-info">
                SOP-${sopNumber}<br>
                Version ${version}<br>
                ${new Date().toLocaleDateString()}
            </div>
        </div>

        <div class="document-title">
            <h1>${title}</h1>
            <div class="document-subtitle">Standard Operating Procedure</div>
        </div>

        <div class="content">
            ${content}
        </div>

        <div class="footer">
            <div class="footer-left">
                <div><strong>Judge.ca Inc.</strong></div>
                <div>123 St-Jacques Street, Montreal, QC H2Y 1L6</div>
                <div>Phone: 1-514-555-0123 | Email: info@judge.ca</div>
            </div>
            <div class="footer-right">
                <div><strong>Confidential Document</strong></div>
                <div>Internal Use Only</div>
                <div>© 2024 Judge.ca Inc.</div>
            </div>
        </div>
    </div>

    <script>
        function downloadPDF() {
            // Hide download button and trigger print dialog
            const downloadSection = document.querySelector('.download-section');
            downloadSection.style.display = 'none';
            
            // Add print-specific styles
            document.body.classList.add('printing');
            
            // Trigger print dialog
            window.print();
            
            // Restore download button after print dialog closes
            setTimeout(() => {
                downloadSection.style.display = 'block';
                document.body.classList.remove('printing');
            }, 100);
        }

        // Handle keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl+P or Cmd+P for PDF download
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                downloadPDF();
            }
        });

        // Add table of contents generation
        document.addEventListener('DOMContentLoaded', function() {
            generateTableOfContents();
        });

        function generateTableOfContents() {
            const headings = document.querySelectorAll('h2, h3, h4');
            if (headings.length === 0) return;

            const toc = document.createElement('div');
            toc.className = 'table-of-contents';
            toc.innerHTML = '<h2>Table of Contents</h2>';

            const tocList = document.createElement('ol');
            tocList.style.listStyle = 'decimal';
            tocList.style.paddingLeft = '1.5rem';

            headings.forEach((heading, index) => {
                // Create anchor
                const anchor = 'section-' + index;
                heading.id = anchor;

                // Create TOC entry
                const listItem = document.createElement('li');
                listItem.style.marginBottom = '0.5rem';
                
                const link = document.createElement('a');
                link.href = '#' + anchor;
                link.textContent = heading.textContent;
                link.style.textDecoration = 'none';
                link.style.color = 'var(--quebec-blue)';
                
                // Add indentation for h3, h4
                if (heading.tagName === 'H3') {
                    listItem.style.marginLeft = '1rem';
                } else if (heading.tagName === 'H4') {
                    listItem.style.marginLeft = '2rem';
                }
                
                listItem.appendChild(link);
                tocList.appendChild(listItem);
            });

            toc.appendChild(tocList);
            
            // Insert TOC after metadata
            const metadata = document.querySelector('.metadata');
            if (metadata) {
                metadata.parentNode.insertBefore(toc, metadata.nextSibling);
            }
        }
    </script>
</body>
</html>
`;

// Function to extract metadata from markdown content
function extractMetadata(content) {
    const lines = content.split('\n');
    const metadata = {};
    
    for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i].trim();
        if (line.startsWith('**Version:**')) {
            metadata.version = line.replace('**Version:**', '').trim();
        } else if (line.startsWith('**Effective Date:**')) {
            metadata.effectiveDate = line.replace('**Effective Date:**', '').trim();
        } else if (line.startsWith('**Review Date:**')) {
            metadata.reviewDate = line.replace('**Review Date:**', '').trim();
        } else if (line.startsWith('**Department:**')) {
            metadata.department = line.replace('**Department:**', '').trim();
        } else if (line.startsWith('**Owner:**')) {
            metadata.owner = line.replace('**Owner:**', '').trim();
        }
    }
    
    return metadata;
}

// Function to extract SOP number from filename
function extractSOPNumber(filename) {
    const match = filename.match(/(\d{3})/);
    return match ? match[1] : '000';
}

// Function to extract title from markdown content
function extractTitle(content) {
    const match = content.match(/^# (.+)/m);
    return match ? match[1] : 'Standard Operating Procedure';
}

// Function to generate metadata HTML
function generateMetadataHTML(metadata) {
    return `
        <div class="metadata">
            <div class="metadata-item">
                <div class="metadata-label">Version</div>
                <div class="metadata-value">${metadata.version || 'N/A'}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Effective Date</div>
                <div class="metadata-value">${metadata.effectiveDate || 'N/A'}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Review Date</div>
                <div class="metadata-value">${metadata.reviewDate || 'N/A'}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Department</div>
                <div class="metadata-value">${metadata.department || 'N/A'}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Owner</div>
                <div class="metadata-value">${metadata.owner || 'N/A'}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Generated</div>
                <div class="metadata-value">${new Date().toLocaleDateString()}</div>
            </div>
        </div>
    `;
}

// Custom marked renderer for Judge.ca styling
function createCustomRenderer() {
    const renderer = new marked.Renderer();
    
    // Custom heading renderer with Quebec blue styling
    renderer.heading = function(text, level, raw) {
        const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h${level} id="${escapedText}">${text}</h${level}>`;
    };
    
    // Custom table renderer with Judge.ca styling
    renderer.table = function(header, body) {
        return `<table class="sop-table">
            <thead>${header}</thead>
            <tbody>${body}</tbody>
        </table>`;
    };
    
    // Custom blockquote for alerts
    renderer.blockquote = function(quote) {
        if (quote.includes('**Important:**') || quote.includes('**NOTE:**')) {
            return `<div class="alert alert-info">${quote}</div>`;
        } else if (quote.includes('**WARNING:**') || quote.includes('**CAUTION:**')) {
            return `<div class="alert alert-warning">${quote}</div>`;
        } else if (quote.includes('**CRITICAL:**') || quote.includes('**DANGER:**')) {
            return `<div class="alert alert-error">${quote}</div>`;
        } else if (quote.includes('**SUCCESS:**') || quote.includes('**APPROVED:**')) {
            return `<div class="alert alert-success">${quote}</div>`;
        }
        return `<blockquote>${quote}</blockquote>`;
    };
    
    return renderer;
}

// Main conversion function
function convertMarkdownToHTML(markdownPath, outputPath) {
    try {
        console.log(`Converting: ${markdownPath}`);
        
        // Read markdown file
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        // Extract metadata
        const metadata = extractMetadata(markdownContent);
        const title = extractTitle(markdownContent);
        const sopNumber = extractSOPNumber(path.basename(markdownPath));
        
        // Configure marked
        marked.setOptions({
            renderer: createCustomRenderer(),
            highlight: function(code, lang) {
                return code; // No syntax highlighting for SOPs
            },
            pedantic: false,
            gfm: true,
            breaks: false,
            sanitize: false,
            smartLists: true,
            smartypants: false
        });
        
        // Convert markdown to HTML
        let htmlContent = marked(markdownContent);
        
        // Add metadata section
        const metadataHTML = generateMetadataHTML(metadata);
        htmlContent = metadataHTML + htmlContent;
        
        // Generate complete HTML document
        const fullHTML = getHTMLTemplate(
            title,
            htmlContent,
            sopNumber,
            metadata.version || '1.0'
        );
        
        // Write HTML file
        fs.writeFileSync(outputPath, fullHTML, 'utf8');
        console.log(`Generated: ${outputPath}`);
        
        return true;
    } catch (error) {
        console.error(`Error converting ${markdownPath}:`, error.message);
        return false;
    }
}

// Function to convert all SOPs
function convertAllSOPs() {
    const markdownDir = path.join(__dirname, '../documentation/sops/markdown');
    const htmlDir = path.join(__dirname, '../documentation/sops/html');
    
    // Create HTML directory if it doesn't exist
    if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir, { recursive: true });
    }
    
    // Get all markdown files
    const markdownFiles = fs.readdirSync(markdownDir)
        .filter(file => file.endsWith('.md'))
        .sort();
    
    console.log(`Found ${markdownFiles.length} SOP files to convert`);
    
    let successCount = 0;
    let errorCount = 0;
    
    markdownFiles.forEach(filename => {
        const markdownPath = path.join(markdownDir, filename);
        const htmlFilename = filename.replace('.md', '.html');
        const htmlPath = path.join(htmlDir, htmlFilename);
        
        if (convertMarkdownToHTML(markdownPath, htmlPath)) {
            successCount++;
        } else {
            errorCount++;
        }
    });
    
    console.log(`\nConversion complete:`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  HTML files saved to: ${htmlDir}`);
    
    // Generate index file
    generateSOPIndex(htmlDir, markdownFiles);
}

// Function to generate SOP index page
function generateSOPIndex(htmlDir, sopFiles) {
    const indexContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Judge.ca Standard Operating Procedures</title>
        <style>
            ${getIndexStyles()}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Judge.ca Standard Operating Procedures</h1>
                <p>Complete collection of operational procedures and guidelines</p>
            </div>
            
            <div class="sop-list">
                ${sopFiles.map(filename => {
                    const htmlFilename = filename.replace('.md', '.html');
                    const sopNumber = extractSOPNumber(filename);
                    const title = filename.replace('.md', '').replace(/^\d{3}-/, '').replace(/-/g, ' ');
                    
                    return `
                    <div class="sop-item">
                        <div class="sop-number">SOP-${sopNumber}</div>
                        <div class="sop-content">
                            <h3><a href="${htmlFilename}">${title}</a></h3>
                            <div class="sop-actions">
                                <a href="${htmlFilename}" class="btn btn-view">View HTML</a>
                                <a href="${htmlFilename}" onclick="printPDF(event, '${htmlFilename}')" class="btn btn-pdf">Download PDF</a>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            
            <div class="footer">
                <p>&copy; 2024 Judge.ca Inc. - Internal Use Only</p>
            </div>
        </div>
        
        <script>
            function printPDF(event, filename) {
                event.preventDefault();
                const link = document.createElement('a');
                link.href = filename;
                link.target = '_blank';
                link.click();
                
                setTimeout(() => {
                    window.open('', '_blank').print();
                }, 500);
            }
        </script>
    </body>
    </html>
    `;
    
    fs.writeFileSync(path.join(htmlDir, 'index.html'), indexContent);
    console.log('Generated SOP index at: index.html');
}

function getIndexStyles() {
    return `
        :root {
            --quebec-blue: #003f88;
            --trust-blue: #1e40af;
            --professional-gray: #374151;
            --warm-gray: #6b7280;
            --light-gray: #f9fafb;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            background: var(--light-gray);
            color: var(--professional-gray);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 63, 136, 0.1);
        }
        
        .header h1 {
            color: var(--quebec-blue);
            margin-bottom: 1rem;
            font-size: 2.5rem;
        }
        
        .sop-list {
            display: grid;
            gap: 1rem;
        }
        
        .sop-item {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 63, 136, 0.05);
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }
        
        .sop-number {
            background: var(--quebec-blue);
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            min-width: 80px;
            text-align: center;
        }
        
        .sop-content {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .sop-content h3 {
            margin: 0;
            text-transform: capitalize;
        }
        
        .sop-content a {
            color: var(--quebec-blue);
            text-decoration: none;
        }
        
        .sop-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .btn-view {
            background: var(--trust-blue);
            color: white;
        }
        
        .btn-pdf {
            background: var(--warm-gray);
            color: white;
        }
        
        .footer {
            text-align: center;
            margin-top: 3rem;
            color: var(--warm-gray);
        }
    `;
}

// Export functions for use in other scripts
module.exports = {
    convertMarkdownToHTML,
    convertAllSOPs,
    extractMetadata,
    extractSOPNumber,
    extractTitle
};

// Run conversion if script is called directly
if (require.main === module) {
    convertAllSOPs();
}