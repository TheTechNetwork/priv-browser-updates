import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  const setup = (props = {}) => {
    const user = userEvent.setup();
    const utils = render(<Input {...props} />);
    const input = screen.getByRole('textbox');
    return {
      input,
      user,
      ...utils,
    };
  };

  it('renders correctly with default props', () => {
    const { input } = setup();
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).not.toBeDisabled();
  });

  it('handles different input types', () => {
    const { input } = setup({ type: 'email' });
    expect(input).toHaveAttribute('type', 'email');
  });

  it('handles value changes', async () => {
    const handleChange = jest.fn();
    const { input, user } = setup({ onChange: handleChange });
    
    await user.type(input, 'test');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test');
  });

  it('handles disabled state', () => {
    const { input } = setup({ disabled: true });
    expect(input).toBeDisabled();
  });

  it('handles placeholder text', () => {
    const { input } = setup({ placeholder: 'Enter text...' });
    expect(input).toHaveAttribute('placeholder', 'Enter text...');
  });

  it('applies custom className', () => {
    const { input } = setup({ className: 'custom-input' });
    expect(input).toHaveClass('custom-input');
  });

  it('handles required attribute', () => {
    const { input } = setup({ required: true });
    expect(input).toBeRequired();
  });

  it('handles readonly attribute', () => {
    const { input } = setup({ readOnly: true });
    expect(input).toHaveAttribute('readonly');
  });

  it('prevents typing when readOnly', async () => {
    const handleChange = jest.fn();
    const { input, user } = setup({ readOnly: true, onChange: handleChange });
    
    await user.type(input, 'test');
    
    expect(handleChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('handles form submission correctly', async () => {
    const handleSubmit = jest.fn(e => e.preventDefault());
    const { input, user } = render(
      <form onSubmit={handleSubmit}>
        <Input />
      </form>
    );

    await user.type(screen.getByRole('textbox'), 'test{enter}');
    
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('handles focus and blur events', async () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    const { input, user } = setup({
      onFocus: handleFocus,
      onBlur: handleBlur
    });

    await user.click(input);
    expect(handleFocus).toHaveBeenCalled();

    await user.tab();
    expect(handleBlur).toHaveBeenCalled();
  });
});