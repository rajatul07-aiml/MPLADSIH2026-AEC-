import React, { useState, useEffect } from 'react';
import { workflowService } from '../services/workflowService';
import { History, Search, Loader2 } from 'lucide-react';
import { AuditEvent } from '../types/workflow';

export const AuditTrail: React.FC = () => {
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await workflowService.getAllEvents();
        setEvents(data || []);
      } catch (e) {
        console.error("Failed to load audit events", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredEvents = events.filter(e =>
    e.workId.toLowerCase().includes(search.toLowerCase()) ||
    e.event.toLowerCase().includes(search.toLowerCase()) ||
    e.actor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto bg-slate-50 flex flex-col">
      <div className="p-6 md:p-8 flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-slate-600" />
            System Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chronological ledger of all recorded actions and workflow events across MPLADS works.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Work ID, Event, or Actor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading audit trail...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Timestamp</th>
                    <th className="px-4 py-3 font-semibold">Work ID</th>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Actor / Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {isNaN(new Date(evt.timestamp).getTime()) ? evt.timestamp : new Date(evt.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-900 font-medium">
                          {evt.workId}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {evt.event}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="font-medium">{evt.actor}</span>
                          <span className="text-slate-400 text-xs ml-1">({evt.role})</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                            {evt.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                        No audit events found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
