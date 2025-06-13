import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WorkoutEditScreen } from '../WorkoutEditScreen';
import { Workout } from '../../../types/workout';
import * as hooks from '../../../hooks/useWorkout';

// Mock the hooks
jest.mock('../../../hooks/useWorkout', () => ({
  useWorkout: jest.fn(),
}));

describe('WorkoutEditScreen', () => {
  const mockWorkout: Workout = {
    id: '1',
    name: 'Test Workout',
    date: '2024-01-01',
    duration: 60,
    exercises: [],
    frequency: {
      type: 'weekly',
      value: 1
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockWorkouts: Workout[] = [
    mockWorkout,
    {
      id: '2',
      name: 'Another Workout',
      date: '2024-01-02',
      duration: 45,
      exercises: [],
      frequency: {
        type: 'weekly',
        value: 2
      },
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ];

  const mockUpdateWorkout = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (hooks.useWorkout as jest.Mock).mockReturnValue({
      workouts: mockWorkouts,
      updateWorkout: mockUpdateWorkout
    });
  });

  it('renders correctly with workout data', () => {
    const { getByText, getByTestId } = render(
      <WorkoutEditScreen 
        workout={mockWorkout} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );

    expect(getByText('Edit workout')).toBeTruthy();
    expect(getByTestId('workout-name-input').props.value).toBe('Test Workout');
    expect(getByText('Tuesday')).toBeTruthy();
  });

  it('handles name changes correctly', () => {
    const { getByTestId } = render(
      <WorkoutEditScreen 
        workout={mockWorkout} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );

    const nameInput = getByTestId('workout-name-input');
    fireEvent.changeText(nameInput, 'Updated Workout Name');
    
    expect(nameInput.props.value).toBe('Updated Workout Name');
  });

  it('shows error for duplicate workout name', () => {
    const { getByTestId, getByText } = render(
      <WorkoutEditScreen 
        workout={mockWorkout} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );

    const nameInput = getByTestId('workout-name-input');
    fireEvent.changeText(nameInput, 'Another Workout');
    
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);
    
    expect(getByText('A workout with this name already exists')).toBeTruthy();
    expect(mockUpdateWorkout).not.toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows error for empty workout name', () => {
    const { getByTestId, getByText } = render(
      <WorkoutEditScreen 
        workout={mockWorkout} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );

    const nameInput = getByTestId('workout-name-input');
    fireEvent.changeText(nameInput, '  ');
    
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);
    
    expect(getByText('Please enter a workout name')).toBeTruthy();
    expect(mockUpdateWorkout).not.toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('saves workout with updated name and frequency', async () => {
    const { getByTestId, getAllByText } = render(
      <WorkoutEditScreen 
        workout={mockWorkout} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );

    // Change the name
    const nameInput = getByTestId('workout-name-input');
    fireEvent.changeText(nameInput, 'Updated Workout');
    
    // Change frequency to Thursday
    const thursdayOption = getAllByText('Thursday')[0];
    fireEvent.press(thursdayOption);
    
    // Save changes
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateWorkout).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
        name: 'Updated Workout',
        frequency: {
          type: 'weekly',
          value: 3 // Thursday has index 3
        }
      }));
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(
      <WorkoutEditScreen 
        workout={mockWorkout} 
        onSave={mockOnSave} 
        onClose={mockOnClose} 
      />
    );

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 