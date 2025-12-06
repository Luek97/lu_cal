import { CalendarEvent, BucketGoal } from '../types';

const EVENTS_KEY = 'muji_planner_events';
const GOALS_KEY = 'muji_planner_goals';

export const storageService = {
  getEvents: (): CalendarEvent[] => {
    try {
      const stored = localStorage.getItem(EVENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load events", e);
      return [];
    }
  },

  saveEvent: (event: CalendarEvent) => {
    const events = storageService.getEvents();
    const existingIndex = events.findIndex(e => e.id === event.id);
    let newEvents;
    
    if (existingIndex >= 0) {
      newEvents = [...events];
      newEvents[existingIndex] = event;
    } else {
      newEvents = [...events, event];
    }
    
    localStorage.setItem(EVENTS_KEY, JSON.stringify(newEvents));
    return newEvents;
  },

  deleteEvent: (id: string) => {
    const events = storageService.getEvents();
    const newEvents = events.filter(e => e.id !== id);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(newEvents));
    return newEvents;
  },

  getGoals: (): BucketGoal[] => {
    try {
      const stored = localStorage.getItem(GOALS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load goals", e);
      return [];
    }
  },

  saveGoal: (goal: BucketGoal) => {
    const goals = storageService.getGoals();
    // Check if update or new
    const existingIndex = goals.findIndex(g => g.id === goal.id);
    let newGoals;
    
    if (existingIndex >= 0) {
      newGoals = [...goals];
      newGoals[existingIndex] = goal;
    } else {
      newGoals = [...goals, goal];
    }
    
    localStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
    return newGoals;
  },
  
  deleteGoal: (id: string) => {
    const goals = storageService.getGoals();
    const newGoals = goals.filter(g => g.id !== id);
    localStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
    return newGoals;
  }
};