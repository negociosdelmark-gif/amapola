/**
 * Utility to generate calendar links and .ics files for monthly reminders.
 */

interface CalendarEvent {
  title: string;
  description: string;
  durationMinutes?: number;
  recurrenceInterval?: number; // e.g., 3 for quarterly
}

// Helper to format Date to YYYYMMDDTHHMMSSZ in UTC
const formatICSDate = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

// Helper to format Date to YYYYMMDDTHHMMSSZ for Google Calendar
const formatGoogleDate = (date: Date): string => {
  return formatICSDate(date);
};

export const getGoogleCalendarLink = (event: CalendarEvent): string => {
  const now = new Date();
  // Set start to today at 10:00 AM local time, converted to UTC
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  const endDate = new Date(startDate.getTime() + (event.durationMinutes || 30) * 60 * 1000);
  
  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description);
  
  const interval = event.recurrenceInterval || 1;
  const recurParam = interval > 1 ? `RRULE:FREQ=MONTHLY;INTERVAL=${interval}` : `RRULE:FREQ=MONTHLY`;
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&recur=${recurParam}&dates=${dates}`;
};

export const getOutlookCalendarLink = (event: CalendarEvent): string => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  const endDate = new Date(startDate.getTime() + (event.durationMinutes || 30) * 60 * 1000);
  
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description);
  const start = encodeURIComponent(startDate.toISOString());
  const end = encodeURIComponent(endDate.toISOString());
  
  const interval = event.recurrenceInterval || 1;
  const rrulesParam = interval > 1 ? `FREQ=MONTHLY;INTERVAL=${interval}` : `FREQ=MONTHLY`;
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&body=${details}&startdt=${start}&enddt=${end}&rrules=${encodeURIComponent(rrulesParam)}`;
};

export const downloadICSFile = (event: CalendarEvent): void => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  const endDate = new Date(startDate.getTime() + (event.durationMinutes || 30) * 60 * 1000);
  
  const cleanDesc = event.description.replace(/\n/g, '\\n');
  const interval = event.recurrenceInterval || 1;
  const rruleLine = interval > 1 ? `RRULE:FREQ=MONTHLY;INTERVAL=${interval}` : 'RRULE:FREQ=MONTHLY';
  
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amapola Alerta//Prevenir Infantil//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@amapola-alerta`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${cleanDesc}`,
    rruleLine,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  
  const icsString = icsLines.join('\r\n');
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `recordatorio_prevencion_${Date.now()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
