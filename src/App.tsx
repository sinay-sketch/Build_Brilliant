import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import TopBar from './components/TopBar'
import Login from './pages/Login'
import Home from './pages/Home'
import Course from './pages/Course'
import Lesson from './pages/Lesson'
import Profile from './pages/Profile'

function AppLayout() {
  return (
    <>
      <TopBar />
      <main className="pb-12">
        <Outlet />
      </main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/course" element={<Course />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/lesson/:lessonId" element={<Lesson />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
