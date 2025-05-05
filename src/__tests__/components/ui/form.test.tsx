import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
});

type FormData = z.infer<typeof formSchema>;

const TestForm = ({ onSubmit = jest.fn() }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Enter your username</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
};

describe('Form Components', () => {
  const setup = () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    const utils = render(<TestForm onSubmit={handleSubmit} />);
    return {
      user,
      handleSubmit,
      ...utils,
    };
  };

  it('renders form fields correctly', () => {
    setup();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your username/i)).toBeInTheDocument();
  });

  it('handles valid form submission', async () => {
    const { user, handleSubmit } = setup();
    
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@example.com');
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
    });
  });

  it('displays validation errors for invalid input', async () => {
    const { user } = setup();
    
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    await user.type(usernameInput, 'a'); // Too short
    await user.type(emailInput, 'invalid-email'); // Invalid email
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(await screen.findByText(/string must contain at least 2 character/i)).toBeInTheDocument();
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('updates form state on input change', async () => {
    const { user } = setup();
    
    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'testuser');
    
    expect(usernameInput).toHaveValue('testuser');
  });

  it('clears validation errors when input becomes valid', async () => {
    const { user } = setup();
    
    const usernameInput = screen.getByLabelText(/username/i);
    
    // Enter invalid input
    await user.type(usernameInput, 'a');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Verify error appears
    expect(await screen.findByText(/string must contain at least 2 character/i)).toBeInTheDocument();
    
    // Fix the input
    await user.clear(usernameInput);
    await user.type(usernameInput, 'validuser');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Verify error disappears
    expect(screen.queryByText(/string must contain at least 2 character/i)).not.toBeInTheDocument();
  });

  it('preserves form description when validation errors occur', async () => {
    const { user } = setup();
    
    const usernameInput = screen.getByLabelText(/username/i);
    
    // Enter invalid input
    await user.type(usernameInput, 'a');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Description should still be visible
    expect(screen.getByText(/enter your username/i)).toBeInTheDocument();
  });
});