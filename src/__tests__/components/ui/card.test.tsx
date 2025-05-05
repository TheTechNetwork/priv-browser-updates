import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <div data-testid="child">Card Content</div>
        </Card>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      const card = screen.getByText('Content').parentElement;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('CardHeader', () => {
    it('renders header content correctly', () => {
      render(
        <CardHeader>
          <div data-testid="header-content">Header Content</div>
        </CardHeader>
      );
      expect(screen.getByTestId('header-content')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('renders title text', () => {
      render(<CardTitle>Test Title</CardTitle>);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('applies heading styles', () => {
      render(<CardTitle>Test Title</CardTitle>);
      const title = screen.getByText('Test Title');
      expect(title.tagName.toLowerCase()).toBe('h3');
    });
  });

  describe('CardDescription', () => {
    it('renders description text', () => {
      render(<CardDescription>Test Description</CardDescription>);
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('applies muted text styles', () => {
      render(<CardDescription>Test Description</CardDescription>);
      const description = screen.getByText('Test Description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders content with proper spacing', () => {
      render(
        <CardContent>
          <p>Test Content</p>
        </CardContent>
      );
      const content = screen.getByText('Test Content').parentElement;
      expect(content).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('CardFooter', () => {
    it('renders footer content', () => {
      render(
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Card Integration', () => {
    it('renders full card structure correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Main Content</CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});