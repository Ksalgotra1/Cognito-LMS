import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../../lib/axios'; // Ensure this path matches your setup
import { CheckCircle, XCircle, Loader2, Award, Calendar, User } from 'lucide-react';

const CertificateVerify = () => {
  const { id } = useParams(); // Get UUID from URL
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const verifyCert = async () => {
      try {
        // Call the EXISTING Backend API to validate
        const response = await client.get(`/api/courses/certificate/verify/${id}/`);
        setData(response.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    verifyCert();
  }, [id]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-indigo-600 h-12 w-12 mb-4" />
      <p className="text-gray-500 font-medium">Verifying Credential...</p>
    </div>
  );

  if (error || !data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-8 text-center">
      <XCircle className="text-red-500 h-20 w-20 mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Certificate</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        The certificate ID <strong>{id}</strong> could not be found in our records. It may have been revoked or the URL is incorrect.
      </p>
      <Link to="/" className="px-6 py-3 bg-white border border-gray-300 rounded-xl font-bold hover:bg-gray-50 text-gray-700">
        Return Home
      </Link>
    </div>
  );

  // ✅ SUCCESS STATE
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 flex items-center justify-center">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header Badge */}
        <div className="bg-green-600 p-8 text-center">
           <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm mb-4">
              <CheckCircle className="text-white h-12 w-12" />
           </div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Verified Credential</h1>
           <p className="text-green-100 mt-1 text-sm uppercase tracking-wider font-semibold">Official Record</p>
        </div>

        {/* Certificate Details */}
        <div className="p-8 space-y-6">
          
          <div className="text-center">
            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Issued To</h2>
            <div className="flex items-center justify-center gap-2">
              <User className="text-indigo-500" size={20}/>
              <span className="text-2xl font-bold text-gray-900">{data.student}</span>
            </div>
          </div>

          <div className="border-t border-b border-gray-100 py-6">
             <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 text-center">For the Course</h2>
             <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl">
                <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{data.course}</h3>
                  <p className="text-xs text-gray-500 mt-1">Cognito Academy Certification</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="flex justify-center mb-2 text-gray-400"><Calendar size={18}/></div>
                <div className="text-xs text-gray-500 uppercase font-bold">Issued On</div>
                <div className="font-mono font-bold text-gray-900">{new Date(data.issued_at).toLocaleDateString()}</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="flex justify-center mb-2 text-gray-400"><CheckCircle size={18}/></div>
                <div className="text-xs text-gray-500 uppercase font-bold">Status</div>
                <div className="font-bold text-green-600">Active</div>
             </div>
          </div>

          <div className="pt-4 text-center">
             <p className="text-xs text-gray-400 mb-4">ID: {id}</p>
             <Link to="/" className="text-indigo-600 font-bold hover:underline text-sm">
               Learn more at Cognito Academy
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CertificateVerify;