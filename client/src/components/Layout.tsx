import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  FileText, 
  Menu, 
  Home, 
  TestTube, 
  File, 
  Book, 
  History, 
  BarChart3,
  User
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Amostras', href: '/samples', icon: TestTube },
  { name: 'Processos', href: '/processes', icon: File },
  { name: 'Catálogo', href: '/catalog', icon: Book },
  { name: 'Histórico', href: '/history', icon: History },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
];

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const Sidebar = ({ className = "" }: { className?: string }) => (
    <div className={`flex min-h-0 flex-1 flex-col bg-gray-900 ${className}`}>
      <div className="flex h-16 flex-shrink-0 items-center px-4">
        <FileText className="h-8 w-8 text-white mr-3" />
        <h1 className="text-white text-lg font-semibold">GestãoPregões</h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* User Profile */}
      <div className="flex flex-shrink-0 bg-gray-700 p-4">
        <div className="flex items-center w-full">
          <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName || user?.email || 'Usuário'}
            </p>
            <p className="text-xs font-medium text-gray-300">
              {user?.role || 'Analista'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/api/logout'}
            className="text-gray-300 hover:text-white hover:bg-gray-600 ml-2"
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
          <Sidebar />
        </div>
      )}

      {/* Mobile Menu */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-4 left-4 z-50 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className={`flex flex-col flex-1 ${!isMobile ? 'md:pl-64' : ''}`}>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
