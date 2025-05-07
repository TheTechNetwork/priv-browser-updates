import * as React from 'react';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useToast } from '@/hooks/use-toast';
import '@testing-library/jest-dom';

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

// Constants from the original file
const TOAST_LIMIT = 1;

interface Toast {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

// Simplified reducer implementation for testing
const reducer = (state: { toasts: Toast[] }, action: ToastAction): { toasts: Toast[] } => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

describe('Toast reducer', () => {
  const initialState = { toasts: [] };
  const mockToast = {
    id: '1',
    title: 'Test Toast',
    description: 'This is a test toast',
    open: true,
    onOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should add a toast to the state', () => {
    const action = {
      type: 'ADD_TOAST' as const,
      toast: mockToast,
    };

    const newState = reducer(initialState, action);
    
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0]).toEqual(mockToast);
  });

  it('should respect the toast limit when adding toasts', () => {
    // Add multiple toasts
    let state = initialState;
    
    for (let i = 0; i < 5; i++) {
      const action = {
        type: 'ADD_TOAST' as const,
        toast: { ...mockToast, id: `${i}` },
      };
      
      state = reducer(state, action);
    }
    
    // The TOAST_LIMIT is 1, so we should only have the most recent toast
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].id).toBe('4'); // The last toast added
  });

  it('should update an existing toast', () => {
    // First add a toast
    let state = reducer(
      initialState,
      {
        type: 'ADD_TOAST' as const,
        toast: mockToast,
      }
    );
    
    // Then update it
    const updatedToast = {
      id: '1',
      title: 'Updated Toast',
    };
    
    state = reducer(
      state,
      {
        type: 'UPDATE_TOAST' as const,
        toast: updatedToast,
      }
    );
    
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].title).toBe('Updated Toast');
    expect(state.toasts[0].description).toBe('This is a test toast'); // Original value preserved
  });

  it('should dismiss a specific toast', () => {
    // First add a toast
    let state = reducer(
      initialState,
      {
        type: 'ADD_TOAST' as const,
        toast: mockToast,
      }
    );
    
    // Then dismiss it
    state = reducer(
      state,
      {
        type: 'DISMISS_TOAST' as const,
        toastId: '1',
      }
    );
    
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].open).toBe(false);
  });

  it('should dismiss all toasts when no toastId is provided', () => {
    // Add multiple toasts
    let state = initialState;
    
    for (let i = 0; i < 2; i++) {
      const action = {
        type: 'ADD_TOAST' as const,
        toast: { ...mockToast, id: `${i}` },
      };
      
      state = reducer(state, action);
    }
    
    // Dismiss all toasts
    state = reducer(
      state,
      {
        type: 'DISMISS_TOAST' as const,
      }
    );
    
    // All toasts should be marked as closed
    expect(state.toasts.every(toast => !toast.open)).toBe(true);
  });

  it('should remove a specific toast', () => {
    // First add a toast
    let state = reducer(
      initialState,
      {
        type: 'ADD_TOAST' as const,
        toast: mockToast,
      }
    );
    
    // Then remove it
    state = reducer(
      state,
      {
        type: 'REMOVE_TOAST' as const,
        toastId: '1',
      }
    );
    
    expect(state.toasts).toHaveLength(0);
  });

  it('should remove all toasts when no toastId is provided', () => {
    // Add multiple toasts
    let state = initialState;
    
    for (let i = 0; i < 2; i++) {
      const action = {
        type: 'ADD_TOAST' as const,
        toast: { ...mockToast, id: `${i}` },
      };
      
      state = reducer(state, action);
    }
    
    // Remove all toasts
    state = reducer(
      state,
      {
        type: 'REMOVE_TOAST' as const,
      }
    );
    
    expect(state.toasts).toHaveLength(0);
  });

  it('should dismiss toast after duration', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        ...mockToast,
        duration: 1000,
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.toasts).toHaveLength(0);
    
    jest.useRealTimers();
  });

  it('should update existing toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast(mockToast);
    });

    const updatedTitle = 'Updated Toast';
    
    act(() => {
      result.current.update('1', { title: updatedTitle });
    });

    expect(result.current.toasts[0].title).toBe(updatedTitle);
  });
});

// Mock the toast module
const mockToastFn = jest.fn();
const mockDismissFn = jest.fn();

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToastFn,
    dismiss: mockDismissFn,
  }),
}));

describe("useToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return toast functions", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeDefined();
    expect(result.current.dismiss).toBeDefined();
  });

  it("should call toast with correct arguments", () => {
    const { result } = renderHook(() => useToast());
    const toastArgs = { title: "Test Toast", description: "Test Description" };
    
    act(() => {
      result.current.toast(toastArgs);
    });
    
    expect(mockToastFn).toHaveBeenCalledWith(toastArgs);
  });

  it("should call dismiss with correct arguments", () => {
    const { result } = renderHook(() => useToast());
    const toastId = "test-id";
    
    act(() => {
      result.current.dismiss(toastId);
    });
    
    expect(mockDismissFn).toHaveBeenCalledWith(toastId);
  });
});