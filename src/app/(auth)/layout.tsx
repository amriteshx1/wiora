import React from "react";

import "@/modules/auth/ui/styles/auth.css";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="auth-root flex min-h-svh flex-col justify-center py-8">
      <div className="auth-shell">{children}</div>
    </div>
  );
};

export default Layout;
