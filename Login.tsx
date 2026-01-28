import { useState } from "react";
import { User, UserRole } from "@/types/room";
import { Building2, Sparkles, Wrench, ChevronRight } from "lucide-react";

interface LoginProps {
  onLogin: (user: User) => void;
}

const roles: { value: UserRole; label: string; email: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    value: 'super',
    label: 'Recepción',
    email: 'super@hotel.com',
    icon: <Building2 className="w-7 h-7" />,
    description: 'Control total de habitaciones',
    color: 'from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30',
  },
  {
    value: 'limp',
    label: 'Limpieza',
    email: 'limp@hotel.com',
    icon: <Sparkles className="w-7 h-7" />,
    description: 'Gestión de limpieza diaria',
    color: 'from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30',
  },
  {
    value: 'mant',
    label: 'Mantenimiento',
    email: 'mant@hotel.com',
    icon: <Wrench className="w-7 h-7" />,
    description: 'Resolver problemas técnicos',
    color: 'from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30',
  },
];

export function Login({ onLogin }: LoginProps) {
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  const handleLogin = (role: typeof roles[0]) => {
    onLogin({ email: role.email, role: role.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 shadow-soft">
            <span className="text-primary font-bold text-2xl">H</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Hotel Manager</h1>
          <p className="text-muted-foreground">Selecciona tu rol para continuar</p>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          {roles.map((role, index) => (
            <button
              key={role.value}
              onClick={() => handleLogin(role)}
              onMouseEnter={() => setHoveredRole(role.value)}
              onMouseLeave={() => setHoveredRole(null)}
              className={`
                w-full p-5 rounded-2xl text-left transition-all duration-300
                bg-gradient-to-r ${role.color}
                border border-transparent hover:border-border/50
                hover:shadow-medium hover:-translate-y-0.5
                active:scale-[0.98]
                animate-fade-in
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-card shadow-sm flex items-center justify-center text-foreground">
                  {role.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg text-foreground">{role.label}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                    hoveredRole === role.value ? 'translate-x-1' : ''
                  }`}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Sistema de gestión hotelera v1.0
        </p>
      </div>
    </div>
  );
}
