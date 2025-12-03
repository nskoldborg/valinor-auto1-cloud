import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaUserShield, FaLock, FaEnvelope, FaTimes } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Support form state
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    subject: "",
    description: "",
    category: "",
  });
  const [supportMessage, setSupportMessage] = useState(null);
  const [supportLoading, setSupportLoading] = useState(false);

  const categoryOptions = [
    { value: "account_access", label: "🔐 Account Access" },
    { value: "it_support", label: "💻 IT Support" },
    { value: "software", label: "🧩 Software" },
    { value: "hr", label: "👥 HR / People" },
    { value: "facilities", label: "🏢 Facilities" },
    { value: "other", label: "📝 Other" },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://10.46.0.140:8650/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_id", data.user_id);

      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSupportFormChange = (e) => {
    const { name, value } = e.target;
    setSupportForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupportSubmit = async () => {
    setSupportMessage(null);

    if (!supportForm.email || !supportForm.subject || !supportForm.description) {
      setSupportMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setSupportLoading(true);

    try {
      const payload = {
        name: supportForm.name.trim(),
        email: supportForm.email.trim(),
        subject: supportForm.subject.trim(),
        description: supportForm.description.trim(),
        category: supportForm.category || "account_access",
      };

      const res = await fetch("http://10.46.0.140:8650/support/create-ticket-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to submit ticket");
      }

      setSupportMessage({
        type: "success",
        text: "✅ Ticket submitted successfully! Support will contact you shortly.",
      });

      // Auto close after 2 seconds
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportForm({
          name: "",
          email: "",
          subject: "",
          description: "",
          category: "",
        });
        setSupportMessage(null);
      }, 2000);
    } catch (err) {
      setSupportMessage({
        type: "error",
        text: "❌ " + err.message,
      });
    } finally {
      setSupportLoading(false);
    }
  };

  const closeSupportModal = () => {
    setShowSupportModal(false);
    setSupportForm({
      name: "",
      email: "",
      subject: "",
      description: "",
      category: "",
    });
    setSupportMessage(null);
  };

  return (
    <>
      <div
        className="flex items-center justify-center min-h-screen relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a1929 0%, #0d2847 50%, #0f3460 100%)",
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "4s" }}
          ></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          ></div>
        </div>

        {/* Bottom glow line */}
        <div
          className="absolute bottom-0 left-0 w-full h-[3px] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(96,165,250,0.9) 50%, rgba(59,130,246,0.8) 100%)",
            boxShadow: "0 0 20px 3px rgba(59,130,246,0.6), 0 0 40px 6px rgba(59,130,246,0.3)",
          }}
        />

        <div className="flex w-full max-w-6xl mx-auto px-8 gap-16 items-center relative z-10">
          {/* Left side - Branding */}
          <div className="flex-1 text-white space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/auto1_group_white_logo.png"
                alt="AUTO1 Group"
                className="h-10 w-auto object-contain"
              />
              <div className="h-8 w-px bg-white/30"></div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Valinor
              </span>
            </div>

            {/* Main heading */}
            <div>
              <h1 className="text-6xl font-bold mb-4 leading-tight">
                Welcome To
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                  Valinor DEV-1.1.0
                </span>
              </h1>
              
              <p className="text-xl text-blue-200/80 font-light mb-6">
                Login to the future of Corporate IT.
              </p>

              {/* Stats - moved closer */}
              <div className="grid grid-cols-3 gap-8 max-w-md">
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-1">
                    24/7
                  </div>
                  <div className="text-sm text-blue-300/70">Availability</div>
                </div>
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-1">
                    3+
                  </div>
                  <div className="text-sm text-blue-300/70">Markets</div>
                </div>
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-1">
                    10
                  </div>
                  <div className="text-sm text-blue-300/70">IT Admins Online</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login form with glow wrapper */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: "radial-gradient(circle at center, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0.2) 40%, transparent 70%)",
                filter: "blur(40px)",
                transform: "scale(1.1)",
              }}
            ></div>
            
            {/* Additional animated glow */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none animate-pulse"
              style={{
                background: "radial-gradient(circle at center, rgba(96,165,250,0.3) 0%, transparent 60%)",
                filter: "blur(60px)",
                transform: "scale(1.15)",
                animationDuration: "3s",
              }}
            ></div>

            {/* Login card */}
            <div className="relative w-[480px] bg-[#0d1f33]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
              {/* Logo for mobile */}
              <div className="flex justify-center mb-8 lg:hidden">
                <img
                  src="/Valinor_Logo_500x500.png"
                  alt="Valinor Logo"
                  width={100}
                  height={100}
                />
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
                <p className="text-blue-300/70 text-sm">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email field */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-blue-200">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/50">
                      <FaEnvelope className="text-sm" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      placeholder="name@company.com"
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0a1929]/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-blue-400/40 mt-2">
                    Your company email (e.g., "test.testsson@auto1.com")
                  </p>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-blue-200">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/50">
                      <FaLock className="text-sm" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      placeholder="••••••••••"
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#0a1929]/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#0a1929]/50 text-blue-500 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                    />
                    <span className="text-sm text-blue-300/70 group-hover:text-blue-300 transition">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign in button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30"
                >
                  Sign in
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="px-4 text-sm text-blue-400/50">Or continue with</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Google sign in */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white transition-all duration-300 hover:scale-[1.02]"
                disabled
              >
                <FcGoogle className="text-xl" />
                Continue with Google
              </button>

              {/* Footer */}
              <div className="flex items-center justify-center mt-8 text-xs text-blue-400/50">
                <FaUserShield className="mr-2" />
                <span>Internal system access only. Missing account?{" "}</span>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors cursor-pointer"
                >
                  Create a ticket.
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeSupportModal}
        >
          <div
            className="bg-[#0d1f33] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white">Contact Support</h3>
              <button
                onClick={closeSupportModal}
                className="text-blue-400/50 hover:text-blue-400 transition-colors"
                disabled={supportLoading}
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Feedback message */}
              {supportMessage && (
                <div
                  className={`px-4 py-3 rounded-xl text-sm ${
                    supportMessage.type === "success"
                      ? "bg-green-500/10 border border-green-500/30 text-green-400"
                      : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}
                >
                  {supportMessage.text}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-200">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={supportForm.name}
                  onChange={handleSupportFormChange}
                  className="w-full bg-[#0a1929]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  disabled={supportLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-200">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  value={supportForm.email}
                  onChange={handleSupportFormChange}
                  className="w-full bg-[#0a1929]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                  disabled={supportLoading}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-200">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Brief summary of your issue"
                  value={supportForm.subject}
                  onChange={handleSupportFormChange}
                  className="w-full bg-[#0a1929]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                  disabled={supportLoading}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-200">
                  Category
                </label>
                <select
                  name="category"
                  value={supportForm.category}
                  onChange={handleSupportFormChange}
                  className="w-full bg-[#0a1929]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  disabled={supportLoading}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-200">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Describe your issue or request in detail..."
                  value={supportForm.description}
                  onChange={handleSupportFormChange}
                  rows={5}
                  className="w-full bg-[#0a1929]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                  required
                  disabled={supportLoading}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={closeSupportModal}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all"
                disabled={supportLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSupportSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={supportLoading}
              >
                {supportLoading ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;