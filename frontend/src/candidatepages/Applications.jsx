import React, { useEffect, useState } from 'react';
import { 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle, 
  FaFileAlt, 
  FaSearch, 
  FaBriefcase, 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaStar
} from 'react-icons/fa';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Status filters with icons and labels
  const statusFilters = [
    { id: 'all', label: 'All', icon: <FaBriefcase className="mr-2" /> },
    { id: 'applied', label: 'Applied', icon: <FaFileAlt className="mr-2" /> },
    { id: 'shortlisted', label: 'Shortlisted', icon: <FaStar className="mr-2 text-yellow-500" /> },
    { id: 'interview', label: 'Interview', icon: <FaCalendarAlt className="mr-2 text-blue-500" /> },
    { id: 'rejected', label: 'Rejected', icon: <FaTimesCircle className="mr-2 text-red-500" /> },
  ];

  useEffect(() => {
    const mockApplications = [
      {
        _id: '1',
        job: {
          title: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'Remote'
        },
        status: 'applied',
        appliedAt: new Date('2023-05-15').toISOString(),
        updatedAt: new Date('2023-05-15').toISOString()
      },
      {
        _id: '2',
        job: {
          title: 'Full Stack Engineer',
          company: 'Web Solutions',
          location: 'New York, NY'
        },
        status: 'shortlisted',
        appliedAt: new Date('2023-05-10').toISOString(),
        testResult: { score: 85, correctAnswers: 17, totalQuestions: 20 }
      },
      {
        _id: '3',
        job: {
          title: 'UI/UX Designer',
          company: 'Design Hub',
          location: 'San Francisco, CA'
        },
        status: 'interview_scheduled',
        appliedAt: new Date('2023-05-05').toISOString(),
        interviewScheduled: new Date('2023-05-20T14:30:00').toISOString(),
        interviewLink: 'https://meet.google.com/abc-xyz-123'
      },
      {
        _id: '4',
        job: {
          title: 'Backend Developer',
          company: 'Data Systems',
          location: 'Austin, TX'
        },
        status: 'rejected',
        appliedAt: new Date('2023-05-01').toISOString(),
        notes: 'Position filled internally'
      }
    ];

    setApplications(mockApplications);
    setLoading(false);
  }, []);

  // Filter applications based on search and active filter
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'shortlisted') 
      return matchesSearch && (app.status === 'shortlisted' || app.status === 'under_review');
    if (activeFilter === 'interview') 
      return matchesSearch && (app.status === 'interview_scheduled' || app.status === 'interview_completed');
    
    return matchesSearch && app.status === activeFilter;
  });

  // Get status badge with appropriate styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      applied: { bg: 'bg-blue-100 text-blue-800', icon: <FaClock className="mr-1" />, label: 'Applied' },
      shortlisted: { bg: 'bg-purple-100 text-purple-800', icon: <FaStar className="mr-1" />, label: 'Shortlisted' },
      interview_scheduled: { bg: 'bg-blue-100 text-blue-800', icon: <FaCalendarAlt className="mr-1" />, label: 'Interview' },
      rejected: { bg: 'bg-red-100 text-red-800', icon: <FaTimesCircle className="mr-1" />, label: 'Rejected' },
      default: { bg: 'bg-gray-100 text-gray-800', icon: null, label: status }
    };

    const config = statusConfig[status] || statusConfig.default;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

 

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
        <p className="text-gray-600">Track your job applications and their status</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by job title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {statusFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Application List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 col-span-3">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching applications' : 'No applications yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search or filters'
                : 'Start applying to jobs to see them here'}
            </p>
            {activeFilter !== 'all' || searchTerm !== '' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('all');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-2"
              >
                Clear all filters
              </button>
            ) : (
              <a
                href="/jobs"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-3"
              >
                Browse Jobs
              </a>
            )}
          </div>
        ) : (
          filteredApplications.map((application) => (
            <div 
              key={application._id} 
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                      {application.job.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-900">{application.job.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FaBuilding className="mr-1.5 text-gray-400" />
                        {application.job.company}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(application.status)}
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-gray-400" />
                    <span>{application.job.location || 'Remote'}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-400" />
                    <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                  </div>
                  {application.updatedAt && application.status !== 'applied' && (
                    <div className="mt-2 text-xs text-gray-400">
                      Updated: {new Date(application.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                {application.testResult && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-medium text-blue-800 mb-1">Test Score</p>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                application.testResult.score >= 70 ? 'bg-green-500' : 
                                application.testResult.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${application.testResult.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{application.testResult.score}%</span>
                        </div>
                      </div>
                      <button className="text-xs text-blue-600 hover:underline">
                        View Details
                      </button>
                    </div>
                  </div>
                )}
                
                {application.interviewScheduled && (
                  <div className="mt-2 p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs font-medium text-purple-800 mb-1">
                      {application.status === 'interview_completed' 
                        ? 'Interview Completed' 
                        : 'Upcoming Interview'}
                    </p>
                    <div className="flex items-center text-sm">
                      <FaCalendarAlt className="mr-2 text-purple-500" />
                      <span>{new Date(application.interviewScheduled).toLocaleString()}</span>
                    </div>
                    {application.interviewLink && (
                      <a 
                        href={application.interviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                      >
                        {application.status === 'interview_completed' 
                          ? 'View Recording' 
                          : 'Join Meeting'}
                      </a>
                    )}
                  </div>
                )}
                
                {application.notes && (
                  <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs font-medium text-yellow-800 mb-1">Note from Recruiter</p>
                    <p className="text-sm text-yellow-700">{application.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Applications;
