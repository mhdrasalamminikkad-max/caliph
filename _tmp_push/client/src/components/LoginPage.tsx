import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check credentials
    if (username === "user" && password === "caliph786") {
      // Store login state
      localStorage.setItem("isAuthenticated", "true");
      
      toast({
        title: "Login Successful",
        description: "Welcome to Caliph Attendance!",
      });
      
      setTimeout(() => {
        onLogin();
      }, 500);
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 dark:from-emerald-900 dark:via-green-800 dark:to-teal-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl rotate-12 opacity-40 blur-sm animate-float"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full opacity-30 blur-sm animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl -rotate-12 opacity-35 blur-sm animate-float"></div>
      </div>

      <Card className="w-full max-w-md p-8 sm:p-10 md:p-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl border-4 border-white/60 shadow-[0_20px_80px_-15px_rgba(0,200,83,0.4)] rounded-3xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/caliph_logo.png"
            alt="Caliph Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-lg mb-4"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'w-24 h-24 sm:w-28 sm:h-28 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-4';
              fallback.textContent = 'C';
              target.parentNode?.appendChild(fallback);
            }}
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white text-center">
            Caliph Attendance
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 font-semibold mt-2 text-center">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-bold text-gray-700 dark:text-gray-200">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 text-base border-2 border-gray-300 focus:border-emerald-500 rounded-xl font-medium"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold text-gray-700 dark:text-gray-200">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base border-2 border-gray-300 focus:border-emerald-500 rounded-xl font-medium"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 sm:h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-base sm:text-lg font-extrabold rounded-xl shadow-lg hover:shadow-xl active:shadow-md transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
          >
            {isLoading ? (
              <>
                <span className="material-icons animate-spin mr-2">refresh</span>
                Signing in...
              </>
            ) : (
              <>
                <span className="material-icons mr-2">login</span>
                Sign In
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
