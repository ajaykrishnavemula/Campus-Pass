/**
 * Button Component Tests
 * 
 * Tests the reusable Button component with different variants and states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      // ARRANGE & ACT
      render(<Button>Click me</Button>);

      // ASSERT
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      // ARRANGE & ACT
      render(<Button>Primary Button</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('should render with secondary variant', () => {
      // ARRANGE & ACT
      render(<Button variant="secondary">Secondary Button</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600');
    });

    it('should render with danger variant', () => {
      // ARRANGE & ACT
      render(<Button variant="danger">Delete</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('should render with outline variant', () => {
      // ARRANGE & ACT
      render(<Button variant="outline">Outline Button</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });
  });

  describe('Sizes', () => {
    it('should render with small size', () => {
      // ARRANGE & ACT
      render(<Button size="sm">Small</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should render with medium size by default', () => {
      // ARRANGE & ACT
      render(<Button>Medium</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('should render with large size', () => {
      // ARRANGE & ACT
      render(<Button size="lg">Large</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      // ARRANGE & ACT
      render(<Button disabled>Disabled Button</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should show loading state', () => {
      // ARRANGE & ACT
      render(<Button loading>Loading</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should be full width when fullWidth prop is true', () => {
      // ARRANGE & ACT
      render(<Button fullWidth>Full Width</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', () => {
      // ARRANGE
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      // ACT
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // ASSERT
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      // ARRANGE
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      // ACT
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // ASSERT
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      // ARRANGE
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      );

      // ACT
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // ASSERT
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      // ARRANGE & ACT
      render(<Button className="custom-class">Custom</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should accept type prop', () => {
      // ARRANGE & ACT
      render(<Button type="submit">Submit</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render as link when href is provided', () => {
      // ARRANGE & ACT
      render(<Button href="/dashboard">Go to Dashboard</Button>);

      // ASSERT
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      // ARRANGE & ACT
      render(<Button aria-label="Close dialog">X</Button>);

      // ASSERT
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('should have aria-disabled when disabled', () => {
      // ARRANGE & ACT
      render(<Button disabled>Disabled</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-busy when loading', () => {
      // ARRANGE & ACT
      render(<Button loading>Loading</Button>);

      // ASSERT
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });
});

// 
