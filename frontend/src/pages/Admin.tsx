import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Eye } from "lucide-react";

type Tab = "users" | "products" | "kyc";

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("users");

  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get("http://localhost:3000/api/users").then((r) => setUsers(r.data.users)).catch(() => {});
    axios.get("http://localhost:3000/api/products").then((r) => setProducts(r.data.products)).catch(() => {});
    axios.get("http://localhost:3000/api/kyc/pending").then((r) => setKycQueue(r.data.users)).catch(() => {});
  }, [isLoggedIn]);

  const handleLogin = () => {
    if (password === "admin123") setIsLoggedIn(true);
    else alert("Invalid password");
  };

  const handleKycAction = async (username: string, action: "approve" | "reject") => {
    try {
      await axios.post("http://localhost:3000/api/kyc/review", { username, action });
      setKycQueue((prev) => prev.filter((u) => u.username !== username));
    } catch {
      alert("Action failed");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-80 text-center">
          <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
          <input type="password" placeholder="Enter password"
            className="w-full border px-4 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={() => { setIsLoggedIn(false); setPassword(""); }}
          className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(["users", "products", "kyc"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}>
            {t}{t === "kyc" && kycQueue.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {kycQueue.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users */}
      {tab === "users" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b text-gray-500">
                <th className="pb-3 pr-4">Username</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">KYC</th>
                <th className="pb-3">Joined</th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{u.username}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.kycStatus === "approved"  ? "bg-green-100 text-green-700" :
                        u.kycStatus === "pending"   ? "bg-yellow-100 text-yellow-700" :
                        u.kycStatus === "rejected"  ? "bg-red-100 text-red-700" :
                                                      "bg-gray-100 text-gray-600"
                      }`}>{u.kycStatus || "none"}</span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{u._id?.slice(-6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products */}
      {tab === "products" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Products ({products.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b text-gray-500">
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Owner</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3">Location</th>
              </tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{p.title}</td>
                    <td className="py-3 pr-4 text-gray-600">{p.owner}</td>
                    <td className="py-3 pr-4">₹{p.price}/{p.period}</td>
                    <td className="py-3 pr-4 capitalize text-gray-600">{p.category}</td>
                    <td className="py-3 text-gray-500 text-xs">{p.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KYC Queue */}
      {tab === "kyc" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">KYC Verification Queue ({kycQueue.length})</h2>
          {kycQueue.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No pending KYC submissions.</p>
          ) : (
            <div className="space-y-4">
              {kycQueue.map((u) => (
                <div key={u._id} className="flex flex-wrap items-center gap-4 rounded-xl border p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{u.username}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>

                  <div className="flex gap-2">
                    {u.kycDocFront && (
                      <button onClick={() => setPreviewDoc(u.kycDocFront)}
                        className="flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                        <Eye className="h-3.5 w-3.5" /> ID Front
                      </button>
                    )}
                    {u.kycDocBack && (
                      <button onClick={() => setPreviewDoc(u.kycDocBack)}
                        className="flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                        <Eye className="h-3.5 w-3.5" /> ID Back
                      </button>
                    )}
                    {u.kycSelfie && (
                      <button onClick={() => setPreviewDoc(u.kycSelfie)}
                        className="flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
                        <Eye className="h-3.5 w-3.5" /> Selfie
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleKycAction(u.username, "approve")}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button onClick={() => handleKycAction(u.username, "reject")}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Doc Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewDoc(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={previewDoc} alt="KYC Document" className="w-full rounded-xl shadow-2xl" />
            <button onClick={() => setPreviewDoc(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
