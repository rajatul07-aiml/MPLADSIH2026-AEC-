import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Plus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { worksService } from '../services/worksService';
import { useApp } from '../context/AppContext';

interface FormData {
  work_id: string;
  mp_id: string;
  constituency_id: string;
  state: string;
  district: string;
  constituency: string;
  block: string;
  village_or_urban_area: string;
  sector: string;
  sub_sector: string;
  work_type: string;
  work_description: string;
  recommended_amount: string;
  technical_estimate_amount: string;
  administrative_approval_amount: string;
  sanctioned_amount: string;
  released_amount: string;
  actual_expenditure: string;
  work_start_date: string;
  sanction_date: string;
  expected_completion_date: string;
  actual_completion_date: string;
  physical_progress_percent: string;
  financial_progress_percent: string;
  number_of_payments: string;
  first_payment_date: string;
  last_payment_date: string;
  implementing_agency_id: string;
  contractor_id: string;
  latitude: string;
  longitude: string;
  number_of_progress_updates: string;
  inspection_count: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export const NewWorkEntry: React.FC = () => {
  const navigate = useNavigate();
  const { refreshWorks } = useApp();

  const [formData, setFormData] = useState<FormData>({
    work_id: '',
    mp_id: '',
    constituency_id: '',
    state: '',
    district: '',
    constituency: '',
    block: '',
    village_or_urban_area: '',
    sector: '',
    sub_sector: '',
    work_type: '',
    work_description: '',
    recommended_amount: '',
    technical_estimate_amount: '',
    administrative_approval_amount: '',
    sanctioned_amount: '',
    released_amount: '',
    actual_expenditure: '',
    work_start_date: '',
    sanction_date: '',
    expected_completion_date: '',
    actual_completion_date: '',
    physical_progress_percent: '',
    financial_progress_percent: '',
    number_of_payments: '',
    first_payment_date: '',
    last_payment_date: '',
    implementing_agency_id: '',
    contractor_id: '',
    latitude: '',
    longitude: '',
    number_of_progress_updates: '',
    inspection_count: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedWork, setSubmittedWork] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Required fields
    const requiredFields = [
      'work_id', 'mp_id', 'constituency_id', 'state', 'district',
      'constituency', 'sector', 'work_description', 'sanctioned_amount',
      'sanction_date', 'expected_completion_date'
    ];

    requiredFields.forEach(field => {
      if (!formData[field as keyof FormData].trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    // Numeric validations
    const numericFields = [
      'recommended_amount', 'technical_estimate_amount', 'administrative_approval_amount',
      'sanctioned_amount', 'released_amount', 'actual_expenditure'
    ];

    numericFields.forEach(field => {
      const value = formData[field as keyof FormData];
      if (value && parseFloat(value) < 0) {
        newErrors[field] = 'Amount cannot be negative';
      }
    });

    // Progress percentage validations
    const progressFields = ['physical_progress_percent', 'financial_progress_percent'];
    progressFields.forEach(field => {
      const value = formData[field as keyof FormData];
      if (value) {
        const num = parseFloat(value);
        if (num < 0 || num > 100) {
          newErrors[field] = 'Progress must be between 0 and 100';
        }
      }
    });

    // Coordinate validations (India bounds)
    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (lat < 8.0 || lat > 37.0) {
        newErrors.latitude = 'Latitude must be between 8.0 and 37.0 (India)';
      }
    }

    if (formData.longitude) {
      const lon = parseFloat(formData.longitude);
      if (lon < 68.0 || lon > 97.0) {
        newErrors.longitude = 'Longitude must be between 68.0 and 97.0 (India)';
      }
    }

    // Count validations
    const countFields = ['number_of_payments', 'number_of_progress_updates', 'inspection_count'];
    countFields.forEach(field => {
      const value = formData[field as keyof FormData];
      if (value && parseFloat(value) < 0) {
        newErrors[field] = 'Count cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    const payload: any = {};

    // String fields
    ['work_id', 'mp_id', 'constituency_id', 'state', 'district', 'constituency',
     'block', 'village_or_urban_area', 'sector', 'sub_sector', 'work_type',
     'work_description', 'implementing_agency_id', 'contractor_id'].forEach(field => {
      payload[field] = formData[field as keyof FormData] || null;
    });

    // Numeric fields
    ['recommended_amount', 'technical_estimate_amount', 'administrative_approval_amount',
     'sanctioned_amount', 'released_amount', 'actual_expenditure',
     'physical_progress_percent', 'financial_progress_percent',
     'number_of_payments', 'latitude', 'longitude',
     'number_of_progress_updates', 'inspection_count'].forEach(field => {
      const value = formData[field as keyof FormData];
      payload[field] = value ? parseFloat(value) : null;
    });

    // Date fields
    ['work_start_date', 'sanction_date', 'expected_completion_date',
     'actual_completion_date', 'first_payment_date', 'last_payment_date'].forEach(field => {
      payload[field] = formData[field as keyof FormData] || null;
    });

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const payload = buildPayload();
      const result = await worksService.analyzeNewWork(payload);

      setSubmittedWork(result);
      setSubmitSuccess(true);

      // Refresh works in the app context
      await refreshWorks();

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          work_id: '',
          mp_id: '',
          constituency_id: '',
          state: '',
          district: '',
          constituency: '',
          block: '',
          village_or_urban_area: '',
          sector: '',
          sub_sector: '',
          work_type: '',
          work_description: '',
          recommended_amount: '',
          technical_estimate_amount: '',
          administrative_approval_amount: '',
          sanctioned_amount: '',
          released_amount: '',
          actual_expenditure: '',
          work_start_date: '',
          sanction_date: '',
          expected_completion_date: '',
          actual_completion_date: '',
          physical_progress_percent: '',
          financial_progress_percent: '',
          number_of_payments: '',
          first_payment_date: '',
          last_payment_date: '',
          implementing_agency_id: '',
          contractor_id: '',
          latitude: '',
          longitude: '',
          number_of_progress_updates: '',
          inspection_count: '',
        });
        setSubmitSuccess(false);
        setSubmittedWork(null);
      }, 3000);

    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'Failed to submit work. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (
    name: keyof FormData,
    label: string,
    type: string = 'text',
    required: boolean = false,
    placeholder?: string,
    unit?: string
  ) => {
    const isTextarea = name === 'work_description';
    const inputClasses = `w-full px-3 py-2 border rounded-md text-sm ${
      errors[name]
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
    } focus:outline-none focus:ring-1`;

    return (
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {unit && <span className="text-slate-500 ml-1.5 font-normal">({unit})</span>}
        </label>
        {isTextarea ? (
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className={inputClasses}
            rows={3}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className={inputClasses}
            placeholder={placeholder}
          />
        )}
        {errors[name] && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <Header
        title="New Work Entry"
        subtitle="Submit a new MPLADS work for AI-powered risk analysis"
      />

      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Submission Failed</p>
              <p className="text-xs text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        {submitSuccess && submittedWork && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900">Work Submitted Successfully</p>
              <p className="text-xs text-emerald-700 mt-1">
                Work ID: <strong>{submittedWork.work_id}</strong> |
                Risk Level: <strong className={`ml-1 ${
                  submittedWork.risk?.risk_level === 'Critical' ? 'text-red-700' :
                  submittedWork.risk?.risk_level === 'High' ? 'text-orange-700' :
                  submittedWork.risk?.risk_level === 'Medium' ? 'text-yellow-700' : 'text-emerald-700'
                }`}>{submittedWork.risk?.risk_level || 'Unknown'}</strong> |
                Risk Score: <strong className="ml-1">{submittedWork.risk?.final_score || 0}</strong>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Work Identification */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              1. Work Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('work_id', 'Work ID', 'text', true, 'MPL-WORK-XXXXXXXX')}
              {renderField('mp_id', 'MP ID', 'text', true, 'MP-XXX')}
              {renderField('constituency_id', 'Constituency ID', 'text', true, 'CON-XXXX')}
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              2. Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('state', 'State', 'text', true)}
              {renderField('district', 'District', 'text', true)}
              {renderField('constituency', 'Constituency', 'text', true)}
              {renderField('block', 'Block', 'text', false)}
              {renderField('village_or_urban_area', 'Village / Urban Area', 'text', false)}
            </div>
          </div>

          {/* Section 3: Work Classification */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              3. Work Classification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('sector', 'Sector', 'text', true, 'e.g., Infrastructure')}
              {renderField('sub_sector', 'Sub-sector', 'text', false, 'e.g., Road Construction')}
              {renderField('work_type', 'Work Type', 'text', false, 'e.g., Construction')}
            </div>
            <div className="mt-4">
              {renderField('work_description', 'Work Description', 'text', true, 'Detailed description of the work')}
            </div>
          </div>

          {/* Section 4: Financial Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              4. Financial Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('recommended_amount', 'Recommended Amount', 'number', false, '', '₹')}
              {renderField('technical_estimate_amount', 'Technical Estimate', 'number', false, '', '₹')}
              {renderField('administrative_approval_amount', 'Administrative Approval', 'number', false, '', '₹')}
              {renderField('sanctioned_amount', 'Sanctioned Amount', 'number', true, '', '₹')}
              {renderField('released_amount', 'Released Amount', 'number', false, '', '₹')}
              {renderField('actual_expenditure', 'Actual Expenditure', 'number', false, '', '₹')}
            </div>
          </div>

          {/* Section 5: Dates */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              5. Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('sanction_date', 'Sanction Date', 'date', true)}
              {renderField('work_start_date', 'Work Start Date', 'date', false)}
              {renderField('expected_completion_date', 'Expected Completion', 'date', true)}
              {renderField('actual_completion_date', 'Actual Completion', 'date', false)}
            </div>
          </div>

          {/* Section 6: Progress */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              6. Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('physical_progress_percent', 'Physical Progress', 'number', false, '0-100', '%')}
              {renderField('financial_progress_percent', 'Financial Progress', 'number', false, '0-100', '%')}
            </div>
          </div>

          {/* Section 7: Payments */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              7. Payments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('number_of_payments', 'Number of Payments', 'number', false)}
              {renderField('first_payment_date', 'First Payment Date', 'date', false)}
              {renderField('last_payment_date', 'Last Payment Date', 'date', false)}
            </div>
          </div>

          {/* Section 8: Implementation */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              8. Implementation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('implementing_agency_id', 'Implementing Agency ID', 'text', false, 'AGENCY-XXX')}
              {renderField('contractor_id', 'Contractor ID', 'text', false, 'CONT-XXXX')}
            </div>
          </div>

          {/* Section 9: Location Coordinates */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              9. Location Coordinates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('latitude', 'Latitude', 'number', false, '8.0 to 37.0', 'decimal degrees')}
              {renderField('longitude', 'Longitude', 'number', false, '68.0 to 97.0', 'decimal degrees')}
            </div>
          </div>

          {/* Section 10: Monitoring */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              10. Monitoring
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('number_of_progress_updates', 'Progress Updates', 'number', false)}
              {renderField('inspection_count', 'Inspection Count', 'number', false)}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/data-management')}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Submit for Risk Analysis
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
