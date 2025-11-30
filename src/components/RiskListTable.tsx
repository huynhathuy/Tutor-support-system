import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, MessageSquare, Mail } from 'lucide-react';
import { AtRiskStudent } from './CTSVDashboard';

interface RiskListTableProps {
  students: AtRiskStudent[];
  onViewProfile: (student: AtRiskStudent) => void;
  onSuggestIntervention: (student: AtRiskStudent) => void;
}

type SortField = 'riskScore' | 'attendance' | 'gradesAvg' | 'studentId';
type SortDirection = 'asc' | 'desc';

export function RiskListTable({ students, onViewProfile, onSuggestIntervention }: RiskListTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 20;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * multiplier;
    }
    return ((aValue as number) - (bValue as number)) * multiplier;
  });

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + itemsPerPage);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'Moderate';
    return 'Low';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-[#0033A0]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-[#0033A0]" />
    );
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('studentId')}
                  className="flex items-center gap-2 hover:text-[#0033A0] transition-colors"
                >
                  <span className="text-sm text-gray-700">Student ID</span>
                  <SortIcon field="studentId" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-sm text-gray-700">Name</span>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('riskScore')}
                  className="flex items-center gap-2 hover:text-[#0033A0] transition-colors"
                >
                  <span className="text-sm text-gray-700">Risk Score</span>
                  <SortIcon field="riskScore" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('attendance')}
                  className="flex items-center gap-2 hover:text-[#0033A0] transition-colors"
                >
                  <span className="text-sm text-gray-700">Attendance %</span>
                  <SortIcon field="attendance" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('gradesAvg')}
                  className="flex items-center gap-2 hover:text-[#0033A0] transition-colors"
                >
                  <span className="text-sm text-gray-700">Grade Avg.</span>
                  <SortIcon field="gradesAvg" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-sm text-gray-700">Last Detected</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-sm text-gray-700">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr
                key={student.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4">
                  <button
                    onClick={() => onViewProfile(student)}
                    className="text-[#0033A0] hover:underline"
                  >
                    {student.studentId}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3 group relative">
                    <img
                      src={student.photo}
                      alt={student.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-200"
                    />
                    <span>{student.name}</span>
                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute left-0 top-12 z-10 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="w-16 h-16 rounded-full"
                        />
                        <div>
                          <p className="text-sm">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.studentId}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-600">Risk Factors:</p>
                            {student.riskFactors.slice(0, 2).map((factor, idx) => (
                              <p key={idx} className="text-xs text-red-600">• {factor}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="group relative inline-block">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getRiskColor(student.riskScore)}`}>
                      {student.riskScore} - {getRiskLabel(student.riskScore)}
                    </span>
                    {/* Tooltip for risk factors */}
                    <div className="hidden group-hover:block absolute left-0 top-8 z-10 w-72 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                      <p className="text-sm mb-2">Risk Factors:</p>
                      <ul className="space-y-1">
                        {student.riskFactors.map((factor, idx) => (
                          <li key={idx} className="text-xs text-gray-700">• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="group relative inline-block">
                    <span className={`${student.attendance < 70 ? 'text-red-600' : student.attendance < 80 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {student.attendance}%
                    </span>
                    {/* Drill-down tooltip */}
                    <div className="hidden group-hover:block absolute left-0 top-6 z-10 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                      <p className="text-sm mb-2">Course Breakdown:</p>
                      <div className="space-y-2">
                        {student.courses.map((course, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">{course.code}</span>
                            <span className={course.attendance < 70 ? 'text-red-600' : 'text-gray-900'}>
                              {course.attendance}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="group relative inline-block">
                    <span className={`${student.gradesAvg < 6 ? 'text-red-600' : student.gradesAvg < 7 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {student.gradesAvg.toFixed(1)}
                    </span>
                    {/* Course grades breakdown */}
                    <div className="hidden group-hover:block absolute left-0 top-6 z-10 w-72 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                      <p className="text-sm mb-2">Course Grades:</p>
                      <div className="space-y-2">
                        {student.courses.map((course, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">{course.name}</span>
                            <span className={course.grade < 6 ? 'text-red-600' : 'text-gray-900'}>
                              {course.grade.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">{student.lastDetected}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewProfile(student)}
                      className="p-2 text-gray-600 hover:text-[#0033A0] hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSuggestIntervention(student)}
                      className="p-2 text-gray-600 hover:text-[#0033A0] hover:bg-blue-50 rounded-lg transition-colors"
                      title="Annotate / Suggest Intervention"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-[#0033A0] hover:bg-blue-50 rounded-lg transition-colors"
                      title="Notify via Email/SMS"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, students.length)} of {students.length} students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded ${
                  currentPage === page
                    ? 'bg-[#0033A0] text-white border-[#0033A0]'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
