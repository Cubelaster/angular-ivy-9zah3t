export interface DisplayElement {
  localizationKey?: string;
  icon?: string;
  type?: 'primary' | 'warn' | 'default' | 'file' | 'menu';
  hidden?: boolean;
  disabled?: boolean;
}

export interface ActionButton extends DisplayElement {
  action?: string;
  url?: string;
  fileName?: string;
  actionMethod?: Function;
  isHiddenCallback?: (rowData?: any) => boolean;
  menu?: Array<ActionButton>;
}
