const fs = require('fs');
const path = require('path');

// List of pages that need to be updated
const pages = [
  'CustomersPage.jsx',
  'ProductBatchesPage.jsx', 
  'UsersPage.jsx',
  'RolesPage.jsx',
  'ProductSuppliersPage.jsx',
  'PurchasesPage.jsx',
  'StockAdjustmentsPage.jsx',
  'StockLevelsPage.jsx',
  'SalesPOSPage.jsx',
  'SalesTransactionsPage.jsx',
  'PurchaseItemsPage.jsx'
];

const pagesDir = path.join(__dirname, 'src', 'pages');

pages.forEach(pageName => {
  const filePath = path.join(pagesDir, pageName);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import for useAutoCloseError
    if (!content.includes('useAutoCloseError')) {
      content = content.replace(
        /import ErrorDisplay from '\.\.\/components\/ErrorDisplay'/,
        "import ErrorDisplay from '../components/ErrorDisplay'\nimport { useAutoCloseError } from '../utils/useAutoCloseMessage'"
      );
    }
    
    // Replace error state declaration
    content = content.replace(
      /const \[error, setError\] = useState\(null\)/,
      'const { error, setError, clearError } = useAutoCloseError()'
    );
    
    // Replace setError(null) calls
    content = content.replace(/setError\(null\)/g, 'clearError()');
    
    // Replace onDismiss handlers
    content = content.replace(
      /onDismiss=\{\(\) => setError\(null\)\}/g,
      'onDismiss={clearError}'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${pageName}`);
  } else {
    console.log(`File not found: ${pageName}`);
  }
});

console.log('All pages updated!');
