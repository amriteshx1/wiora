interface Props{
    children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
    return (
        <div className="wiora-app h-screen bg-background">
            {children}
        </div>
    );
};

export default Layout;