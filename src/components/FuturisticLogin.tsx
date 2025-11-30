import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { GraduationCap, AlertCircle, Eye, EyeOff, Lock, User, Shield, ArrowLeft } from 'lucide-react';
import hcmutLogo from 'figma:asset/c0b1283c1762e2e406fe4ae60561b95a8304ce62.png';

interface FuturisticLoginProps {
  onBack: () => void;
}

export function FuturisticLogin({ onBack }: FuturisticLoginProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password, role);
      if (!success) {
        setError('Invalid credentials. Please check your username and password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { value: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'Student',
      label: 'Student',
      icon: <GraduationCap size={24} />,
      description: 'Access bookings and sessions'
    },
    {
      value: 'Tutor',
      label: 'Tutor',
      icon: <User size={24} />,
      description: 'Manage your classes'
    },
    {
      value: 'CTSV',
      label: 'CTSV',
      icon: <Shield size={24} />,
      description: 'Student affairs access'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: 'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Back Button */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Home</span>
      </motion.button>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="relative bg-white/70 backdrop-blur-xl border border-blue-200 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl animate-pulse" />
                <img src={hcmutLogo} alt="HCMUT" className="h-24 w-24 relative z-10" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl text-slate-800 mb-2">Welcome Back</h1>
              <p className="text-slate-600">Sign in to access your account</p>
            </motion.div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="username" className="text-slate-700 mb-2 block">
                University ID
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your university ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  className={`pl-12 bg-white/60 border-blue-200 text-slate-800 placeholder:text-slate-400 h-12 rounded-xl transition-all ${
                    focusedField === 'username' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : ''
                  }`}
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="password" className="text-slate-700 mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  className={`pl-12 pr-12 bg-white/60 border-blue-200 text-slate-800 placeholder:text-slate-400 h-12 rounded-xl transition-all ${
                    focusedField === 'password' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>

            {/* Role Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label className="text-slate-700 mb-3 block">Select Your Role</Label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((roleOption) => (
                  <motion.button
                    key={roleOption.value}
                    type="button"
                    onClick={() => setRole(roleOption.value)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-4 rounded-xl transition-all ${
                      role === roleOption.value
                        ? 'bg-blue-500/20 border-2 border-blue-600 text-blue-700'
                        : 'bg-white/60 border border-blue-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {roleOption.icon}
                      <span className="text-xs">{roleOption.label}</span>
                    </div>
                    {role === roleOption.value && (
                      <motion.div
                        layoutId="role-indicator"
                        className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-xl"
                        transition={{ type: "spring", duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="bg-red-50 border-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <Lock size={20} />
                    </motion.div>
                  ) : (
                    'Sign In'
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>
            </motion.div>
          </form>

          {/* Demo Accounts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 p-4 bg-blue-100/60 border border-blue-300 rounded-xl"
          >
            <p className="text-sm text-slate-700 mb-3">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-slate-600">
              <p>Student: <span className="text-blue-600">student1 / pass123</span></p>
              <p>Tutor: <span className="text-blue-600">tutor1 / pass123</span></p>
              <p>CTSV: <span className="text-blue-600">ctsv1 / pass123</span></p>
            </div>
          </motion.div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600"
          >
            <Lock size={16} />
            <span>Your connection is secure and encrypted</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}