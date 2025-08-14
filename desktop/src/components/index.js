// =====================================
// EXPORT CENTRALISÉ DES COMPOSANTS
// =====================================

// Composants d'authentification
export { default as LoginForm } from './auth/LoginForm';

// Composants de layout
export { default as Header } from './layout/Header';
export { default as Sidebar } from './layout/Sidebar';

// Composants du tableau de bord
export { default as Dashboard } from './dashboard/Dashboard';

// Composants des produits
export { default as ProductsTable } from './products/ProductsTable';
export { default as StockInTable } from './stock/StockInTable';
export { default as StockOutTable } from './stock/StockOutTable';
export { default as ProductDialog } from './products/ProductDialog';
export { default as EntryDialog } from './products/EntryDialog';
export { default as ExitDialog } from './products/ExitDialog';
export { default as MovementsTable } from './movements/MovementsTable';

// Composants communs
export { default as StockCard } from './common/StockCard';
