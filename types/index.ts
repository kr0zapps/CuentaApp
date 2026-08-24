

export interface Compra {
  id: string;
  fecha: string; // ISO string
  categoria: string;
  proveedor: string;
  monto: number; // CLP entero
}

export interface Venta {
  id: string;
  fecha: string;
  productoId?: string; // Link a la producción original
  producto: string;
  cantidad: number;
  precioUnitario: number; // CLP entero
  cliente: string;
  total: number; // CLP entero
}

export interface ItemProduccion {
  id: string;
  fecha: string;
  producto: string;
  cantidad: number;
  precioVenta?: number; // CLP entero, precio por defecto de venta
  enStock: boolean;
}
