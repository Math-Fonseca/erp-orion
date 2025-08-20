import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-gray-600',
  iconBg = 'bg-gray-100'
}: KPICardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-8 w-8 rounded ${iconBg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-3xl font-semibold text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
        {change && (
          <div className="mt-3">
            <div className="text-sm">
              <span className={`font-medium ${getChangeColor()}`}>
                {change}
              </span>
              <span className="text-gray-500 ml-1">
                vs mês anterior
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
