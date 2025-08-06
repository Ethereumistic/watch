"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { ALL_COUNTRIES } from '@/lib/constants';

// --- Types ---
interface QueueInfo {
  name: string;
  count: number;
}

interface UserInQueue {
  id: string;
  cooldowns: string[];
}

// --- Helper Components ---
const GenderIcon = ({ gender }: { gender: string }) => {
  const baseClasses = "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white";
  switch (gender.toLowerCase()) {
    case 'male': return <div className={`${baseClasses} bg-blue-500`}>M</div>;
    case 'female': return <div className={`${baseClasses} bg-pink-500`}>F</div>;
    case 'couple': return <div className={`${baseClasses} bg-yellow-500`}>C</div>;
    default: return <div className={`${baseClasses} bg-gray-500`}>?</div>;
  }
};

const CountryFlag = ({ countryCode }: { countryCode: string }) => {
  const country = ALL_COUNTRIES.find(c => c.name.toLowerCase() === countryCode.toLowerCase() || c.abbr.toLowerCase() === countryCode.toLowerCase());
  const code = country ? country.abbr : 'xx'; // 'xx' for unknown
  return <img src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${code}.svg`} alt={countryCode} className="w-6 h-auto rounded-sm" />;
};

// --- Main Component ---
export function QueueBreakdown({ queues }: { queues: QueueInfo[] }) {
  const [expandedQueue, setExpandedQueue] = useState<string | null>(null);
  const [users, setUsers] = useState<UserInQueue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleQueueToggle = async (queueName: string) => {
    if (expandedQueue === queueName) {
      setExpandedQueue(null);
      setUsers([]);
      return;
    }
    
    setIsLoading(true);
    setExpandedQueue(queueName);
    try {
      const response = await fetch(`/api/admin/analytics/queues/${encodeURIComponent(queueName)}`);
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Failed to fetch queue users", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCooldownReset = async (userId: string, botId: string | 'all') => {
    try {
      await fetch(`/api/admin/analytics/cooldowns`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, botId }),
      });
      // Refresh the user data after deleting a cooldown
      handleQueueToggle(expandedQueue!);
    } catch (error) {
      console.error("Failed to reset cooldown", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <Accordion type="single" collapsible value={expandedQueue || ""} onValueChange={handleQueueToggle}>
          {queues.length > 0 ? queues.map(q => {
            const [_, country, gender] = q.name.split(':');
            return (
              <AccordionItem value={q.name} key={q.name}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <CountryFlag countryCode={country} />
                      <GenderIcon gender={gender} />
                      <span className="font-mono text-sm">{`${country} / ${gender}`}</span>
                    </div>
                    <span className="font-bold text-lg">{q.count}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                  ) : (
                    <div className="space-y-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <h4 className="font-bold text-sm mb-2">Users in Queue:</h4>
                      {users.map(user => (
                        <div key={user.id} className="p-2 bg-white dark:bg-gray-700 rounded">
                          <p className="font-mono text-xs">{user.id}</p>
                          <div className="mt-2">
                            <h5 className="text-xs font-semibold">Bot Cooldowns:</h5>
                            {user.cooldowns.length > 0 ? (
                              <ul className="pl-4 text-xs font-mono">
                                {user.cooldowns.map(botId => (
                                  <li key={botId} className="flex items-center justify-between">
                                    <span>- {botId}</span>
                                    <Button variant="ghost" size="sm" onClick={() => handleCooldownReset(user.id, botId)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-xs text-gray-500">None</p>}
                            {user.cooldowns.length > 0 && (
                               <Button variant="destructive" size="sm" className="mt-2" onClick={() => handleCooldownReset(user.id, 'all')}>
                                 Reset All
                               </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          }) : <p>No active queues.</p>}
        </Accordion>
      </CardContent>
    </Card>
  );
}
