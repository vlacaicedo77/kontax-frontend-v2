export interface MenuItem {
  label: string;
  route?: string;      // si es item final
  icon?: string;       // placeholder (después ponemos FontAwesome o SVG)
  children?: MenuItem[];
}
