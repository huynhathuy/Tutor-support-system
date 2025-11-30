import React, { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { GraduationCap, AlertCircle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password, role);
      if (!success) {
        setError('Invalid authentic token');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A4D8C] to-[#1E88E5] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#0A4D8C] rounded-full flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">HCMUT Tutor Booking</CardTitle>
            <CardDescription>
              Sign in to access your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="Student"
                    checked={role === 'Student'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={isLoading}
                    className="w-4 h-4 text-[#0A4D8C] focus:ring-[#0A4D8C]"
                  />
                  <span>Student</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="Tutor"
                    checked={role === 'Tutor'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={isLoading}
                    className="w-4 h-4 text-[#0A4D8C] focus:ring-[#0A4D8C]"
                  />
                  <span>Tutor</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="CTSV"
                    checked={role === 'CTSV'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={isLoading}
                    className="w-4 h-4 text-[#0A4D8C] focus:ring-[#0A4D8C]"
                  />
                  <span>CTSV</span>
                </label>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#0A4D8C] hover:bg-[#083A6B]"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold mb-2">Demo Accounts:</p>
            <p className="text-gray-600">Student: student1 / pass123</p>
            <p className="text-gray-600">Tutor: tutor1 / pass123</p>
            <p className="text-gray-600">CTSV: ctsv1 / pass123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}