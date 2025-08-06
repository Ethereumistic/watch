"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2 } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";

// --- Types ---
interface CountryStat {
  total: number;
  male: number;
  female: number;
  couple: number;
}

interface GenderStat {
    total: number;
    countries: Record<string, number>;
}

// --- Helper Components ---
const CountryFlag = ({ countryName }: { countryName: string }) => {
  const country = ALL_COUNTRIES.find(c => c.name === countryName);
  const code = country ? country.abbr : 'xx';
  return <img src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${code}.svg`} alt={countryName} className="w-8 h-auto rounded-md border" />;
};

const GenderRatioBar = ({ stats }: { stats: CountryStat }) => {
    const total = stats.total;
    if (total === 0) return null;
    const maleWidth = (stats.male / total) * 100;
    const femaleWidth = (stats.female / total) * 100;
    const coupleWidth = (stats.couple / total) * 100;

    return (
        <div className="w-full h-2 bg-gray-200 rounded-full flex overflow-hidden">
            <div style={{ width: `${maleWidth}%` }} className="bg-blue-500"></div>
            <div style={{ width: `${femaleWidth}%` }} className="bg-pink-500"></div>
            <div style={{ width: `${coupleWidth}%` }} className="bg-yellow-500"></div>
        </div>
    )
}

// --- Main Component ---
export function OnlineUsersView() {
  const [data, setData] = useState<{ byCountry: Record<string, CountryStat>, byGender: Record<string, GenderStat> } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/analytics/online-users');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch online users data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (!data) {
    return <p>No data available.</p>;
  }

  const genderDataForChart = Object.entries(data.byGender).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value.total,
      countries: value.countries
  }));
  const COLORS = {'Male': '#3b82f6', 'Female': '#ec4899', 'Couple': '#f59e0b', 'Unknown': '#6b7280'};

  return (
    <Tabs defaultValue="countries">
      <TabsList>
        <TabsTrigger value="countries">Countries</TabsTrigger>
        <TabsTrigger value="gender">Gender</TabsTrigger>
        <TabsTrigger value="filters">Filters</TabsTrigger>
      </TabsList>

      <TabsContent value="countries" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(data.byCountry).sort(([,a], [,b]) => b.total - a.total).map(([country, stats]) => (
                <Card key={country}>
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                        <CountryFlag countryName={country} />
                        <CardTitle>{country}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <GenderRatioBar stats={stats} />
                        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                            <span>M: {stats.male}</span>
                            <span>F: {stats.female}</span>
                            <span>C: {stats.couple}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </TabsContent>

      <TabsContent value="gender" className="mt-4">
        <Card>
            <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent style={{ width: '100%', height: 400 }}>
                 <ResponsiveContainer>
                    <PieChart>
                        <Pie data={genderDataForChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                            {genderDataForChart.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#000'} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="filters" className="mt-4">
        <Card>
            <CardHeader><CardTitle>Filter Usage (Coming Soon)</CardTitle></CardHeader>
            <CardContent>
                <Input placeholder="Search for users by filter criteria..." />
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
