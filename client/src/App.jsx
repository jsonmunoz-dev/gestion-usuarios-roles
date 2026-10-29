import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { UsersPage } from './pages/UsersPage';
import { ForbiddenPage } from './pages/ForbiddenPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="sin-permiso" element={<ForbiddenPage />} />
          <Route element={<ProtectedRoute roles={['admin', 'editor']} />}>
            <Route path="usuarios" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
