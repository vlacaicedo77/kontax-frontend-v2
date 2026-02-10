import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  { label: 'Dashboard', route: '/app/dashboard' },

  {
    label: 'Ventas',
    children: [
      { label: 'Nueva venta', route: '/app/ventas/nueva' },
      { label: 'Listado', route: '/app/ventas/listado' },
    ],
  },

  {
    label: 'Compras',
    children: [
      { label: 'Nueva compra', route: '/app/compras/nueva' },
      { label: 'Proveedores', route: '/app/compras/proveedores' },
    ],
  },

  {
    label: 'Reportes',
    children: [
      { label: 'Ventas', route: '/app/reportes/ventas' },
      { label: 'Compras', route: '/app/reportes/compras' },
    ],
  },
];
