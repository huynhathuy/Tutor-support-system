import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { AlertCircle } from 'lucide-react';

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  onConfirm: (reason: string, details: string) => void;
}

export function CancelBookingDialog({ 
  open, 
  onOpenChange, 
  className,
  onConfirm 
}: CancelBookingDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const reasons = [
    { value: 'schedule', label: 'Schedule conflict' },
    { value: 'financial', label: 'Financial reasons' },
    { value: 'change_tutor', label: 'Want to change tutor' },
    { value: 'change_time', label: 'Need different time slot' },
    { value: 'personal', label: 'Personal reasons' },
    { value: 'other', label: 'Other' }
  ];

  const handleConfirm = () => {
    if (!selectedReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    const fullReason = selectedReason === 'other' 
      ? additionalDetails 
      : reasons.find(r => r.value === selectedReason)?.label + 
        (additionalDetails ? `: ${additionalDetails}` : '');

    onConfirm(selectedReason, fullReason || '');
    
    // Reset form
    setSelectedReason('');
    setAdditionalDetails('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedReason('');
    setAdditionalDetails('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            You are about to cancel your booking for <span className="font-medium text-gray-900">{className}</span>.
            Please tell us why you want to cancel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Reason for cancellation *</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {reasons.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label 
                    htmlFor={reason.value} 
                    className="font-normal cursor-pointer"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">
              Additional details {selectedReason === 'other' && '*'}
            </Label>
            <Textarea
              id="details"
              placeholder={
                selectedReason === 'other' 
                  ? "Please provide details about your reason for cancellation" 
                  : "Any additional information you'd like to share (optional)"
              }
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={4}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Note:</span> Your tutor will be notified of this cancellation. 
              You can book another session or choose a different time slot after cancellation.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Keep Booking
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'other' && !additionalDetails)}
          >
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
