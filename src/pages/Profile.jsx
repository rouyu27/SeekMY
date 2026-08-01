import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { User, Lock, Trash2, Save, Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { user, checkUserAuth, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user, isAuthenticated, navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await base44.auth.updateCurrentUser({ full_name: fullName });
      await checkUserAuth();
      setMsg({ type: "success", text: "Profile updated successfully ✓" });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to update profile" });
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await base44.auth.changePassword({ oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      setMsg({ type: "success", text: "Password changed successfully ✓" });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    try {
      await base44.auth.deleteCurrentAccount();
      logout(false); // account + token are already gone; just reset local state and redirect
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-green-600 to-teal-700 text-white">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black">{user.full_name || "My Profile"}</h1>
              <p className="text-white/70 text-sm flex items-center gap-1">
                {user.role === "admin" && <Shield className="w-3 h-3" />}
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4 mb-10">
        {msg && (
          <div className={`p-3 rounded-xl text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Edit Profile</h2>
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="mt-1 bg-gray-50" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Profile
          </Button>
        </form>

        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>
          <div>
            <Label>Current Password</Label>
            <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" required minLength={6} />
          </div>
          <Button type="submit" variant="outline" disabled={loading} className="w-full">Change Password</Button>
        </form>

        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <h2 className="font-bold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-3">Permanently delete your account and local data.</p>
          <Button variant="destructive" onClick={handleDeleteAccount} className="w-full">
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
