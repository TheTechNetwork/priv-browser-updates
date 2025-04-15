import React from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface SecurityBannerProps {
  showSensitiveData?: boolean;
}

export const SecurityBanner: React.FC<SecurityBannerProps> = ({ 
  showSensitiveData = false 
}) => {
  const { user } = useAuth();

  return (
    <div className={`mb-6 rounded-lg border p-4 ${showSensitiveData ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start gap-3">
        {showSensitiveData ? (
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
        ) : (
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
        )}
        <div>
          <h3 className={`text-sm font-medium ${showSensitiveData ? 'text-yellow-800' : 'text-blue-800'}`}>
            {showSensitiveData ? 'Sensitive Information Warning' : 'Secure Area'}
          </h3>
          <div className={`mt-1 text-sm ${showSensitiveData ? 'text-yellow-700' : 'text-blue-700'}`}>
            {showSensitiveData ? (
              <>
                <p>
                  This page contains sensitive information including GitHub tokens and other secrets.
                  Never share this information or screenshots of this page.
                </p>
                <p className="mt-1">
                  Authenticated as: <span className="font-medium">{user?.name || user?.login}</span>
                </p>
              </>
            ) : (
              <>
                <p>
                  This is a protected area that requires authentication.
                  All actions are logged and associated with your account.
                </p>
                <p className="mt-1">
                  Authenticated as: <span className="font-medium">{user?.name || user?.login}</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};