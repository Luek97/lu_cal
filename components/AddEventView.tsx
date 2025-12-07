import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, EventSize } from '../types';
import { Calendar, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';

interface AddEventViewProps {
  existingEvents: CalendarEvent[];
  initialDate?: string;
  initialEvent?: CalendarEvent | null;
  onSave: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

export const AddEventView: React.FC<AddEventViewProps> = ({ existingEvents, initialDate, initialEvent, onSave, onDelete, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [size, setSize] = useState<EventSize>('medium');
  const [isDescOpen, setIsDescOpen] = useState(false);
  
  // Custom Date Picker State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setDescription(initialEvent.description);
      setDate(initialEvent.date);
      setSize(initialEvent.size);
      if (initialEvent.description) setIsDescOpen(true);
    } else {
      // Default to initialDate or today
      const defaultDate = initialDate || (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      setDate(defaultDate);
      setTitle('');
      setDescription('');
      setSize('medium');
    }
  }, [initialEvent, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const newEvent: CalendarEvent = {
      id: initialEvent ? initialEvent.id : Date.now().toString(),
      title,
      description,
      date,
      size,
      createdAt: initialEvent ? initialEvent.createdAt : Date.now(),
    };
    onSave(newEvent);
  };

  const sameDayEvents = existingEvents.filter(e => e.date === date && e.id !== (initialEvent?.id));

  const sizeOptions: { value: EventSize; label: string; color: string }[] = [
    { value: 'large', label: 'Important', color: 'bg-muji-red' },
    { value: 'medium', label: 'Normal', color: 'bg-muji-orange' },
    { value: 'small', label: 'Trivial', color: 'bg-muji-green' },
  ];

  // Calendar Logic
  const daysInPicker = useMemo(() => {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [pickerDate]);

  const handlePrevMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1));
  };
  
  const openCalendar = () => {
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      setPickerDate(new Date(y, m - 1, d));
    } else {
      setPickerDate(new Date());
    }
    setIsCalendarOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-white animate-fadeIn relative">
      {/* Header */}
      <div className="px-6 py-6 border-b border-muji-bg flex justify-between items-center">
        <h2 className="text-xl font-light text-muji-text">
          {initialEvent ? 'Edit Schedule' : 'New Schedule'}
        </h2>
        {initialEvent && (
          <button 
            type="button"
            onClick={() => {
              if (window.confirm('Delete this event?')) {
                onDelete(initialEvent.id);
              }
            }}
            className="text-muji-red p-2 hover:bg-red-50 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muji-subtext uppercase tracking-widest">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you doing?"
              className="w-full text-2xl text-muji-text placeholder-gray-300 border-b border-muji-border pb-2 focus:outline-none focus:border-muji-accent bg-transparent"
              autoFocus={!initialEvent}
            />
          </div>

          {/* Type / Size */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-muji-subtext uppercase tracking-widest">Priority</label>
             <div className="flex space-x-3">
               {sizeOptions.map((opt) => (
                 <button
                   key={opt.value}
                   type="button"
                   onClick={() => setSize(opt.value)}
                   className={`
                     flex-1 py-3 px-2 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2
                     ${size === opt.value ? 'border-muji-text bg-muji-bg' : 'border-muji-border bg-white'}
                   `}
                 >
                   <div className={`w-3 h-3 rounded-full ${opt.color}`}></div>
                   <span className={`text-sm ${size === opt.value ? 'text-muji-text font-medium' : 'text-muji-subtext'}`}>{opt.label}</span>
                 </button>
               ))}
             </div>
          </div>

          {/* Date Picker Button */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muji-subtext uppercase tracking-widest">Date</label>
            <button
                type="button"
                onClick={openCalendar}
                className="w-full p-4 bg-muji-bg rounded-xl text-muji-text text-left flex items-center justify-between group hover:bg-gray-100 transition-colors"
            >
                <span className="text-lg tracking-wide">{date || 'Select Date'}</span>
                <Calendar className="text-muji-subtext w-5 h-5 group-hover:text-muji-text transition-colors" />
            </button>
          </div>

          {/* Description Toggle */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsDescOpen(!isDescOpen)}
              className="flex items-center text-sm text-muji-accent hover:text-muji-text transition-colors"
            >
              {isDescOpen ? '- Remove Description' : '+ Add Description'}
            </button>
            
            {isDescOpen && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about the event..."
                className="w-full p-4 bg-muji-bg rounded-xl text-muji-text focus:outline-none min-h-[100px] resize-none text-sm leading-relaxed"
              />
            )}
          </div>

          {/* Existing Events Preview */}
          <div className="mt-8 pt-6 border-t border-muji-border">
            <h4 className="text-xs text-muji-subtext mb-4">Other events on {date}:</h4>
            {sameDayEvents.length === 0 ? (
               <p className="text-sm text-gray-300 italic">Free day</p>
            ) : (
              <div className="space-y-2">
                {sameDayEvents.map(e => (
                  <div key={e.id} className="flex items-center space-x-3 text-sm text-muji-text/70">
                    <div className={`w-2 h-2 rounded-full ${
                      e.size === 'large' ? 'bg-muji-red' : 
                      e.size === 'medium' ? 'bg-muji-orange' : 'bg-muji-green'
                    }`} />
                    <span>{e.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons - Inline */}
          <div className="flex space-x-4 pt-4 pb-8">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 rounded-xl bg-white border border-muji-border text-muji-text font-medium shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 rounded-xl bg-muji-text text-white font-medium shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Save
            </button>
          </div>

        </form>
      </div>

      {/* Calendar Modal Overlay */}
      {isCalendarOpen && (
        <div className="absolute inset-0 z-50 bg-muji-bg/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-muji-border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-muji-bg">
                    <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-muji-bg rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-muji-subtext" />
                    </button>
                    <span className="text-xl font-medium text-muji-text">
                        {pickerDate.getFullYear()}.{String(pickerDate.getMonth() + 1).padStart(2, '0')}
                    </span>
                    <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-muji-bg rounded-full transition-colors">
                    <ChevronRight className="w-6 h-6 text-muji-subtext" />
                    </button>
                </div>
                
                {/* Grid */}
                <div className="p-4">
                    <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-muji-subtext">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                        {daysInPicker.map((d, i) => {
                            if (!d) return <div key={`empty-${i}`} />;
                            
                            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            
                            const isSelected = dStr === date;
                            const isToday = dStr === (() => {
                                const today = new Date();
                                return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            })();
                            
                            // Event Dots Logic
                            const dayEvents = existingEvents.filter(e => e.date === dStr);
                            const hasLarge = dayEvents.some(e => e.size === 'large');
                            const hasMedium = dayEvents.some(e => e.size === 'medium');
                            const hasSmall = dayEvents.some(e => e.size === 'small');
                            
                            let dotColor = 'bg-muji-subtext';
                            if (hasLarge) dotColor = 'bg-muji-red';
                            else if (hasMedium) dotColor = 'bg-muji-orange';
                            else if (hasSmall) dotColor = 'bg-muji-green';

                            return (
                                <button
                                    key={dStr}
                                    type="button"
                                    onClick={() => {
                                        setDate(dStr);
                                        setIsCalendarOpen(false);
                                    }}
                                    className={`
                                        relative h-10 w-full flex flex-col items-center justify-center rounded-lg transition-all
                                        ${isSelected ? 'bg-muji-text text-white shadow-md' : 'hover:bg-muji-bg text-muji-text'}
                                        ${isToday && !isSelected ? 'border border-muji-accent' : ''}
                                    `}
                                >
                                    <span className="text-sm font-medium">{d.getDate()}</span>
                                    {dayEvents.length > 0 && (
                                        <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColor}`}></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Close Button */}
                <div className="p-4 border-t border-muji-bg flex justify-center">
                    <button 
                        type="button"
                        onClick={() => setIsCalendarOpen(false)}
                        className="flex items-center space-x-2 px-6 py-2 rounded-full bg-muji-bg text-muji-subtext hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Close</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};