import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './adminpages/Dashboard'
import AdminCandidates from './adminpages/Candidates'
import AdminRecruiters from './adminpages/Recruiters'
import AdminChat from './adminpages/Chat'
import RecruiterDashboard from './recruiterpages/Dashboard'
import RecruiterGenerateTest from './recruiterpages/GenerateTest'
import RecruiterInterview from './recruiterpages/Interview'
import RecruiterChat from './recruiterpages/Chat'
import RecruiterCandidateProfiles from './recruiterpages/CandidateProfiles'
import RecruiterEditProfile from './recruiterpages/EditProfile'
import RecruiterResults from './recruiterpages/Results'
import CandidateDashboard from './candidatepages/Dashboard'
import EditProfile from './candidatepages/EditProfile'
import Jobs from './candidatepages/Jobs';
import Chat from './candidatepages/Chat';
import Partices from './candidatepages/Partices';
import ResumeChecker from './candidatepages/ResumeChecker';
import OAuthSuccess from './pages/OAuthSuccess';
import PendingApproval from './pages/PendingApproval.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Payment from './candidatepages/Payment';
import ApplyJob from './pages/ApplyJob';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/admin/*' element={<AdminDashboard />} />
      <Route path='/recruiter/*' element={<RecruiterDashboard />} />
      <Route path='/candidate/*' element={<CandidateDashboard />} />
      <Route path='/oauth-success' element={<OAuthSuccess />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/jobs/:linkId" element={<ApplyJob />} />
    </Routes>
  )
}

export default App
