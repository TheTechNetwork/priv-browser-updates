import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from '@/components/ui/toast';

describe('Toast Component', () => {
  const ToastTest = ({
    open = true,
    onOpenChange = jest.fn(),
    duration = 5000,
    ...props
  }) => (
    <ToastProvider duration={duration}>
      <Toast open={open} onOpenChange={onOpenChange} {...props}>
        <ToastTitle>Test Title</ToastTitle>
        <ToastDescription>Test Description</ToastDescription>
        <ToastAction altText="test action" onClick={jest.fn()}>
          Action
        </ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );

  const setup = (props = {}) => {
    const user = userEvent.setup();
    const utils = render(<ToastTest {...props} />);
    return {
      user,
      ...utils,
    };
  };

  it('renders toast content when open', () => {
    setup();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    setup({ open: false });
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('calls onOpenChange when close button is clicked', async () => {
    const onOpenChange = jest.fn();
    const { user } = setup({ onOpenChange });

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange when action button is clicked', async () => {
    const onOpenChange = jest.fn();
    const { user } = setup({ onOpenChange });

    await user.click(screen.getByText('Action'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('automatically closes after duration', async () => {
    jest.useFakeTimers();
    const onOpenChange = jest.fn();
    setup({ onOpenChange, duration: 1000 });

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    jest.useRealTimers();
  });

  it('pauses auto-close timer on hover', async () => {
    jest.useFakeTimers();
    const onOpenChange = jest.fn();
    const { user } = setup({ onOpenChange, duration: 1000 });

    // Hover over toast
    await user.hover(screen.getByRole('status'));
    
    // Advance time
    jest.advanceTimersByTime(1000);
    
    // Toast should not have closed
    expect(onOpenChange).not.toHaveBeenCalled();

    // Unhover
    await user.unhover(screen.getByRole('status'));
    
    // Now it should close after duration
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    jest.useRealTimers();
  });

  it('applies custom className', () => {
    setup({ className: 'custom-toast' });
    const toast = screen.getByRole('status');
    expect(toast).toHaveClass('custom-toast');
  });

  it('supports different variants', () => {
    setup({ variant: 'destructive' });
    const toast = screen.getByRole('status');
    expect(toast).toHaveClass('destructive');
  });

  it('handles swipe to dismiss', async () => {
    const onOpenChange = jest.fn();
    setup({ onOpenChange });

    const toast = screen.getByRole('status');
    
    // Simulate swipe
    await userEvent.pointer([
      { target: toast, keys: '[MouseLeft]', coords: { x: 0, y: 0 } },
      { target: toast, coords: { x: -200, y: 0 } },
      { target: toast, keys: '[/MouseLeft]' },
    ]);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});