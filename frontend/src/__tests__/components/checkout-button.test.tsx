import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckoutButton } from '@/components/checkout-button'

// Mock fetch
global.fetch = jest.fn()

// Mock window.location
delete (window as any).location
window.location = { href: 'http://localhost:3000' } as any

// Mock alert
global.alert = jest.fn()

describe('CheckoutButton Component', () => {
  const defaultProps = {
    productId: 1,
    productName: 'Test Product',
    price: 49.99,
    quantity: 1,
  }

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.alert as jest.Mock).mockClear()
  })

  it('renders with correct price', () => {
    render(<CheckoutButton {...defaultProps} />)
    expect(screen.getByRole('button', { name: /buy now - \$49.99/i })).toBeInTheDocument()
  })

  it('shows loading state when processing', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves to keep loading state
        })
    )

    render(<CheckoutButton {...defaultProps} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
    })
  })

  it('disables button when loading', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves
        })
    )

    render(<CheckoutButton {...defaultProps} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })

  it('redirects to Stripe checkout on success', async () => {
    const user = userEvent.setup()
    const mockUrl = 'https://checkout.stripe.com/test'

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: mockUrl }),
    })

    render(<CheckoutButton {...defaultProps} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(window.location.href).toBe(mockUrl)
    })
  })

  it('sends correct payload to API', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/test' }),
    })

    render(<CheckoutButton {...defaultProps} quantity={2} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stripe/checkout/create-session'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: 1,
            quantity: 2,
            success_url: expect.stringContaining('/shop/success'),
            cancel_url: expect.stringContaining('/shop?canceled=true'),
          }),
        })
      )
    })
  })

  it('shows alert on API error', async () => {
    const user = userEvent.setup()

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Error' }),
    })

    render(<CheckoutButton {...defaultProps} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initiate checkout')
      )
    })
  })

  it('shows alert on network error', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<CheckoutButton {...defaultProps} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('formats price with two decimal places', () => {
    render(<CheckoutButton {...defaultProps} price={10} />)
    expect(screen.getByText(/\$10.00/)).toBeInTheDocument()
  })
})
