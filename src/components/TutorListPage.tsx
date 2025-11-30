import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { GraduationCap, Star, Clock, DollarSign, Search, LogOut, Calendar, Loader2 } from 'lucide-react';
import { tutorsApi, subjectsApi, Tutor } from '../services/api';

interface TutorListPageProps {
  onSelectTutor: (tutorId: string) => void;
}

export function TutorListPage({ onSelectTutor }: TutorListPageProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tutors and subjects on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [tutorsResponse, subjectsResponse] = await Promise.all([
          tutorsApi.getAll({ limit: 50 }),
          subjectsApi.getAll()
        ]);

        if (tutorsResponse.success) {
          setTutors(tutorsResponse.data.tutors);
        }

        if (subjectsResponse.success) {
          setSubjects(['All', ...subjectsResponse.data.subjects.map(s => s.name)]);
        }
      } catch (err) {
        setError('Failed to load tutors. Please try again.');
        console.error('Error fetching tutors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tutors locally for fast response
  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = selectedSubject === 'All' || tutor.subject === selectedSubject;
    
    const matchesDate = !selectedDate || tutor.availableSlots?.some(
      slot => slot.date === selectedDate && slot.available
    );

    return matchesSearch && matchesSubject && matchesDate;
  });

  const getAvailableSlotCount = (tutor: Tutor, date?: string) => {
    if (!tutor.availableSlots) return 0;
    if (date) {
      return tutor.availableSlots.filter(slot => slot.date === date && slot.available).length;
    }
    return tutor.availableSlots.filter(slot => slot.available).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0A4D8C] rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-[#0A4D8C]">HCMUT Tutor Booking</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={logout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl mb-4">Find Your Tutor</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name, subject, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject === 'All' ? 'All Subjects' : subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {selectedDate && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing tutors available on {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate('')}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            {isLoading ? 'Loading...' : `${filteredTutors.length} tutor${filteredTutors.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A4D8C]" />
            <span className="ml-2 text-gray-600">Loading tutors...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Tutors Grid */}
        {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map(tutor => (
            <Card 
              key={tutor.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectTutor(tutor.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg">{tutor.name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {tutor.subject}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>{tutor.rating}</span>
                  <span className="text-gray-500">({tutor.reviews} reviews)</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{tutor.yearsOfExperience} years experience</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{(tutor.hourlyRate / 1000).toFixed(0)}K VND/hour</span>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex flex-wrap gap-1">
                    {tutor.expertise.slice(0, 3).map((exp, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Available slots:</span>
                    <span className="text-[#0A4D8C]">
                      {getAvailableSlotCount(tutor, selectedDate)} slot{getAvailableSlotCount(tutor, selectedDate) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-[#0A4D8C] hover:bg-[#083A6B]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTutor(tutor.id);
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {!isLoading && !error && filteredTutors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tutors found matching your criteria</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('All');
                setSelectedDate('');
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
