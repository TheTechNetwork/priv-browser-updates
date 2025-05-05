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
            <Button>Close</Button>
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

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

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

    // Click the backdrop/overlay
    const dialog = screen.getByRole('dialog');
    await user.click(dialog.parentElement!);

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

  it('renders with custom className', () => {
    render(
      <Dialog>
        <DialogContent className="custom-class">
          <div>Content</div>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole('button');
    userEvent.click(trigger);

    const content = screen.getByText('Content').parentElement;
    expect(content).toHaveClass('custom-class');
  });

  it('handles modal behavior correctly', async () => {
    const { user } = setup();
    
    // Open the dialog
    const trigger = screen.getByRole('button', { name: /open dialog/i });
    await user.click(trigger);

    // Verify focus is trapped within dialog
    const dialog = screen.getByRole('dialog');
    expect(document.activeElement).toBeInTheDocument();
    expect(dialog).toContain(document.activeElement);
  });
});