const fs = require('fs');

let tContent = fs.readFileSync('src/i18n/translations.ts', 'utf8');

if (!tContent.includes("adminPanel:")) {
  tContent = tContent.replace("errorProcessing: 'Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.',", "errorProcessing: 'Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.',\n    adminPanel: 'Panel de Administración',\n    reservations: 'Reservas',\n    settings: 'Ajustes',\n    price: 'Precio',\n    payment: 'Pago',\n    passengersTab: 'Pasajeros',\n    approveAndNotify: 'Aprobar y Avisar',\n    cancelAndNotify: 'Cancelar y Avisar',\n    goBack: 'Volver',");
  tContent = tContent.replace("errorProcessing: 'There was an error processing your request. Please try again.',", "errorProcessing: 'There was an error processing your request. Please try again.',\n    adminPanel: 'Admin Panel',\n    reservations: 'Reservations',\n    settings: 'Settings',\n    price: 'Price',\n    payment: 'Payment',\n    passengersTab: 'Passengers',\n    approveAndNotify: 'Approve & Notify',\n    cancelAndNotify: 'Cancel & Notify',\n    goBack: 'Go Back',");
  fs.writeFileSync('src/i18n/translations.ts', tContent);
}

let aContent = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
if (!aContent.includes('useLanguage')) {
  aContent = aContent.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useLanguage } from '../contexts/LanguageContext';");
  aContent = aContent.replace("export default function AdminPanel({ onClose }: { onClose: () => void }) {", "export default function AdminPanel({ onClose }: { onClose: () => void }) {\n  const { t } = useLanguage();");
  
  aContent = aContent.replace(/>Panel de Administración</g, '>{t("adminPanel")}<');
  aContent = aContent.replace(/>Reservas</g, '>{t("reservations")}<');
  aContent = aContent.replace(/>Ajustes</g, '>{t("settings")}<');
  aContent = aContent.replace(/>Precio:</g, '>{t("price")}:<');
  aContent = aContent.replace(/>Pago:</g, '>{t("payment")}:<');
  aContent = aContent.replace(/>Pasajeros:</g, '>{t("passengersTab")}:<');
  aContent = aContent.replace(/> Aprobar y Avisar</g, '> {t("approveAndNotify")}<');
  aContent = aContent.replace(/> Cancelar y Avisar</g, '> {t("cancelAndNotify")}<');
  aContent = aContent.replace(/>\s*Volver\s*</g, '>{t("goBack")}<');
  
  fs.writeFileSync('src/components/AdminPanel.tsx', aContent);
  console.log('AdminPanel translated');
}
