import { render, screen, waitFor } from '@/__ tests__/utils/test-utils'
import ShopPage from '@/app/shop/page'

// Mock fetch
global.fetch = jest.fn()

const mockProducts = [
  {
    id: 1,
    name: 'Test Jersey',
    description: 'Official jersey',
    price: 59.99,
    image_url: 'https://example.com/jersey.jpg',
    stock_quantity: 50,
    category: 'Jersey',
  },
  {
    id: 2,
    name: 'Test T-Shirt',
    description: 'Practice shirt',
    price: 24.99,
    image_url: 'https://example.com/shirt.jpg',
    stock_quantity: 0,
    category: 'T-Shirt',
  },
  {
    id: 3,
    name: 'Test Hat',
    description: 'Team hat',
    price: 27.99,
    image_url: 'https://example.com/hat.jpg',
    stock_quantity: 5,
    category: 'Accessories',
  },
]

describe('Shop Page', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders shop page header', () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<ShopPage />)

    expect(screen.getByRole('heading', { name: /merch store/i })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves
        })
    )

    render(<ShopPage />)

    // Should show loading skeletons
    const loadingCards = screen.getAllByRole('article', { hidden: true })
    expect(loadingCards.length).toBeGreaterThan(0)
  })

  it('displays products after loading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    })

    render(<ShopPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Jersey')).toBeInTheDocument()
    })

    expect(screen.getByText('Test T-Shirt')).toBeInTheDocument()
    expect(screen.getByText('Test Hat')).toBeInTheDocument()
  })

  it('displays product prices correctly', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockProducts[0]],
    })

    render(<ShopPage />)

    await waitFor(() => {
      expect(screen.getByText('$59.99')).toBeInTheDocument()
    })
  })

  it('shows out of stock message for unavailable products', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockProducts[1]],
    })

    render(<ShopPage />)

    await waitFor(() => {
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
    })
  })

  it('shows low stock warning', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockProducts[2]],
    })

    render(<ShopPage />)

    await waitFor(() => {
      expect(screen.getByText(/only 5 left/i)).toBeInTheDocument()
    })
  })

  it('disables buy button for out of stock items', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockProducts[1]],
    })

    render(<ShopPage />)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /out of stock/i })
      expect(button).toBeDisabled()
    })
  })

  it('shows empty state when no products', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<ShopPage />)

    await waitFor(() => {
      expect(screen.getByText(/no products available/i)).toBeInTheDocument()
    })
  })

  it('displays navigation links', () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<ShopPage />)

    expect(screen.getByRole('link', { name: /nj stars/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /news/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /events/i })).toBeInTheDocument()
  })
})
