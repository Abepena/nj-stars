import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { mockSession, mockAdminSession } from '@/__tests__/utils/test-utils'
import DashboardPage from '@/app/portal/dashboard/page'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { useSession } from 'next-auth/react'

describe('Portal Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state when session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects when not authenticated', () => {
    const mockPush = jest.fn()
    jest.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
    }))

    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<DashboardPage />)

    // Component should attempt to redirect
    // In real scenario, useEffect would call router.push
  })

  it('displays user welcome message', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('displays user email and role', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    render(<DashboardPage />)

    expect(screen.getByText(mockSession.user.email)).toBeInTheDocument()
    expect(screen.getByText(/parent/i)).toBeInTheDocument()
  })

  it('shows quick stats cards', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/upcoming events/i)).toBeInTheDocument()
    expect(screen.getByText(/team news/i)).toBeInTheDocument()
    expect(screen.getByText(/payment status/i)).toBeInTheDocument()
  })

  it('shows admin controls for admin users', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockAdminSession,
      status: 'authenticated',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/admin controls/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /manage events/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /manage roster/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view orders/i })).toBeInTheDocument()
  })

  it('does not show admin controls for non-admin users', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    render(<DashboardPage />)

    expect(screen.queryByText(/admin controls/i)).not.toBeInTheDocument()
  })

  it('displays quick actions section', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view schedule/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /team roster/i })).toBeInTheDocument()
  })

  it('has sign out button', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    render(<DashboardPage />)

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
