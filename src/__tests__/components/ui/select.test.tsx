import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

describe('Select Component', () => {
  const setup = () => {
    const user = userEvent.setup();
    const handleValueChange = jest.fn();

    render(
      <Select value="option1" onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );

    return {
      user,
      handleValueChange,
    };
  };

  it('renders with initial value', () => {
    setup();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('shows options when clicked', async () => {
    const { user } = setup();
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByText('Option 1')).toBeVisible();
    expect(screen.getByText('Option 2')).toBeVisible();
    expect(screen.getByText('Option 3')).toBeVisible();
  });

  it('calls onValueChange when selecting an option', async () => {
    const { user, handleValueChange } = setup();
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const option2 = screen.getByText('Option 2');
    await user.click(option2);

    expect(handleValueChange).toHaveBeenCalledWith('option2');
  });

  it('closes dropdown after selection', async () => {
    const { user } = setup();
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const option = screen.getByText('Option 2');
    await user.click(option);

    await waitFor(() => {
      expect(screen.queryByText('Option 3')).not.toBeVisible();
    });
  });

  it('displays placeholder when no value is selected', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('handles disabled items', async () => {
    const { user } = setup();
    
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1" disabled>Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    const option1 = screen.getByText('Option 1');
    expect(option1.parentElement).toHaveAttribute('data-disabled');
  });
});