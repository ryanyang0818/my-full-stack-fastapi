INSERT INTO menu (key, label, path, parent_id, sort_order, icon)
VALUES
  ('dashboard', '儀表板', '/dashboard', NULL, 1, 'layout-dashboard'),
  ('sales', '銷售管理', NULL, NULL, 2, 'shopping-cart'),
  ('purchase', '採購管理', NULL, NULL, 3, 'package-check'),
  ('inventory', '庫存管理', NULL, NULL, 4, 'warehouse'),
  ('finance', '財務管理', NULL, NULL, 5, 'wallet'),
  ('hr', '人資管理', NULL, NULL, 6, 'users'),
  ('system', '系統管理', NULL, NULL, 7, 'settings')
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon,
  is_active = TRUE,
  is_visible = TRUE;

WITH menu_seed(key, label, path, parent_key, sort_order, icon) AS (
  VALUES
    ('sales.customers', '客戶資料', '/sales/customers', 'sales', 1, 'building'),
    ('sales.quotations', '報價單', '/sales/quotations', 'sales', 2, 'file-text'),
    ('sales.orders', '銷售訂單', '/sales/orders', 'sales', 3, 'clipboard-list'),
    ('sales.shipments', '出貨單', '/sales/shipments', 'sales', 4, 'truck'),
    ('sales.returns', '銷售退貨', '/sales/returns', 'sales', 5, 'undo-2'),
    ('purchase.suppliers', '供應商資料', '/purchase/suppliers', 'purchase', 1, 'factory'),
    ('purchase.requests', '採購請購', '/purchase/requests', 'purchase', 2, 'file-plus'),
    ('purchase.orders', '採購訂單', '/purchase/orders', 'purchase', 3, 'shopping-bag'),
    ('purchase.receipts', '進貨驗收', '/purchase/receipts', 'purchase', 4, 'clipboard-check'),
    ('purchase.returns', '採購退貨', '/purchase/returns', 'purchase', 5, 'rotate-ccw'),
    ('inventory.products', '商品資料', '/inventory/products', 'inventory', 1, 'box'),
    ('inventory.warehouses', '倉庫管理', '/inventory/warehouses', 'inventory', 2, 'warehouse'),
    ('inventory.stock', '庫存查詢', '/inventory/stock', 'inventory', 3, 'search'),
    ('inventory.adjustments', '庫存異動', '/inventory/adjustments', 'inventory', 4, 'repeat'),
    ('inventory.counting', '盤點作業', '/inventory/counting', 'inventory', 5, 'clipboard-check'),
    ('finance.receivables', '應收帳款', '/finance/receivables', 'finance', 1, 'receipt'),
    ('finance.payables', '應付帳款', '/finance/payables', 'finance', 2, 'receipt-text'),
    ('finance.invoices', '發票管理', '/finance/invoices', 'finance', 3, 'file-badge'),
    ('finance.payments', '收付款紀錄', '/finance/payments', 'finance', 4, 'banknote'),
    ('hr.employees', '員工資料', '/hr/employees', 'hr', 1, 'user'),
    ('hr.departments', '部門管理', '/hr/departments', 'hr', 2, 'network'),
    ('hr.attendance', '出勤紀錄', '/hr/attendance', 'hr', 3, 'calendar-check'),
    ('hr.payroll', '薪資作業', '/hr/payroll', 'hr', 4, 'badge-dollar-sign'),
    ('system.users', '使用者管理', '/system/users', 'system', 1, 'user-cog'),
    ('system.roles', '角色管理', '/system/roles', 'system', 2, 'shield-check'),
    ('system.menus', '選單管理', '/system/menus', 'system', 3, 'menu'),
    ('system.permissions', '權限設定', '/system/permissions', 'system', 4, 'key-round')
)
INSERT INTO menu (key, label, path, parent_id, sort_order, icon)
SELECT
  seed.key,
  seed.label,
  seed.path,
  parent.id,
  seed.sort_order,
  seed.icon
FROM menu_seed seed
JOIN menu parent ON parent.key = seed.parent_key
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon,
  is_active = TRUE,
  is_visible = TRUE;
