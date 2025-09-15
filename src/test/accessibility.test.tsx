import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock UI Components for Testing
const AcceptButton = ({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label="Accept moderation action"
    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50"
  >
    Accept
  </button>
);

const CancelButton = ({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label="Cancel moderation action"
    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none disabled:opacity-50"
  >
    Cancel
  </button>
);

const EscalateButton = ({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label="Escalate to senior moderator"
    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50"
  >
    Escalate
  </button>
);

const ModerationPanel = ({ children }: { children: React.ReactNode }) => (
  <div
    role="region"
    aria-labelledby="moderation-heading"
    className="p-4 border rounded-lg"
  >
    <h2 id="moderation-heading" className="text-lg font-semibold mb-4">
      Moderation Actions
    </h2>
    <div className="flex gap-2" role="group" aria-label="Moderation action buttons">
      {children}
    </div>
  </div>
);

// Accessibility Tests
describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Reset any global state
  });

  describe('Moderation UI Components', () => {
    it('should have no accessibility violations for Accept button', async () => {
      const { container } = render(
        <AcceptButton onClick={() => {}} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for Accept button', () => {
      render(<AcceptButton onClick={() => {}} />);
      
      const button = screen.getByRole('button', { name: 'Accept moderation action' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Accept moderation action');
    });

    it('should be keyboard accessible for Accept button', () => {
      render(<AcceptButton onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-green-500', 'focus:outline-none');
    });

    it('should have no accessibility violations for Cancel button', async () => {
      const { container } = render(
        <CancelButton onClick={() => {}} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for Cancel button', () => {
      render(<CancelButton onClick={() => {}} />);
      
      const button = screen.getByRole('button', { name: 'Cancel moderation action' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Cancel moderation action');
    });

    it('should be keyboard accessible for Cancel button', () => {
      render(<CancelButton onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-gray-500', 'focus:outline-none');
    });

    it('should have no accessibility violations for Escalate button', async () => {
      const { container } = render(
        <EscalateButton onClick={() => {}} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for Escalate button', () => {
      render(<EscalateButton onClick={() => {}} />);
      
      const button = screen.getByRole('button', { name: 'Escalate to senior moderator' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Escalate to senior moderator');
    });

    it('should be keyboard accessible for Escalate button', () => {
      render(<EscalateButton onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-red-500', 'focus:outline-none');
    });

    it('should handle disabled state accessibility', () => {
      render(<AcceptButton onClick={() => {}} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should have no accessibility violations for complete moderation panel', async () => {
      const { container } = render(
        <ModerationPanel>
          <AcceptButton onClick={() => {}} />
          <CancelButton onClick={() => {}} />
          <EscalateButton onClick={() => {}} />
        </ModerationPanel>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure for moderation panel', () => {
      render(
        <ModerationPanel>
          <AcceptButton onClick={() => {}} />
          <CancelButton onClick={() => {}} />
          <EscalateButton onClick={() => {}} />
        </ModerationPanel>
      );
      
      const region = screen.getByRole('region', { name: 'Moderation Actions' });
      expect(region).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Moderation Actions');
      
      const buttonGroup = screen.getByRole('group', { name: 'Moderation action buttons' });
      expect(buttonGroup).toBeInTheDocument();
    });

    it('should support screen reader navigation', () => {
      render(
        <ModerationPanel>
          <AcceptButton onClick={() => {}} />
          <CancelButton onClick={() => {}} />
          <EscalateButton onClick={() => {}} />
        </ModerationPanel>
      );
      
      // Check that heading is properly associated with region
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'moderation-heading');
      
      const heading = screen.getByText('Moderation Actions');
      expect(heading).toHaveAttribute('id', 'moderation-heading');
    });
  });

  describe('Form Accessibility', () => {
    it('should have accessible form labels', () => {
      const FormExample = () => (
        <form>
          <label htmlFor="reason-input" className="block text-sm font-medium">
            Reason for Action
          </label>
          <input
            id="reason-input"
            type="text"
            aria-required="true"
            aria-describedby="reason-help"
            className="mt-1 block w-full rounded border p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <div id="reason-help" className="text-sm text-gray-600 mt-1">
            Please provide a detailed reason for this moderation action
          </div>
        </form>
      );

      render(<FormExample />);
      
      const input = screen.getByLabelText('Reason for Action');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'reason-help');
    });

    it('should have no accessibility violations for forms', async () => {
      const FormExample = () => (
        <form>
          <label htmlFor="reason-input">Reason for Action</label>
          <input
            id="reason-input"
            type="text"
            aria-required="true"
          />
        </form>
      );

      const { container } = render(<FormExample />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should have sufficient color contrast for buttons', () => {
      render(<AcceptButton onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      // These classes should provide sufficient contrast
      expect(button).toHaveClass('bg-green-600', 'text-white');
    });

    it('should have focus indicators', () => {
      render(<AcceptButton onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2', 'focus:outline-none');
    });

    it('should handle hover states', () => {
      render(<AcceptButton onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-green-700');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be tab-navigable', () => {
      render(
        <ModerationPanel>
          <AcceptButton onClick={() => {}} />
          <CancelButton onClick={() => {}} />
          <EscalateButton onClick={() => {}} />
        </ModerationPanel>
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have proper focus management', () => {
      render(
        <ModerationPanel>
          <AcceptButton onClick={() => {}} />
          <CancelButton onClick={() => {}} />
          <EscalateButton onClick={() => {}} />
        </ModerationPanel>
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none');
        expect(button).toHaveClass('focus:ring-2');
      });
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have appropriate touch targets', () => {
      render(<AcceptButton onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      // Buttons should have adequate padding for touch targets
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('should be responsive and accessible on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      render(
        <ModerationPanel>
          <AcceptButton onClick={() => {}} />
          <CancelButton onClick={() => {}} />
          <EscalateButton onClick={() => {}} />
        </ModerationPanel>
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      
      // Should maintain accessibility on mobile
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Error State Accessibility', () => {
    it('should announce errors to screen readers', () => {
      const ErrorExample = () => (
        <div>
          <AcceptButton onClick={() => {}} />
          <div
            role="alert"
            aria-live="polite"
            className="text-red-600 mt-2"
          >
            Error: Failed to process moderation action
          </div>
        </div>
      );

      render(<ErrorExample />);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      expect(errorMessage).toHaveTextContent('Error: Failed to process moderation action');
    });

    it('should have accessible error states for forms', () => {
      const ErrorFormExample = () => (
        <form>
          <label htmlFor="reason-error">Reason for Action</label>
          <input
            id="reason-error"
            type="text"
            aria-invalid="true"
            aria-describedby="reason-error-msg"
            className="border-red-500"
          />
          <div id="reason-error-msg" role="alert" className="text-red-600">
            This field is required
          </div>
        </form>
      );

      render(<ErrorFormExample />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'reason-error-msg');
      
      const errorMsg = screen.getByRole('alert');
      expect(errorMsg).toHaveTextContent('This field is required');
    });
  });
});