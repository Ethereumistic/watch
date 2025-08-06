"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, ArrowRightLeft } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/constants";
import type { MatchProfile } from "@/stores/use-auth-store";

// --- Helper Components ---
const CountryFlag = ({ countryName }: { countryName: string | null | undefined }) => {
  if (!countryName) return null;
  const country = ALL_COUNTRIES.find(c => c.name === countryName);
  const code = country ? country.abbr : 'xx';
  return <img src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${code}.svg`} alt={countryName} className="w-6 h-auto rounded-sm border" />;
};

const ProfileCard = ({ profile }: { profile: MatchProfile }) => (
    <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
            <CountryFlag countryName={profile.country} />
            <h4 className="font-bold">{profile.username || 'Anonymous'}</h4>
        </div>
        <p className="text-xs font-mono mt-2 text-muted-foreground">{profile.id}</p>
        <div className="text-xs mt-1">
            <span>Gender: {profile.gender || 'N/A'}</span>
        </div>
    </div>
)

// --- Main Component ---
export function ActiveMatchesView() {
  const [matches, setMatches] = useState<{ userA: MatchProfile, userB: MatchProfile }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/analytics/active-matches');
        const result = await response.json();
        setMatches(result.matches);
      } catch (error) {
        console.error("Failed to fetch active matches", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Active P2P Matches ({matches.length})</h2>
      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <ProfileCard profile={match.userA} />
                <ArrowRightLeft className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                <ProfileCard profile={match.userB} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No active P2P matches at the moment.</p>
      )}
    </div>
  );
}
