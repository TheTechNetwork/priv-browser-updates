import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

describe('Dialog Component', () => {
  const setup = () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>This is a test dialog</DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    return {
      user,
      onOpenChange,
    };
  };

  it('opens when trigger is clicked', async () => {
    const { user } = setup();
    
    const trigger = screen.getByRole('button', { name: /open dialog/i });
    await user.click(trigger);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeVisible();
    expect(screen.getByText('This is a test dialog')).toBeVisible();
    expect(screen.getByText('Dialog Content')).toBeVisible();
  });

  it('closes when close button is clicked', async () => {
    const { user } = setup();
    
    // Open the dialog
    const trigger = screen.getByRole('button', { name: /open dialog/i });
    await user.click(trigger);

    // There are two close buttons, get the one in the footer (first one)
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    // The footer button is rendered before the top-right button
    await user.click(closeButtons[0]);

    // Wait for dialog to be removed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes when clicking overlay', async () => {
    const { user, onOpenChange } = setup();
    
    // Open the dialog
    const trigger = screen.getByRole('button', { name: /open dialog/i });
    await user.click(trigger);

    // Click the overlay (query by class)
    const overlay = document.querySelector('.bg-black\\/80');
    if (!overlay) throw new Error('Overlay not found');
    await user.click(overlay);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when pressing escape', async () => {
    const { user, onOpenChange } = setup();
    
    // Open the dialog
    const trigger = screen.getByRole('button', { name: /open dialog/i });
    await user.click(trigger);

    // Press escape
    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders with custom className', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className="custom-class">
          <div>Content</div>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole('button', { name: /open dialog/i });
    await userEvent.click(trigger);

    const content = screen.getByText('Content').parentElement;
    expect(content).toHaveClass('custom-class');
  });

  it('handles modal behavior correctly', async () => {
    const { user } = setup();
    
    // Open the dialog
    const trigger = screen.getByRole('button', { name: /open dialog/i });
    await user.click(trigger);

    // Verify focus is within the dialog
    const dialog = screen.getByRole('dialog');
    const active = document.activeElement;
    expect(dialog.contains(active)).toBe(true);
  });
});