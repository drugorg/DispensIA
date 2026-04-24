import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Preferences } from '@capacitor/preferences'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import AddScreen from './screens/AddScreen'
import CartScreen from './screens/CartScreen'
import SettingsScreen from './screens/SettingsScreen'
import BottomNav from './components/BottomNav'
import RecipeModal from './components/RecipeModal'
 
const queryClient = new QueryClient()
const CLERK_KEY = 'pk_live_Y2xlcmsuZGlzcGVuc2lhLmFwcCQ'
 
const tokenCache = {
  async getToken(key) {
    try {
      const { value } = await Preferences.get({ key })
      return value
    } catch { return null }
  },
  async saveToken(key, value) {
    try {
      await Preferences.set({ key, value })
    } catch {}
  },
  async clearToken(key) {
    try {
      await Preferences.remove({ key })
    } catch {}
  },
}
 
function AppInner() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [activeModal, setActiveModal] = useState(null)
  const [timedOut, setTimedOut] = useState(false)
 
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [])
 
  if (!isLoaded && !timedOut) return (
    <div className="splash">
      <div className="splash-logo">Dispens<span>IA</span></div>
    </div>
  )
 
  if (!isSignedIn) return <LoginScreen />
 
  return (
    <div className="app-shell">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeScreen userId={user?.id} onOpenRecipe={setActiveModal} />} />
          <Route path="/add" element={<AddScreen userId={user?.id} />} />
          <Route path="/cart" element={<CartScreen userId={user?.id} onOpenRecipe={setActiveModal} />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
      {activeModal && (
        <RecipeModal recipe={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </div>
  )
}
 
export default function App() {
  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      tokenCache={tokenCache}
      frontendApi="clerk.dispensia.app"
    >
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </ClerkProvider>
  )
}D
 