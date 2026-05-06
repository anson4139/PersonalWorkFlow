import AdminAccess from "./pages/AdminAccess";
import BattlePage from "./pages/BattlePage";

function App() {
  if (window.location.pathname === "/admin/access") {
    return <AdminAccess />;
  }

  return <BattlePage />;
}

export default App;
