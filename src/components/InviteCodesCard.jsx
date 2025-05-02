import { useState, useEffect } from "react";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

export default function InviteCodesCard() {
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCode, setNewCode] = useState("");
  const { user } = useGraffiticodeAuth();

  useEffect(() => {
    if (!user) return;
    
    fetchInviteCodes();
  }, [user]);

  const fetchInviteCodes = async () => {
    setLoading(true);
    try {
      const token = await user.getToken();
      const response = await fetch("/api/invite-codes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch invite codes");
      }
      
      const data = await response.json();
      setInviteCodes(data.inviteCodes || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async (e) => {
    e.preventDefault();
    
    try {
      const token = await user.getToken();
      const response = await fetch("/api/invite-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          code: newCode || undefined // If empty, server will generate a random code
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate invite code");
      }
      
      setNewCode("");
      fetchInviteCodes();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const deleteInviteCode = async (codeId) => {
    try {
      const token = await user.getToken();
      const response = await fetch(`/api/invite-codes/${codeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete invite code");
      }
      
      fetchInviteCodes();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Invite Codes</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={generateInviteCode} className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded"
            placeholder="Optional custom code (leave empty for random)"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Generate Code
          </button>
        </div>
      </form>
      
      {loading ? (
        <p>Loading invite codes...</p>
      ) : (
        <div>
          <h3 className="font-medium mb-2">Available Invite Codes:</h3>
          
          {inviteCodes.length === 0 ? (
            <p className="text-gray-500">No invite codes available.</p>
          ) : (
            <div className="border rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inviteCodes.map((code) => (
                    <tr key={code.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {code.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {code.used ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Used
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!code.used && (
                          <button
                            onClick={() => deleteInviteCode(code.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}