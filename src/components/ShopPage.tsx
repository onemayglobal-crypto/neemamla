import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import neemArt from '../assets/botanical-labels/neem.png'
import amlaArt from '../assets/botanical-labels/amla.png'
import neemamlaArt from '../assets/botanical-labels/neemamla.png'
import bhringrajArt from '../assets/botanical-labels/bhringraj.png'
import hibiscusArt from '../assets/botanical-labels/hibiscus.png'
import './shop.css'

const SIZES = [50, 100, 150, 200, 250] as const
type BottleSize = typeof SIZES[number]
type Product = {
  id: string
  name: string
  note: string
  art: string
  accent: string
  prices: Record<BottleSize, number>
}

const PRODUCTS: Product[] = [
  { id: 'neem', name: 'Neem', note: 'A fresh, grounding botanical ritual.', art: neemArt, accent: '#6a8050', prices: { 50: 129, 100: 229, 150: 319, 200: 399, 250: 479 } },
  { id: 'amla', name: 'Amla', note: 'A bright, nourishing moment for your lengths.', art: amlaArt, accent: '#c08b31', prices: { 50: 139, 100: 249, 150: 349, 200: 439, 250: 529 } },
  { id: 'neemamla', name: 'Neemamla', note: 'The signature blend of neem and amla.', art: neemamlaArt, accent: '#75a894', prices: { 50: 149, 100: 269, 150: 379, 200: 479, 250: 579 } },
  { id: 'bhringraj', name: 'Bhringraj', note: 'A quiet herb garden in your care ritual.', art: bhringrajArt, accent: '#8b9fc1', prices: { 50: 139, 100: 249, 150: 349, 200: 439, 250: 529 } },
  { id: 'hibiscus', name: 'Hibiscus', note: 'A vivid floral touch for softness and shine.', art: hibiscusArt, accent: '#bb5350', prices: { 50: 149, 100: 269, 150: 379, 200: 479, 250: 579 } },
]

type CartItem = {
  key: string
  productId: string
  name: string
  size: BottleSize
  price: number
  quantity: number
  art: string
}

const money = (amount: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(amount)

function ShopBottle({ product }: { product: Product }) {
  return (
    <div className="shop-bottle" role="img" aria-label={`${product.name} botanical hair oil bottle`}>
      <span className="shop-bottle__cap" />
      <span className="shop-bottle__neck" />
      <span className="shop-bottle__glass">
        <span className="shop-bottle__shine" />
        <span className="shop-bottle__label">
          <img src={product.art} alt="" loading="lazy" decoding="async" />
          <span className="shop-bottle__brand">neem<span>amla</span></span>
          <span className="shop-bottle__variant">{product.name}</span>
          <span className="shop-bottle__small">BOTANICAL HAIR OIL</span>
        </span>
      </span>
      <span className="shop-bottle__base" />
    </div>
  )
}

function BagIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.5h14l1 12H4l1-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
}

export default function ShopPage() {
  const [selectedSizes, setSelectedSizes] = useState<Record<string, BottleSize>>(() => Object.fromEntries(PRODUCTS.map((product) => [product.id, 100])) as Record<string, BottleSize>)
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(PRODUCTS.map((product) => [product.id, 1])) as Record<string, number>)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('neemamla-cart')
      return saved ? JSON.parse(saved) as CartItem[] : []
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [addedProduct, setAddedProduct] = useState<string | null>(null)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  useEffect(() => {
    localStorage.setItem('neemamla-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (!cartOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCartOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [cartOpen])

  const addToCart = (product: Product) => {
    const size = selectedSizes[product.id]
    const key = `${product.id}-${size}`
    const quantity = quantities[product.id] ?? 1
    setCart((items) => {
      const existing = items.find((item) => item.key === key)
      if (existing) return items.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item)
      return [...items, { key, productId: product.id, name: product.name, size, price: product.prices[size], quantity, art: product.art }]
    })
    setAddedProduct(product.id)
    window.setTimeout(() => setAddedProduct((current) => current === product.id ? null : current), 1200)
    setCartOpen(true)
  }

  const updateCartQuantity = (key: string, amount: number) => {
    setCart((items) => items.flatMap((item) => item.key === key
      ? amount <= 0 ? [] : [{ ...item, quantity: amount }]
      : [item]))
  }

  return (
    <main className="shop-page">
      <header className="shop-header">
        <a className="shop-wordmark" href="/#top" aria-label="Neemamla home">neem<span>amla</span><i>®</i></a>
        <a className="shop-back-link" href="/#top">BACK TO THE RITUAL <span aria-hidden="true">↗</span></a>
        <button className="shop-cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${itemCount} items`}>
          <BagIcon /><span>YOUR BAG</span><b>{itemCount}</b>
        </button>
      </header>

      <section className="shop-intro">
        <span className="shop-eyebrow"><i /> THE NEEMAMLA BOTANICAL COLLECTION <i /></span>
        <h1>Find your <em>oil ritual.</em></h1>
        <p>Five botanical blends. A size for every kind of care.</p>
        <span className="shop-price-note">MARKET-ALIGNED SUGGESTED PRICES · INR · CONFIRM BEFORE LAUNCH</span>
      </section>

      <section className="shop-grid" aria-label="Shop botanical hair oils">
        {PRODUCTS.map((product, index) => {
          const size = selectedSizes[product.id]
          const price = product.prices[size]
          const quantity = quantities[product.id] ?? 1
          return (
            <article className="shop-product" key={product.id} style={{ '--product-accent': product.accent } as CSSProperties}>
              <div className="shop-product__visual">
                <span className="shop-product__index">0{index + 1} <i /> BOTANICAL OIL</span>
                <span className="shop-product__halo" aria-hidden="true" />
                <ShopBottle product={product} />
                <span className="shop-product__botanical" aria-hidden="true">✳</span>
              </div>
              <div className="shop-product__details">
                <div className="shop-product__title-row"><h2>{product.name}</h2><span>{money(price)}</span></div>
                <p className="shop-product__note">{product.note}</p>
                <span className="shop-field-label">CHOOSE SIZE</span>
                <div className="shop-sizes" role="group" aria-label={`${product.name} bottle size`}>
                  {SIZES.map((option) => (
                    <button key={option} type="button" className={size === option ? 'is-selected' : ''} onClick={() => setSelectedSizes((current) => ({ ...current, [product.id]: option }))} aria-pressed={size === option}>
                      {option}<small>ml</small>
                    </button>
                  ))}
                </div>
                <div className="shop-product__actions">
                  <div className="shop-quantity" aria-label={`Quantity for ${product.name}`}>
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQuantities((current) => ({ ...current, [product.id]: Math.max(1, quantity - 1) }))}>−</button>
                    <output>{quantity}</output>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQuantities((current) => ({ ...current, [product.id]: Math.min(99, quantity + 1) }))}>+</button>
                  </div>
                  <button className="shop-add-button" type="button" onClick={() => addToCart(product)}>
                    {addedProduct === product.id ? 'ADDED TO BAG' : 'ADD TO BAG'} <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <footer className="shop-footer"><a href="/#top">neem<span>amla</span></a><span>ROOTED IN NATURE · MADE FOR YOUR RITUAL</span><a href="/#top">BACK TO HOME ↑</a></footer>

      {cartOpen && (
        <div className="shop-cart-layer">
          <button className="shop-cart-scrim" type="button" aria-label="Close shopping bag" onClick={() => setCartOpen(false)} />
          <aside className="shop-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="shop-cart-title">
            <div className="shop-cart-drawer__header">
              <div><span className="shop-eyebrow">YOUR BOTANICAL EDIT</span><h2 id="shop-cart-title">Shopping bag <small>({itemCount})</small></h2></div>
              <button type="button" className="shop-cart-close" aria-label="Close shopping bag" onClick={() => setCartOpen(false)}>×</button>
            </div>
            {cart.length === 0 ? (
              <div className="shop-cart-empty"><span aria-hidden="true">✳</span><p>Your bag is waiting for a little care.</p><button type="button" onClick={() => setCartOpen(false)}>EXPLORE THE OILS <b aria-hidden="true">↓</b></button></div>
            ) : (
              <>
                <div className="shop-cart-items">
                  {cart.map((item) => (
                    <article className="shop-cart-item" key={item.key}>
                      <img src={item.art} alt="" />
                      <div className="shop-cart-item__info"><h3>{item.name}</h3><span>{item.size} ml · {money(item.price)}</span>
                        <div className="shop-cart-item__quantity"><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateCartQuantity(item.key, item.quantity - 1)}>−</button><output>{item.quantity}</output><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateCartQuantity(item.key, item.quantity + 1)}>+</button></div>
                      </div>
                      <div className="shop-cart-item__end"><b>{money(item.price * item.quantity)}</b><button type="button" aria-label={`Remove ${item.name} from bag`} onClick={() => updateCartQuantity(item.key, 0)}>REMOVE</button></div>
                    </article>
                  ))}
                </div>
                <div className="shop-cart-total"><span>SUBTOTAL</span><b>{money(subtotal)}</b></div>
                <p className="shop-cart-disclaimer">Suggested market pricing. Checkout and delivery details can be connected once your store is ready.</p>
                <button className="shop-cart-continue" type="button" onClick={() => setCartOpen(false)}>CONTINUE EXPLORING</button>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}
