import { X, Mail, Phone, MapPin, BookOpen, TrendingDown, AlertCircle } from 'lucide-react';
import { AtRiskStudent } from './CTSVDashboard';

interface StudentProfileModalProps {
  student: AtRiskStudent;
  onClose: () => void;
}

export function StudentProfileModal({ student, onClose }: StudentProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#0033A0]">
          <div className="flex items-center gap-4">
            <img
              src={student.photo}
              alt={student.name}
              className="w-16 h-16 rounded-full border-4 border-white"
            />
            <div>
              <h2 className="text-xl text-white">{student.name}</h2>
              <p className="text-sm text-blue-100">{student.studentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Risk Overview */}
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg text-red-800 mb-2">Risk Assessment</h3>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Risk Score</p>
                    <p className="text-2xl text-red-600">{student.riskScore}/100</p>
                  </div>
                  <div className="h-12 border-l border-gray-300"></div>
                  <div>
                    <p className="text-sm text-gray-600">Attendance</p>
                    <p className="text-2xl text-red-600">{student.attendance}%</p>
                  </div>
                  <div className="h-12 border-l border-gray-300"></div>
                  <div>
                    <p className="text-sm text-gray-600">Grade Average</p>
                    <p className="text-2xl text-red-600">{student.gradesAvg.toFixed(1)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-2">Risk Factors:</p>
                  <ul className="space-y-1">
                    {student.riskFactors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="mb-6">
            <h3 className="text-lg text-[#0033A0] mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Student Information (HCMUT_DATACORE)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Student ID</p>
                <p className="text-gray-900">{student.studentId}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="text-gray-900">{student.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <p className="text-gray-900">{student.studentId.toLowerCase()}@hcmut.edu.vn</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </p>
                <p className="text-gray-900">+84 9XX XXX XXX</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Program</p>
                <p className="text-gray-900">Computer Science</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Academic Year</p>
                <p className="text-gray-900">Year 3</p>
              </div>
            </div>
          </div>

          {/* Course Performance */}
          <div className="mb-6">
            <h3 className="text-lg text-[#0033A0] mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Course Performance Breakdown
            </h3>
            <div className="space-y-3">
              {student.courses.map((course, idx) => (
                <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-gray-900">{course.code} - {course.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Grade</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              course.grade < 5 ? 'bg-red-500' : 
                              course.grade < 6.5 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${(course.grade / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm ${
                          course.grade < 5 ? 'text-red-600' : 
                          course.grade < 6.5 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {course.grade.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Attendance</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              course.attendance < 70 ? 'bg-red-500' : 
                              course.attendance < 80 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${course.attendance}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm ${
                          course.attendance < 70 ? 'text-red-600' : 
                          course.attendance < 80 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {course.attendance}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detection History */}
          <div className="mb-6">
            <h3 className="text-lg text-[#0033A0] mb-4">Detection History</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Last Detected</p>
                <p className="text-gray-900">{student.lastDetected}</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Detection Count (This Term)</p>
                <p className="text-gray-900">5 times</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">First Detected</p>
                <p className="text-gray-900">2025-10-15 09:20</p>
              </div>
            </div>
          </div>

          {/* Tutor Sessions */}
          <div>
            <h3 className="text-lg text-[#0033A0] mb-4">Tutor Sessions</h3>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Student has <strong>not attended any tutor sessions</strong> this term. 
                Consider recommending tutoring as part of intervention strategy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-[#0033A0] text-white rounded-lg hover:bg-blue-800">
            Suggest Intervention
          </button>
        </div>
      </div>
    </div>
  );
}
