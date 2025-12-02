"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckoutButton } from "@/components/checkout-button"

interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  stock_quantity: number
  category: string
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`)
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            NJ Stars
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/news" className="hover:text-primary transition-colors">
              News
            </Link>
            <Link href="/shop" className="hover:text-primary transition-colors font-semibold">
              Shop
            </Link>
            <Link href="/events" className="hover:text-primary transition-colors">
              Events
            </Link>
            <Link href="/portal/login">
              <Button>Portal Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Merch Store</h1>
          <p className="text-xl">
            Show your NJ Stars pride with official team merchandise
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-64 bg-muted"></div>
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                No products available at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden flex flex-col">
                  {product.image_url && (
                    <div className="relative h-64 w-full">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {product.description}
                    </p>
                    <p className="text-2xl font-bold mt-4">
                      ${product.price.toFixed(2)}
                    </p>
                    {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                      <p className="text-sm text-orange-600 mt-2">
                        Only {product.stock_quantity} left!
                      </p>
                    )}
                    {product.stock_quantity === 0 && (
                      <p className="text-sm text-red-600 mt-2">Out of stock</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    {product.stock_quantity > 0 ? (
                      <CheckoutButton
                        productId={product.id}
                        productName={product.name}
                        price={product.price}
                      />
                    ) : (
                      <Button disabled className="w-full">
                        Out of Stock
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} NJ Stars Basketball. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
