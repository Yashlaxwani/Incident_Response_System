import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import Footer from './Footer';
const Layout = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer/>
      </div>
    </div>
  )
}

export default Layout

