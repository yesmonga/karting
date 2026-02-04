interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Authentification désactivée - Accès public à toutes les pages
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
