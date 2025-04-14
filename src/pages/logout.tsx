import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fine } from "@/lib/fine";
import { Loader2 } from "lucide-react";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      await fine.auth.signOut();
      navigate("/");
    };

    logout();
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Logging out...</p>
      </div>
    </div>
  );
}