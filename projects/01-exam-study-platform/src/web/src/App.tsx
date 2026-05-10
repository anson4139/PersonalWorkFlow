import AdminAccess from "./pages/AdminAccess";
import Home from "./pages/Home";

function App() {
  if (window.location.pathname === "/admin/access") {
    return <AdminAccess />;
  }

  return (
    <>
      <Home />
      <div className="fixed bottom-2 right-3 text-[10px] text-gray-600 select-none pointer-events-none">
        v{__APP_VERSION__}
      </div>
    </>
  );
}

export default App;
