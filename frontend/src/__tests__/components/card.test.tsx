import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

describe('Card Components', () => {
  it('renders Card component', () => {
    render(
      <Card data-testid="card">
        <p>Card content</p>
      </Card>
    )
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders complete card with all sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('Test Footer')).toBeInTheDocument()
  })

  it('applies custom className to Card', () => {
    render(
      <Card className="custom-class" data-testid="card">
        Content
      </Card>
    )
    expect(screen.getByTestId('card')).toHaveClass('custom-class')
  })

  it('CardTitle renders as h3 element', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.tagName).toBe('H3')
  })
})
