import ScrollSequence from './components/ScrollSequence'
import ShopPage from './components/ShopPage'

function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/shop') return <ShopPage />
  return <ScrollSequence />
}

export default App
