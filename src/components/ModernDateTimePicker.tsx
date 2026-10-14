import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ModernDateTimePickerProps {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export default function ModernDateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: ModernDateTimePickerProps) {
  const { language } = useLanguage();

  // Helper to format Date to YYYY-MM-DD
  const formatDateToISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format time HH:MM
  const formatTimeToISO = (d: Date): string => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper to get minimum allowed booking Date (current time + 1 hour margin, seconds zeroed)
  const getMinBookingDate = (): Date => {
    const now = new Date();
    now.setSeconds(0, 0);
    return new Date(now.getTime() + 60 * 60 * 1000);
  };

  const minBookingDate = getMinBookingDate();
  const minBookingDateISO = formatDateToISO(minBookingDate);
  const minBookingTimeISO = formatTimeToISO(minBookingDate);

  // Check if a given date (YYYY-MM-DD) + time (HH:MM) is earlier than now + 1 hour
  const isTimeBeforeMargin = (targetDateStr: string, targetTimeStr: string): boolean => {
    if (!targetTimeStr) return false;
    const effectiveDateStr = targetDateStr || formatDateToISO(new Date());
    const [y, m, d] = effectiveDateStr.split('-').map(Number);
    const [hh, mm] = targetTimeStr.split(':').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(hh) || isNaN(mm)) return false;
    const candidate = new Date(y, m - 1, d, hh, mm, 0, 0);
    return candidate.getTime() < getMinBookingDate().getTime();
  };

  const isCurrentSelectionInvalid = Boolean(date && time && isTimeBeforeMargin(date, time));

  // Parse current date or fallback to today
  const parsedDate = date ? new Date(date + 'T00:00:00') : new Date();
  const validParsedDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  // View month state
  const [viewDate, setViewDate] = useState<Date>(
    new Date(validParsedDate.getFullYear(), validParsedDate.getMonth(), 1)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Month navigation
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelection = (selectedDateISO: string) => {
    onDateChange(selectedDateISO);
    // If selecting today (or the min booking date) and time is empty or earlier than 1h margin, auto-adjust to minBookingTimeISO
    if (!time || isTimeBeforeMargin(selectedDateISO, time)) {
      if (selectedDateISO === minBookingDateISO) {
        onTimeChange(minBookingTimeISO);
      } else if (!time) {
        onTimeChange('12:00');
      }
    }
  };

  // Quick Date Presets
  const setTodayDate = () => {
    const minD = getMinBookingDate();
    const targetISO = formatDateToISO(minD);
    handleDateSelection(targetISO);
    setViewDate(new Date(minD.getFullYear(), minD.getMonth(), 1));
  };

  const setTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = formatDateToISO(tomorrow);
    handleDateSelection(tomorrowISO);
    setViewDate(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
  };

  const setWeekend = () => {
    const d = new Date();
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    let daysUntilSat = 6 - dayOfWeek;
    if (daysUntilSat <= 0) daysUntilSat += 7;
    d.setDate(d.getDate() + daysUntilSat);
    const weekendISO = formatDateToISO(d);
    handleDateSelection(weekendISO);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // Quick Time Presets (minimum +60 mins)
  const addMinutesToTime = (mins: number) => {
    const now = new Date();
    now.setSeconds(0, 0);
    const target = new Date(now.getTime() + mins * 60 * 1000);
    const targetDateISO = formatDateToISO(target);
    const targetTimeISO = formatTimeToISO(target);
    if (!date || date === formatDateToISO(now) || isTimeBeforeMargin(date, targetTimeISO)) {
      onDateChange(targetDateISO);
      setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));
    }
    onTimeChange(targetTimeISO);
  };

  // Days of week labels (Monday first)
  const weekDaysEs = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const weekDaysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDaysGl = ['Luns', 'Mar', 'Mér', 'Xov', 'Ven', 'Sáb', 'Dom'];

  const weekDays =
    language === 'es' ? weekDaysEs : language === 'gl' ? weekDaysGl : weekDaysEn;

  // Month Names
  const monthsEs = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const monthsEn = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthsGl = [
    'Xaneiro',
    'Febreiro',
    'Marzo',
    'Abril',
    'Maio',
    'Xuño',
    'Xullo',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const monthNames =
    language === 'es' ? monthsEs : language === 'gl' ? monthsGl : monthsEn;

  // Generate Calendar Days Grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Convert Sunday-first JS day (0=Sun) to Monday-first (0=Mon, ..., 6=Sun)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const totalDays = lastDayOfMonth.getDate();

  // Days array
  const calendarCells: Array<{
    dayNumber: number;
    dateISO: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isPast: boolean;
  }> = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const prevDayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, prevDayNum);
    calendarCells.push({
      dayNumber: prevDayNum,
      dateISO: formatDateToISO(prevDate),
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isPast: prevDate < today,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const currentCellDate = new Date(year, month, d);
    currentCellDate.setHours(0, 0, 0, 0);

    const cellISO = formatDateToISO(currentCellDate);
    const isSelected = cellISO === date;
    const isToday = currentCellDate.getTime() === today.getTime();
    const isPast = currentCellDate < today;

    calendarCells.push({
      dayNumber: d,
      dateISO: cellISO,
      isCurrentMonth: true,
      isToday,
      isSelected,
      isPast,
    });
  }

  // Next month padding to fill 35 or 42 grid cells
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nextDate = new Date(year, month + 1, n);
    calendarCells.push({
      dayNumber: n,
      dateISO: formatDateToISO(nextDate),
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isPast: nextDate < today,
    });
  }

  // Time preset hours grid
  const popularTimes = [
    '08:00',
    '09:00',
    '10:30',
    '12:00',
    '14:00',
    '16:30',
    '18:00',
    '20:00',
    '22:00',
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Presets Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            {language === 'es' ? 'Rápido:' : language === 'gl' ? 'Rápido:' : 'Quick:'}
          </span>
          <button
            type="button"
            onClick={setTodayDate}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              date === formatDateToISO(new Date())
                ? 'bg-[#FFD700] text-slate-900 shadow-sm shadow-[#FFD700]/30'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {language === 'es' ? 'Hoy' : language === 'gl' ? 'Hoxe' : 'Today'}
          </button>
          <button
            type="button"
            onClick={setTomorrowDate}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
          >
            {language === 'es' ? 'Mañana' : language === 'gl' ? 'Mañá' : 'Tomorrow'}
          </button>
          <button
            type="button"
            onClick={setWeekend}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
          >
            {language === 'es' ? 'Fin de semana' : language === 'gl' ? 'Fin de semana' : 'Weekend'}
          </button>
        </div>

        {/* Selected date display badge */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <CalendarIcon className="w-4 h-4 text-[#FFD700]" />
          <span>{date || '---- -- --'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CALENDAR MONTH CONTAINER */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
          {/* Header Month / Nav */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize flex items-center gap-2">
                {monthNames[month]} <span className="text-slate-400 font-semibold">{year}</span>
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map((wd) => (
              <div
                key={wd}
                className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {calendarCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={idx}
                    className="h-10 sm:h-11 flex items-center justify-center text-xs font-medium text-slate-300 dark:text-slate-700 select-none pointer-events-none"
                  >
                    {cell.dayNumber}
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={cell.isPast}
                  onClick={() => handleDateSelection(cell.dateISO)}
                  className={`h-10 sm:h-11 rounded-2xl text-xs sm:text-sm font-bold transition-all relative flex flex-col items-center justify-center ${
                    cell.isSelected
                      ? 'bg-[#FFD700] text-slate-950 font-black shadow-lg shadow-[#FFD700]/30 scale-105 z-10'
                      : cell.isToday
                      ? 'bg-slate-100 dark:bg-slate-800 text-[#FFD700] font-black border-2 border-[#FFD700]/50 hover:bg-[#FFD700]/10'
                      : cell.isPast
                      ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed line-through opacity-50'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95'
                  }`}
                >
                  <span>{cell.dayNumber}</span>
                  {cell.isToday && !cell.isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] absolute bottom-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TIME PICKER CONTAINER */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col gap-5">
          <div className="flex flex-col gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FFD700]" />
                {language === 'es' ? 'Hora de Recogida' : language === 'gl' ? 'Hora de Recollida' : 'Pickup Time'}
              </h3>
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg font-mono ${
                isCurrentSelectionInvalid
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {time || minBookingTimeISO}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {language === 'es'
                ? `⏱ Margen mínimo de 1 hora (hoy disponible desde las ${minBookingTimeISO})`
                : language === 'gl'
                ? `⏱ Marxe mínima de 1 hora (hoxe dispoñible dende as ${minBookingTimeISO})`
                : `⏱ Minimum 1-hour notice (available today from ${minBookingTimeISO})`}
            </p>
          </div>

          {/* Quick Time Presets */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === 'es' ? 'Atajos de hora:' : language === 'gl' ? 'Atallos de hora:' : 'Quick time:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => addMinutesToTime(60)}
                className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                ⚡ +1 {language === 'es' ? 'hora' : language === 'gl' ? 'hora' : 'hour'}
              </button>
              <button
                type="button"
                onClick={() => addMinutesToTime(90)}
                className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 transition-all"
              >
                +1h 30m
              </button>
              <button
                type="button"
                onClick={() => addMinutesToTime(120)}
                className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 transition-all"
              >
                +2 {language === 'es' ? 'horas' : language === 'gl' ? 'horas' : 'hours'}
              </button>
              <button
                type="button"
                onClick={() => addMinutesToTime(180)}
                className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 transition-all"
              >
                +3 {language === 'es' ? 'horas' : language === 'gl' ? 'horas' : 'hours'}
              </button>
            </div>
          </div>

          {/* Time slot grid */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === 'es' ? 'Horas habituales:' : language === 'gl' ? 'Horas habituais:' : 'Popular times:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {popularTimes.map((t) => {
                const isDisabled = isTimeBeforeMargin(date || formatDateToISO(new Date()), t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (!date) onDateChange(formatDateToISO(new Date()));
                      onTimeChange(t);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      isDisabled
                        ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed line-through opacity-50'
                        : time === t
                        ? 'bg-[#FFD700] text-slate-950 shadow-md shadow-[#FFD700]/30 font-black'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Time Selector Input */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              {language === 'es' ? 'Hora personalizada:' : language === 'gl' ? 'Hora personalizada:' : 'Custom time:'}
            </label>
            <div className="relative">
              <input
                type="time"
                min={!date || date === minBookingDateISO ? minBookingTimeISO : undefined}
                value={time}
                onChange={(e) => {
                  if (!date) onDateChange(formatDateToISO(new Date()));
                  onTimeChange(e.target.value);
                }}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl outline-none text-slate-900 dark:text-white font-mono font-bold text-base transition-all ${
                  isCurrentSelectionInvalid
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-100 dark:border-slate-700 focus:border-[#FFD700]'
                }`}
              />
            </div>
            {isCurrentSelectionInvalid && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-red-600 dark:text-red-300 leading-snug">
                  {language === 'es'
                    ? `No se puede reservar sin margen de 1h. Hora mínima hoy: ${minBookingTimeISO}.`
                    : language === 'gl'
                    ? `Non se pode reservar sen marxe de 1h. Hora mínima hoxe: ${minBookingTimeISO}.`
                    : `Cannot book within 1h margin. Earliest time today: ${minBookingTimeISO}.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onDateChange(minBookingDateISO);
                    onTimeChange(minBookingTimeISO);
                  }}
                  className="shrink-0 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {minBookingTimeISO}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
