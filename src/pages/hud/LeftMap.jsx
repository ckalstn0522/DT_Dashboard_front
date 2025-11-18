import React from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import IntersectionMap from "../../components/dashboard/IntersectionMap"; 

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function LeftMap() {
  const { data: intersections, isLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const handleMarkerClick = (intersection) => {
    // [핵심] UnityWebBrowser 통신을 위한 Title Hack
    // 1. 제목을 "CLICKED:교차로ID"로 변경
    const message = `CLICKED:${intersection.intersection_id}`;
    document.title = message;
    console.log("Signal sent to Unity:", message);

    // 2. (중요) 잠시 후 제목을 원상복구 (그래야 같은 걸 또 클릭했을 때 감지됨)
    setTimeout(() => {
      document.title = "LeftHUD"; 
    }, 200);
  };

  return (
    <div className="w-full h-screen bg-transparent">
      {isLoading ? (
        <Skeleton className="w-full h-full" />
      ) : (
        <Card className="w-full h-full bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="h-screen">
              <IntersectionMap
                intersections={intersections}
                onSelectIntersection={handleMarkerClick}
                selectedIntersectionId={null}
                
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}