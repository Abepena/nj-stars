import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

// Mock session for testing
export const mockSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'parent',
  },
  expires: '2099-01-01',
}

export const mockAdminSession = {
  user: {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  },
  expires: '2099-01-01',
}

// Custom render with providers
interface AllTheProvidersProps {
  children: React.ReactNode
  session?: any
}

const AllTheProviders = ({ children, session = mockSession }: AllTheProvidersProps) => {
  return <SessionProvider session={session}>{children}</SessionProvider>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { session?: any }
) => {
  const { session, ...renderOptions } = options || {}
  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders session={session}>{children}</AllTheProviders>,
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }
