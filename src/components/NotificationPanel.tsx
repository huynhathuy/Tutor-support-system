import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { Booking } from '../services/api';

interface NotificationPanelProps {
  classId: string;
  pendingBookings: Booking[];
  onAccept: (bookingId: string) => Promise<void>;
  onReject: (bookingId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function NotificationPanel({ 
  classId, 
  pendingBookings,
  onAccept, 
  onReject,
  isLoading = false
}: NotificationPanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleAccept = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      await onAccept(bookingId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    if (rejectingId === bookingId) {
      // Already showing reject form, submit it
      setProcessingId(bookingId);
      try {
        await onReject(bookingId, rejectReason || 'No reason provided');
      } finally {
        setProcessingId(null);
        setRejectingId(null);
        setRejectReason('');
      }
    } else {
      // Show reject form
      setRejectingId(bookingId);
      setRejectReason('');
    }
  };

  const classBookings = pendingBookings.filter(b => b.classId === classId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Booking Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (classBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Booking Requests</CardTitle>
          <CardDescription>No pending requests at the moment</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Booking Requests</CardTitle>
            <CardDescription>Review and approve student booking requests</CardDescription>
          </div>
          <Badge variant="destructive">{classBookings.length} pending</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classBookings.map((booking) => (
            <div 
              key={booking.id} 
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {booking.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-gray-900">{booking.studentName}</p>
                    <p className="text-sm text-gray-500">{booking.studentEmail}</p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {booking.slot.date}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {booking.slot.startTime} - {booking.slot.endTime}
                  </Badge>
                </div>

                {booking.message && (
                  <p className="text-sm text-gray-600 mb-3 italic">"{booking.message}"</p>
                )}

                {rejectingId === booking.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setRejectingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(booking.id)}
                        disabled={processingId === booking.id}
                      >
                        {processingId === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Confirm Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAccept(booking.id)}
                      disabled={processingId === booking.id}
                    >
                      {processingId === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleReject(booking.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
