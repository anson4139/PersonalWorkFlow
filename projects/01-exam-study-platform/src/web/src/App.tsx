import AdminAccess from './pages/AdminAccess'
import Home from './pages/Home'

function App() {
  if (window.location.pathname === '/admin/access') {
    return <AdminAccess />
  }

  return <Home />
}

export default App

