import React, { useState, useEffect } from 'react';
import { PlanView } from './components/PlanView';
import { AddEventView } from './components/AddEventView';
import { ViewState, CalendarEvent, BucketGoal } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('plan');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<BucketGoal[]>([]);
  const [preSelectedDate, setPreSelectedDate] = useState<string | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Load initial data
  useEffect(() => {
    setEvents(storageService.getEvents());
    setGoals(storageService.getGoals());
  }, []);

  const handleAddEventClick = (date: string) => {
    setPreSelectedDate(date);
    setEditingEvent(null);
    setCurrentView('add');
  };

  const handleEditEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setCurrentView('add');
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    const updatedEvents = storageService.saveEvent(event);
    setEvents(updatedEvents);
    setCurrentView('plan');
    setPreSelectedDate(undefined);
    setEditingEvent(null);
  };

  const handleUpdateEvent = (event: CalendarEvent) => {
    const updatedEvents = storageService.saveEvent(event);
    setEvents(updatedEvents);
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = storageService.deleteEvent(id);
    setEvents(updatedEvents);
    if (currentView === 'add') {
      setCurrentView('plan');
      setEditingEvent(null);
    }
  };

  const handleCancelAdd = () => {
    setCurrentView('plan');
    setPreSelectedDate(undefined);
    setEditingEvent(null);
  };

  const handleAddGoal = (goal: BucketGoal) => {
    const updatedGoals = storageService.saveGoal(goal);
    setGoals(updatedGoals);
  };

  const handleUpdateGoal = (goal: BucketGoal) => {
    const updatedGoals = storageService.saveGoal(goal);
    setGoals(updatedGoals);
  };

  const handleDeleteGoal = (id: string) => {
    const updatedGoals = storageService.deleteGoal(id);
    setGoals(updatedGoals);
  };

  return (
    <div className="max-w-md mx-auto h-screen overflow-hidden bg-muji-bg relative shadow-2xl">
      <div className="h-full relative">
        {currentView === 'plan' && (
          <PlanView 
            events={events} 
            goals={goals}
            onAddClick={handleAddEventClick} 
            onUpdateEvent={handleUpdateEvent}
            onEditEvent={handleEditEventClick}
            onDeleteEvent={handleDeleteEvent}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}
        
        {currentView === 'add' && (
          <AddEventView 
            existingEvents={events}
            initialDate={preSelectedDate}
            initialEvent={editingEvent}
            onSave={handleSaveEvent} 
            onDelete={handleDeleteEvent}
            onCancel={handleCancelAdd} 
          />
        )}
      </div>
    </div>
  );
};

export default App;