import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  duration?: number;
  type?: 'consultation' | 'meeting' | 'appointment' | 'other';
  description?: string;
}

export interface CalendarProps {
  events?: CalendarEvent[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
  view?: 'month' | 'week' | 'day';
  highlightToday?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  selectedDate = new Date(),
  onDateSelect,
  onEventClick,
  className = '',
  view = 'month',
  highlightToday = true
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date | null) => {
    if (!date || !highlightToday) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className={`calendar-container bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] p-1 cursor-pointer rounded-lg transition-colors
                ${date ? 'hover:bg-gray-50' : ''}
                ${isToday(date) ? 'bg-blue-50 border border-blue-200' : ''}
                ${isSelected(date) ? 'bg-blue-100 border border-blue-300' : ''}
              `}
              onClick={() => date && onDateSelect?.(date)}
            >
              {date && (
                <>
                  <div className={`
                    text-sm font-medium text-center mb-1
                    ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}
                  `}>
                    {date.getDate()}
                  </div>
                  
                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`
                          text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer
                          ${event.type === 'consultation' ? 'bg-blue-500' : 
                            event.type === 'meeting' ? 'bg-green-500' :
                            event.type === 'appointment' ? 'bg-purple-500' : 'bg-gray-500'}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Events summary */}
      {events.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Upcoming Events ({events.length})
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {events.slice(0, 3).map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => onEventClick?.(event)}
              >
                <span className="font-medium">{event.title}</span>
                <span className="text-gray-500">
                  {event.date.toLocaleDateString()} {event.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;