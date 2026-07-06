import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './CapaGUI/AuthContext';
import { Shell } from './CapaGUI/Layout/Shell';
import { LoginPage } from './CapaGUI/pages/LoginPage';
import { DashboardPage } from './CapaGUI/pages/DashboardPage';
import { PerfilesPage } from './CapaGUI/pages/PerfilesPage';
import { UsuariosPage } from './CapaGUI/pages/UsuariosPage';
import { PaisesPage } from './CapaGUI/pages/PaisesPage';
import { FielesPage } from './CapaGUI/pages/FielesPage';
import { PapasPage } from './CapaGUI/pages/PapasPage';
import { CongregacionesPage } from './CapaGUI/pages/CongregacionesPage';
import { MiradasEspiritualesPage } from './CapaGUI/pages/MiradasEspiritualesPage';
import { ParametrosPage } from './CapaGUI/pages/ParametrosPage';

function RequiereAuth() {
  const { token } = useAuth();
  const loc = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequiereAuth />}>
        <Route element={<Shell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/perfiles" element={<PerfilesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/paises" element={<PaisesPage />} />
          <Route path="/fieles" element={<FielesPage />} />
          <Route path="/papas" element={<PapasPage />} />
          <Route path="/congregaciones" element={<CongregacionesPage />} />
          <Route path="/miradas-espirituales" element={<MiradasEspiritualesPage />} />
          <Route path="/parametros" element={<ParametrosPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
