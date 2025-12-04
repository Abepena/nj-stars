import { render, screen, waitFor } from '@testing-library/react'
import { NewsFeed } from '@/components/news-feed'

// Mock fetch
global.fetch = jest.fn()

const mockFeedData = [
  {
    id: 'blog_1',
    type: 'blog',
    title: 'Test Blog Post',
    content: 'Test content',
    excerpt: 'Test excerpt',
    image_url: 'https://example.com/image1.jpg',
    author: 'Test Author',
    published_date: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ig_1',
    type: 'instagram',
    title: 'Instagram Post',
    content: 'Instagram content',
    image_url: 'https://example.com/image2.jpg',
    published_date: '2024-01-02T00:00:00Z',
    permalink: 'https://instagram.com/p/test',
    media_type: 'IMAGE',
  },
]

describe('NewsFeed Component', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('shows loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves to keep loading state
        })
    )

    render(<NewsFeed />)

    // Should show loading skeletons
    const loadingCards = screen.getAllByRole('article', { hidden: true })
    expect(loadingCards.length).toBeGreaterThan(0)
  })

  it('renders feed items after loading', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFeedData,
    })

    render(<NewsFeed />)

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post')).toBeInTheDocument()
    })

    expect(screen.getByText('Instagram Post')).toBeInTheDocument()
  })

  it('displays blog post with author', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockFeedData[0]],
    })

    render(<NewsFeed />)

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post')).toBeInTheDocument()
    })

    expect(screen.getByText(/Test Author/)).toBeInTheDocument()
  })

  it('displays Instagram badge for Instagram posts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockFeedData[1]],
    })

    render(<NewsFeed />)

    await waitFor(() => {
      expect(screen.getByText('Instagram')).toBeInTheDocument()
    })
  })

  it('displays Instagram link for Instagram posts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockFeedData[1]],
    })

    render(<NewsFeed />)

    await waitFor(() => {
      const link = screen.getByText(/View on Instagram/)
      expect(link).toHaveAttribute('href', 'https://instagram.com/p/test')
    })
  })

  it('handles fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<NewsFeed />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('formats dates correctly', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockFeedData[0]],
    })

    render(<NewsFeed />)

    await waitFor(() => {
      expect(screen.getByText(/Jan 01, 2024/)).toBeInTheDocument()
    })
  })
})
