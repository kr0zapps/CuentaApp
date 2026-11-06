import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Venta, Compra } from '@/types';

export interface ReporteMetrics {
  totalVentas: number;
  totalCompras: number;
  balance: number;
  margenPromedio: number;
  cantidadVentas: number;
  cantidadCompras: number;
  totalUnidades: number;
  ticketPromedio: number;
}

export async function exportarReporteExcel(
  ventas: Venta[],
  compras: Compra[],
  periodoNombre: string,
  metricas: ReporteMetrics
): Promise<{ success: boolean; message?: string }> {
  try {
    const wb = XLSX.utils.book_new();

    // 1. Hoja RESUMEN
    const resumenAoa: any[][] = [
      ['REPORTE FINANCIERO - CUENTAPP'],
      ['Período:', periodoNombre],
      ['Fecha de Emisión:', new Date().toLocaleString('es-CL')],
      [],
      ['INDICADOR', 'VALOR'],
      ['Total Ventas (Ingresos)', metricas.totalVentas],
      ['Total Gastos / Compras (Egresos)', metricas.totalCompras],
      ['Balance Neto (Ganancia / Pérdida)', metricas.balance],
      ['Margen de Ganancia', `${metricas.margenPromedio}%`],
      ['Ticket Promedio por Venta', metricas.ticketPromedio],
      ['Total Transacciones de Venta', metricas.cantidadVentas],
      ['Total Unidades de Productos Vendidos', metricas.totalUnidades],
      ['Total Transacciones de Gasto', metricas.cantidadCompras],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenAoa);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Financiero');

    // 2. Hoja VENTAS
    const ventasHeader = [
      'Fecha',
      'Hora',
      'Producto',
      'Cantidad',
      'Precio Unitario (CLP)',
      'Total Venta (CLP)',
      'Cliente'
    ];
    const ventasRows = ventas.map(v => {
      const d = new Date(v.fecha);
      const fecha = isNaN(d.getTime()) ? v.fecha : d.toLocaleDateString('es-CL');
      const hora = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      return [
        fecha,
        hora,
        v.producto || 'Sin producto',
        v.cantidad || 1,
        v.precioUnitario || 0,
        v.total || 0,
        v.cliente || 'Consumidor Final'
      ];
    });
    const wsVentas = XLSX.utils.aoa_to_sheet([ventasHeader, ...ventasRows]);
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');

    // 3. Hoja GASTOS Y COMPRAS
    const comprasHeader = [
      'Fecha',
      'Hora',
      'Categoría',
      'Proveedor / Detalle',
      'Monto (CLP)'
    ];
    const comprasRows = compras.map(c => {
      const d = new Date(c.fecha);
      const fecha = isNaN(d.getTime()) ? c.fecha : d.toLocaleDateString('es-CL');
      const hora = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      return [
        fecha,
        hora,
        c.categoria || 'Varios',
        c.proveedor || 'Sin especificar',
        c.monto || 0
      ];
    });
    const wsCompras = XLSX.utils.aoa_to_sheet([comprasHeader, ...comprasRows]);
    XLSX.utils.book_append_sheet(wb, wsCompras, 'Gastos y Compras');

    // 4. Hoja TOP PRODUCTOS
    const ventasPorProducto = ventas.reduce<Record<string, { cantidad: number; total: number }>>((acc, v) => {
      const nombre = v.producto || 'Sin producto';
      if (!acc[nombre]) acc[nombre] = { cantidad: 0, total: 0 };
      acc[nombre].cantidad += v.cantidad || 1;
      acc[nombre].total += v.total || 0;
      return acc;
    }, {});
    const productosRank = Object.entries(ventasPorProducto)
      .sort((a, b) => b[1].cantidad - a[1].cantidad)
      .map(([nombre, data], idx) => [
        idx + 1,
        nombre,
        data.cantidad,
        data.total
      ]);
    const wsTopProductos = XLSX.utils.aoa_to_sheet([
      ['Posición', 'Producto', 'Unidades Vendidas', 'Ingresos Totales (CLP)'],
      ...productosRank
    ]);
    XLSX.utils.book_append_sheet(wb, wsTopProductos, 'Top Productos');

    // 5. Hoja GASTOS POR CATEGORÍA
    const gastosPorCategoria = compras.reduce<Record<string, number>>((acc, c) => {
      const cat = c.categoria || 'Otros';
      acc[cat] = (acc[cat] || 0) + (c.monto || 0);
      return acc;
    }, {});
    const totalGastosSum = metricas.totalCompras || 1;
    const categoriasRank = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => [
        cat,
        total,
        `${((total / totalGastosSum) * 100).toFixed(1)}%`
      ]);
    const wsCategorias = XLSX.utils.aoa_to_sheet([
      ['Categoría', 'Total Gastado (CLP)', 'Porcentaje del Total'],
      ...categoriasRank
    ]);
    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorías de Gasto');

    // Generar Base64 del Workbook
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const cleanPeriodo = periodoNombre.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Reporte_CuentApp_${cleanPeriodo}.xlsx`;

    // WEB EXPORT
    if (Platform.OS === 'web') {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, message: 'Archivo descargado con éxito' };
    }

    // MOBILE EXPORT (Android / iOS)
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar Reporte a Excel',
        UTI: 'com.microsoft.excel.xlsx',
      });
      return { success: true };
    } else {
      return { success: true, message: `Reporte guardado en: ${fileUri}` };
    }
  } catch (error: any) {
    console.error('Error al exportar reporte Excel:', error);
    return { success: false, message: error?.message || 'Error desconocido al exportar' };
  }
}
