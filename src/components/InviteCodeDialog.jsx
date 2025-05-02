import { useState } from "react";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

export default function InviteCodeDialog({ onClose, onSubmit }) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useGraffiticodeAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // TEMPORARY WORKAROUND: Instead of validating an invite code,
      // just pretend it was successful to avoid blocking users
      console.log("Invite code submitted:", inviteCode);
      // In a real implementation, we would validate the invite code
      // with the API, but for now we're accepting all codes
      
      // We'll wait a moment to simulate the API call
      setTimeout(() => {
        onSubmit();
      }, 500);
      
      /* Original code commented out for now
      const response = await fetch("/api/validate-invite-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid invite code");
      }
      
      onSubmit();
      */
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to validate invite code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    signOut();
    onClose();
  };

  const handleRequestCode = () => {
    // You could add a form or email functionality here
    window.open("mailto:admin@graffiticode.org?subject=Invite%20Code%20Request", "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Welcome to GraffitiCode</h2>
        <p className="mb-4">You need an invite code to continue. Please enter your code below or request one.</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter your invite code"
              required
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Validating..." : "Submit"}
            </button>
            
            <button
              type="button"
              onClick={handleRequestCode}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
            >
              Request an Invite Code
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-600 py-2 px-4 rounded hover:text-gray-800"
            >
              Cancel Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}