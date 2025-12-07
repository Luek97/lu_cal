import React, { useState, useMemo, useRef } from 'react';
import { CalendarEvent, BucketGoal } from '../types';
import { ChevronLeft, ChevronRight, Circle, X, ChevronDown, ChevronUp, CheckCircle, Pencil, Trash2, Settings, Download, Upload } from 'lucide-react';
import { BucketListView } from './BucketListView';
import { storageService } from '../services/storageService';

interface PlanViewProps {
  events: CalendarEvent[];
  goals: BucketGoal[];
  onAddClick: (date: string) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onAddGoal: (goal: BucketGoal) => void;
  onUpdateGoal: (goal: BucketGoal) => void;
  onDeleteGoal: (id: string) => void;
}

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

export const PlanView: React.FC<PlanViewProps> = ({ 
  events, 
  goals,
  onAddClick, 
  onUpdateEvent, 
  onEditEvent,
  onDeleteEvent,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  // Picker & Menu State
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop State
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [draggingGoal, setDraggingGoal] = useState<BucketGoal | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for drag logic
  const wasDragging = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const potentialDragGoal = useRef<BucketGoal | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
      d.setDate(1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleExport = () => {
    storageService.exportData();
    setIsSettingsOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm('Importing will overwrite current data. Continue?')) {
        await storageService.importData(file);
        window.location.reload(); // Reload to reflect changes
      }
    }
    setIsSettingsOpen(false);
  };

  const days = useMemo(() => {
    if (viewMode === 'month') {
      const dayArray = [];
      // Padding for previous month
      for (let i = 0; i < firstDayOfMonth; i++) {
        dayArray.push(null);
      }
      // Days of current month
      for (let i = 1; i <= daysInMonth; i++) {
        dayArray.push(new Date(year, month, i));
      }
      return dayArray;
    } else {
      // Week View
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday
      const dayArray = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        dayArray.push(d);
      }
      return dayArray;
    }
  }, [viewMode, currentDate, year, month, firstDayOfMonth, daysInMonth]);

  // Format YYYY-MM-DD using Local Time
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selectedDateKey = formatDateKey(selectedDate);

  // Helper sort function for consistency
  const sortEvents = (evts: CalendarEvent[]) => {
    return [...evts].sort((a, b) => {
      // Completed events to bottom
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // Sort priority: Large > Medium > Small
      const sizeOrder = { large: 3, medium: 2, small: 1 };
      const diff = sizeOrder[b.size] - sizeOrder[a.size];
      if (diff !== 0) return diff;
      // Secondary sort: creation time (stable)
      return a.createdAt - b.createdAt;
    });
  };

  const eventsForSelectedDate = useMemo(() => {
    const dayEvents = events.filter(e => e.date === selectedDateKey);
    return sortEvents(dayEvents);
  }, [events, selectedDateKey]);

  const getEventsForDate = (date: Date) => {
    const key = formatDateKey(date);
    return events.filter(e => e.date === key);
  };

  const sizeColorMap = {
    large: 'bg-muji-red',
    medium: 'bg-muji-orange',
    small: 'bg-muji-green',
  };
  
  const sizeTextColorMap = {
    large: 'text-muji-red',
    medium: 'text-muji-orange',
    small: 'text-muji-green',
  };
  
  const sizeLabelMap = {
    large: 'LARGE',
    medium: 'MEDIUM',
    small: 'SMALL',
  };

  // --- Date Picker Logic ---
  const handleYearChange = (delta: number) => {
    setPickerYear(prev => prev + delta);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(new Date(pickerYear, monthIndex, 1));
    setIsMonthPickerOpen(false);
  };

  // --- Drag & Drop Logic (Events) ---
  const handlePointerDown = (e: React.PointerEvent, event: CalendarEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Don't drag if clicking checkbox or action buttons
    if ((e.target as HTMLElement).closest('button')) return;

    const { clientX, clientY } = e;
    dragStartPos.current = { x: clientX, y: clientY };
    wasDragging.current = false;

    longPressTimer.current = setTimeout(() => {
      setDraggingEvent(event);
      setDragPos({ x: clientX, y: clientY });
      wasDragging.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      
      // Capture pointer to track outside
      if (containerRef.current) {
        containerRef.current.setPointerCapture(e.pointerId);
      }
    }, 250); 
  };

  // --- Drag & Drop Logic (Goals) ---
  const handleGoalPointerDown = (e: React.PointerEvent, goal: BucketGoal) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    // Capture start pos and potential goal
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    potentialDragGoal.current = goal;
    // No timer needed, we check distance in PointerMove
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. If currently dragging anything, update position
    if (draggingEvent || draggingGoal) {
      e.preventDefault(); 
      setDragPos({ x: e.clientX, y: e.clientY });
      return;
    } 

    // 2. Check for Slide-to-Drag start (Goals)
    if (potentialDragGoal.current) {
        const dist = Math.sqrt(
          Math.pow(e.clientX - dragStartPos.current.x, 2) + 
          Math.pow(e.clientY - dragStartPos.current.y, 2)
        );
        // Start dragging if moved more than 10px
        if (dist > 10) {
            setDraggingGoal(potentialDragGoal.current);
            setDragPos({ x: e.clientX, y: e.clientY });
            potentialDragGoal.current = null; // Drag started, clear potential
            if (navigator.vibrate) navigator.vibrate(50);
            
            if (containerRef.current) {
              containerRef.current.setPointerCapture(e.pointerId);
            }
        }
        return;
    }

    // 3. Check for Long Press Cancellation (Events)
    if (longPressTimer.current) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.current.x, 2) + 
        Math.pow(e.clientY - dragStartPos.current.y, 2)
      );
      if (dist > 30) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Clean up Event long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Clean up Goal potential drag
    potentialDragGoal.current = null;

    // Release pointer capture
    if (containerRef.current && (draggingEvent || draggingGoal)) {
        try {
            if (containerRef.current.hasPointerCapture(e.pointerId)) {
                containerRef.current.releasePointerCapture(e.pointerId);
            }
        } catch (err) {
            // Ignore error if pointer was already released
        }
    }

    // Handle Drop
    if (draggingEvent) {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      
      // Check for trash drop - Using closest for mobile reliability
      const trashElement = elements.find(el => el.closest('[data-trash-zone]'));
      if (trashElement) {
        onDeleteEvent(draggingEvent.id);
        setDraggingEvent(null);
        if (navigator.vibrate) navigator.vibrate([50, 50]);
        return;
      }

      // Check for date drop - Using closest
      const dateElement = elements.find(el => el.closest('[data-date]'));
      if (dateElement) {
        // We need to get the attribute from the element or its ancestor
        const target = dateElement.closest('[data-date]');
        const newDate = target?.getAttribute('data-date');
        
        if (newDate && newDate !== draggingEvent.date) {
          onUpdateEvent({ ...draggingEvent, date: newDate });
          const [y, m, d] = newDate.split('-').map(Number);
          setSelectedDate(new Date(y, m - 1, d));
        }
      }
      setDraggingEvent(null);
    } else if (draggingGoal) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const dateElement = elements.find(el => el.closest('[data-date]'));
        if (dateElement) {
            const target = dateElement.closest('[data-date]');
            const newDate = target?.getAttribute('data-date');
            
            if (newDate) {
                // Create new event from goal, inheriting size
                const newEvent: CalendarEvent = {
                    id: Date.now().toString(),
                    title: draggingGoal.title,
                    description: `Goal progress: ${draggingGoal.currentCount}/${draggingGoal.targetCount}`,
                    date: newDate,
                    size: draggingGoal.size || 'medium', // Inherit size
                    createdAt: Date.now(),
                    isCompleted: false,
                    linkedGoalId: draggingGoal.id
                };
                onUpdateEvent(newEvent);
                const [y, m, d] = newDate.split('-').map(Number);
                setSelectedDate(new Date(y, m - 1, d));
            }
        }
        setDraggingGoal(null);
    }
  };

  const toggleEventComplete = (event: CalendarEvent) => {
    const newIsCompleted = !event.isCompleted;
    onUpdateEvent({ ...event, isCompleted: newIsCompleted });

    if (event.linkedGoalId) {
      const goal = goals.find(g => g.id === event.linkedGoalId);
      if (goal) {
        let newCount = goal.currentCount;
        if (newIsCompleted) {
           // Increment if completing
           if (newCount < goal.targetCount) newCount++;
        } else {
           // Decrement if un-completing
           if (newCount > 0) newCount--;
        }
        
        if (newCount !== goal.currentCount) {
             onUpdateGoal({
                 ...goal,
                 currentCount: newCount,
                 lastUpdated: Date.now()
             });
        }
      }
    }
  };
  
  // Helper to format Date (Chinese)
  const formatLocaleDate = (date: Date) => {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const w = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return `${m}月${d}日 星期${w}`;
  };

  // Check if "Today" is in the current view
  const isTodayInView = days.some(d => d && isSameDay(d, new Date()));

  // Determine if we should block scrolling (when dragging)
  const isDragging = !!draggingEvent || !!draggingGoal;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full animate-fadeIn relative select-none overflow-hidden ${isDragging ? 'touch-none' : ''}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muji-bg z-10 shrink-0 relative">
        <button 
          onClick={() => {
            setPickerYear(year);
            setIsMonthPickerOpen(true);
          }}
          className="text-2xl font-light tracking-widest text-muji-text hover:bg-white/50 px-2 rounded transition-colors"
        >
          {year}.<span className="text-3xl font-medium">{String(month + 1).padStart(2, '0')}</span>
        </button>
        <div className="flex items-center space-x-2">
          <button onClick={handlePrev} className="p-2 rounded-full hover:bg-white transition-colors">
            <ChevronLeft className="w-6 h-6 text-muji-subtext" />
          </button>
          <button onClick={handleNext} className="p-2 rounded-full hover:bg-white transition-colors">
            <ChevronRight className="w-6 h-6 text-muji-subtext" />
          </button>
          <div className="relative">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-full hover:bg-white transition-colors">
                <Settings className="w-5 h-5 text-muji-subtext" />
            </button>
            {isSettingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fadeIn">
                    <button onClick={handleExport} className="w-full text-left px-4 py-3 text-sm text-muji-text hover:bg-gray-50 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Backup Data
                    </button>
                    <button onClick={handleImportClick} className="w-full text-left px-4 py-3 text-sm text-muji-text hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50">
                        <Upload className="w-4 h-4" />
                        Restore Data
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileImport} 
                        className="hidden" 
                        accept=".json"
                    />
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Goal/Habit Tracker */}
      <div className="bg-muji-bg px-4 pb-2 z-10 shrink-0 relative">
         <BucketListView 
           goals={goals} 
           onAddGoal={onAddGoal} 
           onUpdateGoal={onUpdateGoal} 
           onDeleteGoal={onDeleteGoal}
           onGoalPointerDown={handleGoalPointerDown}
         />
      </div>

      {/* Month Picker Overlay */}
      {isMonthPickerOpen && (
        <div className="absolute inset-0 bg-muji-bg/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
          <div className="w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => handleYearChange(-1)}><ChevronLeft className="w-8 h-8 text-muji-subtext" /></button>
              <span className="text-3xl font-bold text-muji-text">{pickerYear}</span>
              <button onClick={() => handleYearChange(1)}><ChevronRight className="w-8 h-8 text-muji-subtext" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 12 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleMonthSelect(i)}
                  className={`py-4 rounded-xl text-lg font-medium transition-all ${
                    i === month && pickerYear === year 
                      ? 'bg-muji-text text-white shadow-lg' 
                      : 'bg-white text-muji-text hover:bg-gray-100'
                  }`}
                >
                  {i + 1}月
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsMonthPickerOpen(false)}
              className="mt-8 mx-auto block p-2 text-muji-subtext"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Calendar Grid Container with Toggle Handle */}
      <div className="bg-muji-bg pb-2 relative group shrink-0">
        <div className="px-4">
          <div className="grid grid-cols-7 mb-2 text-center text-xs text-muji-subtext font-medium">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 transition-all duration-300 ease-in-out">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              
              const dayStr = formatDateKey(day);
              const isSelected = dayStr === selectedDateKey;
              const isToday = isSameDay(day, new Date());
              
              const dayEvents = getEventsForDate(day);
              const sortedDayEvents = sortEvents(dayEvents);
              const displayDots = sortedDayEvents.slice(0, 3);

              const isDragTarget = (draggingEvent && draggingEvent.date !== dayStr) || draggingGoal;
              
              return (
                <div 
                  key={dayStr} 
                  data-date={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative flex flex-col items-center justify-center h-14 rounded-xl cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-white shadow-md' : 'hover:bg-white/50'}
                    ${isToday && !isSelected ? 'border border-muji-accent' : ''}
                    ${isDragTarget ? 'ring-2 ring-muji-accent/20' : ''}
                  `}
                >
                  <span className={`text-sm ${isSelected ? 'font-bold text-muji-text' : 'text-muji-text'} ${day.getDay() === 0 ? 'text-red-400' : ''}`}>
                    {day.getDate()}
                  </span>
                  
                  {/* Event Indicators */}
                  <div className="flex space-x-0.5 mt-1 h-1.5 justify-center">
                    {displayDots.map((evt, i) => (
                       <div key={i} className={`w-1.5 h-1.5 rounded-full ${evt.isCompleted ? 'bg-gray-300' : sizeColorMap[evt.size]}`}></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Toggle Handle */}
        <button 
          onClick={() => setViewMode(prev => prev === 'week' ? 'month' : 'week')}
          className="w-full flex items-center justify-center mt-2 pb-1 text-muji-subtext/50 hover:text-muji-subtext transition-colors cursor-pointer"
        >
          {viewMode === 'week' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Return to Today Button */}
        {!isTodayInView && (
          <button
            onClick={() => setCurrentDate(new Date())}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-20 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] w-12 h-12 flex flex-col items-center justify-center animate-fadeIn border border-gray-50 active:scale-95 transition-transform"
          >
             <span className="text-base font-bold text-muji-text leading-none">{new Date().getDate()}</span>
             <div className="w-1 h-1 rounded-full bg-muji-text mt-0.5"></div>
          </button>
        )}
      </div>

      {/* Daily Timeline / List */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.03)] p-6 overflow-y-auto mt-2 z-10 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
             <span className="text-xs text-muji-subtext uppercase tracking-widest">SELECTED</span>
             <h3 className="text-lg font-medium text-muji-text">
                {formatLocaleDate(selectedDate)}
             </h3>
          </div>
          <button 
            onClick={() => onAddClick(selectedDateKey)}
            className="text-sm border border-muji-border px-3 py-1 rounded-full text-muji-text hover:bg-muji-bg transition-colors"
          >
            + Add Event
          </button>
        </div>

        <div className="space-y-4">
          {eventsForSelectedDate.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muji-subtext opacity-50">
              <Circle className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-sm">No events planned</p>
            </div>
          ) : (
            eventsForSelectedDate.map(event => (
              <div 
                key={event.id}
                onPointerDown={(e) => handlePointerDown(e, event)}
                className={`
                  relative pl-2 border-l-2 border-transparent pb-4 last:pb-0 touch-manipulation group transition-all
                  ${draggingEvent?.id === event.id ? 'opacity-30' : ''}
                  ${event.isCompleted ? 'opacity-60 bg-gray-50 rounded-lg p-2' : ''}
                `}
              >
                {/* Visual Line connector if needed, or remove for cleaner look */}
                
                <div className="flex items-center justify-between active:scale-[0.98] transition-transform duration-200">
                  <div className="flex items-center flex-1 mr-2">
                     {/* Checkbox and Priority Dot */}
                     <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleEventComplete(event);
                        }}
                        className="mr-3 p-1 text-muji-subtext hover:text-muji-accent focus:outline-none z-10 relative"
                     >
                        {event.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-muji-green" />
                        ) : (
                            <Circle className={`w-5 h-5 ${sizeTextColorMap[event.size]}`} strokeWidth={2} />
                        )}
                     </button>

                     <div className="flex-1">
                         <h4 className={`font-medium text-base leading-snug ${event.isCompleted ? 'text-muji-subtext line-through' : 'text-muji-text'}`}>
                             {event.title}
                         </h4>
                         {event.description && (
                            <p className="text-sm text-muji-subtext mt-0.5 leading-relaxed line-clamp-1">
                              {event.description}
                            </p>
                         )}
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button 
                         onPointerDown={(e) => e.stopPropagation()}
                         onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                         className="p-1.5 text-muji-subtext hover:bg-gray-100 rounded-full transition-colors z-10 relative"
                     >
                         <Pencil className="w-4 h-4" />
                     </button>
                     <button 
                         onPointerDown={(e) => e.stopPropagation()}
                         onClick={(e) => { 
                             e.stopPropagation(); 
                             onDeleteEvent(event.id); 
                         }}
                         className="p-1.5 text-muji-subtext hover:text-muji-red hover:bg-red-50 rounded-full transition-colors z-10 relative"
                     >
                         <Trash2 className="w-4 h-4" />
                     </button>
                     <span className={`text-[10px] px-3 py-1 rounded-full text-white font-medium tracking-wide ${event.isCompleted ? 'bg-gray-300' : sizeColorMap[event.size]}`}>
                        {sizeLabelMap[event.size]}
                     </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drag Ghost Element (Events) */}
      {draggingEvent && (
        <div 
          className="fixed z-50 pointer-events-none bg-white p-4 rounded-xl shadow-2xl border border-muji-text w-64 opacity-90"
          style={{ 
            left: dragPos.x, 
            top: dragPos.y, 
            transform: 'translate(-50%, -100%) rotate(-2deg)' 
          }}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${sizeColorMap[draggingEvent.size]}`}></div>
            <span className="font-medium text-muji-text">{draggingEvent.title}</span>
          </div>
          <div className="mt-1 text-xs text-muji-subtext">{draggingEvent.date}</div>
        </div>
      )}

      {/* Drag Ghost Element (Goals) */}
      {draggingGoal && (
        <div 
          className="fixed z-50 pointer-events-none bg-white p-4 rounded-xl shadow-2xl border border-muji-text w-64 opacity-90"
          style={{ 
            left: dragPos.x, 
            top: dragPos.y, 
            transform: 'translate(-50%, -100%) rotate(2deg)' 
          }}
        >
            <div className="flex items-center justify-between">
                <span className="font-medium text-muji-text">{draggingGoal.title}</span>
                <span className="text-xs text-muji-subtext">{draggingGoal.currentCount}/{draggingGoal.targetCount}</span>
            </div>
            <div className="mt-2 text-xs text-blue-500 font-medium">Drop to add event</div>
        </div>
      )}

      {/* Trash Drop Zone */}
      {draggingEvent && (
        <div 
          data-trash-zone="true"
          className="absolute bottom-6 left-6 right-6 h-24 border-2 border-dashed border-red-300 bg-red-50/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-40 animate-fadeIn"
        >
          <Trash2 className="w-8 h-8 text-red-400 mb-1" />
          <span className="text-red-400 text-xs font-bold tracking-wider">DELETE EVENT</span>
        </div>
      )}
    </div>
  );
};