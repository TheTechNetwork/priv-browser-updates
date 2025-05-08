import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import '@testing-library/jest-dom';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).toHaveClass('inline-flex items-center justify-center');
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies size classes correctly', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('handles disabled state', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button disabled onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('inline-flex items-center justify-center');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Click me</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it('merges custom className with default classes', () => {
    render(<Button className="custom-class">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('inline-flex');
  });
});