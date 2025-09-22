import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ModerationQueue from '@/components/ModerationQueue';
import { clearQueue, submitReport } from '@/lib/moderation';
import { vi } from 'vitest';

const WithRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ModerationQueue', () => {
  beforeEach(async () => {
    await clearQueue();
  });

  it('re-renders after reports are fetched', async () => {
    vi.useFakeTimers();

    render(
      <WithRouter>
        <ModerationQueue pollIntervalMs={200} />
      </WithRouter>
    );

    // Initially empty
    expect(screen.getByText(/No reports in queue/i)).toBeInTheDocument();

    // Submit a report asynchronously (simulates arriving after mount)
    await submitReport({ targetId: '123', content: 'abusive content here', contentType: 'message' });

    // Advance timers to trigger polling and subsequent state update
    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    // Verify the queue list renders with new report
    const list = screen.getByLabelText('queue-list');
    expect(list).toBeInTheDocument();
    expect(within(list).getByText(/abusive content here/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('escalation updates status without timing out', async () => {
    vi.useFakeTimers();

    render(
      <WithRouter>
        <ModerationQueue pollIntervalMs={100} />
      </WithRouter>
    );

    await submitReport({ targetId: 't1', content: 'threat: attack', contentType: 'message' });

    // Allow one poll tick to pick up the item
    await act(async () => {
      vi.advanceTimersByTime(120);
    });

    const list = screen.getByLabelText('queue-list');
    const button = within(list).getByRole('button', { name: /escalate/i });
    // Click escalate
    await act(async () => {
      button.click();
    });

    // Status changes immediately
    const status = within(list).getByText(/Status:\s*escalated/i);
    expect(status).toBeInTheDocument();

    // Let poll run again to ensure no timers hang
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    vi.useRealTimers();
  });
});

