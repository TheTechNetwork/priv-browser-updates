import { cn } from '@/lib/utils';

// Create a simple test for the cn function
// Instead of trying to mock clsx and tailwind-merge, we'll test the function's behavior directly

describe('cn utility function', () => {
  it('combines class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const condition = true;
    expect(cn('class1', condition && 'class2')).toBe('class1 class2');
    expect(cn('class1', !condition && 'class2')).toBe('class1');
  });

  it('handles array input', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('handles object syntax', () => {
    expect(cn('base', { 'class1': true, 'class2': false })).toBe('base class1');
  });

  it('merges Tailwind classes correctly', () => {
    // Test Tailwind class merging
    expect(cn('p-4 px-2', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-red-500 hover:bg-blue-500', 'bg-green-500')).toBe('hover:bg-blue-500 bg-green-500');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });

  it('handles empty strings', () => {
    expect(cn('', 'class1', '', 'class2')).toBe('class1 class2');
  });

  it('handles multiple conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled',
      { 'selected': true, 'highlighted': false }
    )).toBe('base active selected');
  });

  it('handles Tailwind responsive classes', () => {
    expect(cn(
      'sm:p-2 md:p-4',
      'sm:p-4'
    )).toBe('md:p-4 sm:p-4');
  });
});