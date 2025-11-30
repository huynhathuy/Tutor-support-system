import { useState } from 'react';
import { X, MessageSquare, Mail, Phone, Calendar, CheckCircle } from 'lucide-react';
import { AtRiskStudent } from './CTSVDashboard';
import { toast } from 'sonner';

interface SuggestInterventionModalProps {
  student: AtRiskStudent;
  onClose: () => void;
  onSubmit: (data: InterventionData) => void;
}

export interface InterventionData {
  studentId: string;
  interventionType: string;
  notes: string;
  notifyStudent: boolean;
  notifyParent: boolean;
  notifyMethod: string[];
  followUpDate: string;
  assignedTo: string;
}

export function SuggestInterventionModal({ student, onClose, onSubmit }: SuggestInterventionModalProps) {
  const [formData, setFormData] = useState<InterventionData>({
    studentId: student.studentId,
    interventionType: 'counseling',
    notes: '',
    notifyStudent: true,
    notifyParent: false,
    notifyMethod: ['email'],
    followUpDate: '',
    assignedTo: 'ctsv-staff'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.notes.trim()) {
      toast.error('Please provide intervention notes');
      return;
    }

    if (formData.notifyStudent && formData.notifyMethod.length === 0) {
      toast.error('Please select at least one notification method');
      return;
    }

    onSubmit(formData);
    toast.success('Intervention suggestion submitted successfully');
  };

  const toggleNotifyMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      notifyMethod: prev.notifyMethod.includes(method)
        ? prev.notifyMethod.filter(m => m !== method)
        : [...prev.notifyMethod, method]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#0033A0]">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl text-white">Suggest Intervention</h2>
              <p className="text-sm text-blue-100">UC009: Extend to Intervention Actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Student Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center gap-4">
            <img
              src={student.photo}
              alt={student.name}
              className="w-16 h-16 rounded-full border-2 border-[#0033A0]"
            />
            <div>
              <p className="text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-600">{student.studentId}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                  Risk Score: {student.riskScore}
                </span>
                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                  Attendance: {student.attendance}%
                </span>
              </div>
            </div>
          </div>

          {/* Intervention Type */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-2">
              Intervention Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.interventionType}
              onChange={(e) => setFormData({ ...formData, interventionType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
              required
            >
              <option value="counseling">Academic Counseling</option>
              <option value="tutoring">Tutoring Recommendation</option>
              <option value="scholarship">Scholarship Alert</option>
              <option value="probation">Academic Probation Warning</option>
              <option value="parent-meeting">Parent-Teacher Meeting</option>
              <option value="mentoring">Peer Mentoring Program</option>
              <option value="workshop">Study Skills Workshop</option>
              <option value="health">Mental Health Referral</option>
            </select>
          </div>

          {/* Intervention Notes */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-2">
              Intervention Notes & Action Plan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describe the intervention plan, specific actions to be taken, and expected outcomes..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0] resize-none"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Be specific about actions, timelines, and success metrics
            </p>
          </div>

          {/* Notification Options */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-3">Notification Options</label>
            
            {/* Notify Student */}
            <div className="mb-3 p-4 border border-gray-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyStudent}
                  onChange={(e) => setFormData({ ...formData, notifyStudent: e.target.checked })}
                  className="w-4 h-4 text-[#0033A0] rounded focus:ring-[#0033A0]"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Notify Student</p>
                  <p className="text-xs text-gray-600">Send notification to student about intervention</p>
                </div>
              </label>

              {formData.notifyStudent && (
                <div className="mt-3 pl-7 space-y-2">
                  <p className="text-xs text-gray-600 mb-2">Notification Method:</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyMethod.includes('email')}
                      onChange={() => toggleNotifyMethod('email')}
                      className="w-4 h-4 text-[#0033A0] rounded"
                    />
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Email ({student.studentId.toLowerCase()}@hcmut.edu.vn)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyMethod.includes('sms')}
                      onChange={() => toggleNotifyMethod('sms')}
                      className="w-4 h-4 text-[#0033A0] rounded"
                    />
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">SMS (Registered Phone)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyMethod.includes('portal')}
                      onChange={() => toggleNotifyMethod('portal')}
                      className="w-4 h-4 text-[#0033A0] rounded"
                    />
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Student Portal Notification</span>
                  </label>
                </div>
              )}
            </div>

            {/* Notify Parent */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyParent}
                  onChange={(e) => setFormData({ ...formData, notifyParent: e.target.checked })}
                  className="w-4 h-4 text-[#0033A0] rounded focus:ring-[#0033A0]"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Notify Parent/Guardian</p>
                  <p className="text-xs text-gray-600">Send notification to registered parent contact</p>
                </div>
              </label>
            </div>
          </div>

          {/* Follow-up Date */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-2">
              Follow-up Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Schedule a follow-up to assess intervention effectiveness
            </p>
          </div>

          {/* Assign To */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-2">
              Assign To
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033A0]"
            >
              <option value="ctsv-staff">CTSV Staff (General)</option>
              <option value="academic-advisor">Academic Advisor</option>
              <option value="counselor">Student Counselor</option>
              <option value="program-coordinator">Program Coordinator</option>
              <option value="dean-office">Dean's Office</option>
            </select>
          </div>

          {/* Risk Factors Reference */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">⚠️ Current Risk Factors:</p>
            <ul className="space-y-1">
              {student.riskFactors.map((factor, idx) => (
                <li key={idx} className="text-xs text-yellow-700">• {factor}</li>
              ))}
            </ul>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
            Following UC009 intervention workflow
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#0033A0] text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Submit Intervention
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
