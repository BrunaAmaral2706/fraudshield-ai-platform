import { Outlet, useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname}>
      {children ?? <Outlet />}
    </div>
  );
}
