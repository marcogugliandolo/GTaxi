import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, FileText, Download, Printer } from 'lucide-react';
import { BookingData } from '../types';

interface InvoiceModalProps {
  booking: BookingData;
  onClose: () => void;
}

export default function InvoiceModal({ booking, onClose }: InvoiceModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(`FAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState(booking.name || '');
  const [clientNif, setClientNif] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  const [companyName, setCompanyName] = useState('GTaxi S.L.');
  const [companyNif, setCompanyNif] = useState('B-12345678');
  const [companyAddress, setCompanyAddress] = useState('Calle Principal 123, 28001 Madrid');
  
  const [price, setPrice] = useState(booking.price ? booking.price.toString() : '0');
  const [taxRate, setTaxRate] = useState('10'); // 10% is typical for passenger transport in Spain
  
  const handleGeneratePDF = async (action: 'download' | 'print') => {
    const doc = new jsPDF();
    
    // Add Logo
    try {
      const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="128" height="128"><rect width="32" height="32" rx="8" fill="#FFD700" /><g transform="translate(4,4)" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.64 5H8.4a2 2 0 0 0-1.82 1.3L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/></g></svg>`;
      const imgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
      
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, 128, 128);
        const logoData = canvas.toDataURL('image/png');
        doc.addImage(logoData, 'PNG', 14, 14, 12, 12);
      }
    } catch (err) {
      console.warn("Could not load logo", err);
      doc.setFillColor(255, 215, 0);
      doc.roundedRect(14, 14, 12, 12, 2, 2, 'F');
    }
    
    // Header text
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('GTaxi', 30, 23);
    
    doc.setFontSize(20);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('helvetica', 'normal');
    doc.text('FACTURA', 160, 23);
    
    // Company Info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(companyName, 14, 38);
    doc.text(`NIF: ${companyNif}`, 14, 44);
    doc.text(companyAddress, 14, 50);
    
    // Invoice details
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Factura Nº: ${invoiceNumber}`, 130, 38);
    doc.text(`Fecha: ${date}`, 130, 44);
    
    // Client Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Cliente:', 14, 66);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${clientName}`, 14, 74);
    doc.text(`NIF/DNI: ${clientNif || '---'}`, 14, 80);
    doc.text(`Dirección: ${clientAddress || '---'}`, 14, 86);
    
    const numPrice = parseFloat(price) || 0;
    const numTaxRate = parseFloat(taxRate) || 0;
    
    // Si numPrice es el TOTAL, calculamos la base imponible
    // Base Imponible = Total / (1 + (IVA/100))
    const base = numPrice / (1 + (numTaxRate / 100));
    const iva = numPrice - base;
    
    // Table
    autoTable(doc, {
      startY: 100,
      head: [['Concepto', 'Base Imponible', `IVA (${taxRate}%)`, 'Total']],
      body: [
        [
          `Servicio de Transporte (${booking.pickup} a ${booking.dropoff})\nFecha del viaje: ${booking.date} ${booking.time}`, 
          `€${base.toFixed(2)}`, 
          `€${iva.toFixed(2)}`, 
          `€${numPrice.toFixed(2)}`
        ]
      ],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { cellPadding: 6, fontSize: 10, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      },
      margin: { top: 95 }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Totals
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Base Imponible: €${base.toFixed(2)}`, 130, finalY);
    doc.text(`Cuota IVA (${taxRate}%): €${iva.toFixed(2)}`, 130, finalY + 8);
    
    doc.setFontSize(14);
    doc.text(`TOTAL: €${numPrice.toFixed(2)}`, 130, finalY + 18);
    
    if (action === 'download') {
      doc.save(`Factura_${invoiceNumber}.pdf`);
    } else {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">Generar Factura</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Completar datos para emisión</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors shadow-sm">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Datos Factura</h4>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nº de Factura</label>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha de Emisión</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total (€)</label>
                  <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">IVA (%)</label>
                  <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Datos del Cliente</h4>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nombre / Razón Social</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">DNI / NIF / NIE</label>
                <input type="text" value={clientNif} onChange={e => setClientNif(e.target.value)} placeholder="Ej. 12345678Z" className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Dirección (Opcional)</label>
                <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-2 space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Tus Datos Fiscales (GTaxi)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nombre Fiscal</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">NIF Empresa</label>
                  <input type="text" value={companyNif} onChange={e => setCompanyNif(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Dirección Fiscal</label>
                  <input type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:border-blue-500 outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3">
          <button 
            onClick={() => handleGeneratePDF('print')}
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex justify-center items-center gap-2"
          >
            <Printer className="w-5 h-5" /> <span className="hidden sm:inline">Imprimir PDF</span><span className="sm:hidden">Imprimir</span>
          </button>
          <button 
            onClick={() => handleGeneratePDF('download')}
            className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 shadow-sm shadow-blue-500/20"
          >
            <Download className="w-5 h-5" /> <span className="hidden sm:inline">Descargar Factura</span><span className="sm:hidden">Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
