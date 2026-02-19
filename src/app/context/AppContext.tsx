import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Job, JobStep, Facility, CalendarPattern, ProcessBPattern,
  MOCK_JOBS, FACILITIES, CALENDAR_PATTERNS, PROCESS_B_PATTERNS,
} from '../data/mockData';

interface AppContextType {
  jobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  updateJobStep: (jobId: string, stepId: string, updates: Partial<JobStep>) => void;
  addJobLog: (jobId: string, message: string) => void;
  currentFacility: Facility;
  setCurrentFacility: (facility: Facility) => void;
  currentAccount: string;
  currentEnvironment: 'production' | 'staging';
  setCurrentEnvironment: (env: 'production' | 'staging') => void;
  // Patterns
  calendarPatterns: CalendarPattern[];
  processBPatterns: ProcessBPattern[];
  addCalendarPattern: (pattern: CalendarPattern) => void;
  updateCalendarPattern: (id: string, updates: Partial<CalendarPattern>) => void;
  addProcessBPattern: (pattern: ProcessBPattern) => void;
  updateProcessBPattern: (id: string, updates: Partial<ProcessBPattern>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [currentFacility, setCurrentFacility] = useState<Facility>(FACILITIES[0]);
  const [currentEnvironment, setCurrentEnvironment] = useState<'production' | 'staging'>('production');
  const [calendarPatterns, setCalendarPatterns] = useState<CalendarPattern[]>(CALENDAR_PATTERNS);
  const [processBPatterns, setProcessBPatterns] = useState<ProcessBPattern[]>(PROCESS_B_PATTERNS);

  const addJob = useCallback((job: Job) => {
    setJobs(prev => [job, ...prev]);
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs(prev => prev.map(j => (j.id === id ? { ...j, ...updates } : j)));
  }, []);

  const updateJobStep = useCallback(
    (jobId: string, stepId: string, updates: Partial<JobStep>) => {
      setJobs(prev =>
        prev.map(j => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            steps: j.steps.map(s => (s.id === stepId ? { ...s, ...updates } : s)),
          };
        }),
      );
    },
    [],
  );

  const addJobLog = useCallback((jobId: string, message: string) => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        return { ...j, logs: [...j.logs, `[${time}] ${message}`] };
      }),
    );
  }, []);

  const addCalendarPattern = useCallback((pattern: CalendarPattern) => {
    setCalendarPatterns(prev => [...prev, pattern]);
  }, []);

  const updateCalendarPattern = useCallback((id: string, updates: Partial<CalendarPattern>) => {
    setCalendarPatterns(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const addProcessBPattern = useCallback((pattern: ProcessBPattern) => {
    setProcessBPatterns(prev => [...prev, pattern]);
  }, []);

  const updateProcessBPattern = useCallback((id: string, updates: Partial<ProcessBPattern>) => {
    setProcessBPatterns(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  return (
    <AppContext.Provider
      value={{
        jobs,
        addJob,
        updateJob,
        updateJobStep,
        addJobLog,
        currentFacility,
        setCurrentFacility,
        currentAccount: 'operator01',
        currentEnvironment,
        setCurrentEnvironment,
        calendarPatterns,
        processBPatterns,
        addCalendarPattern,
        updateCalendarPattern,
        addProcessBPattern,
        updateProcessBPattern,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
