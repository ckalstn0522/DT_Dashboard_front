import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export function FilterProvider({ children }) {
  // 선택된 값 (기본값: 전체)
  const [selectedDate, setSelectedDate] = useState('all');
  const [timePeriod, setTimePeriod] = useState('all');

  // 선택 가능한 옵션 목록 (Dashboard에서 데이터 로딩 후 채워짐)
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimePeriods, setAvailableTimePeriods] = useState([]);
  
  // 활성화 여부 (교차로 선택 시 true)
  const [isSelectionEnabled, setIsSelectionEnabled] = useState(false);

  return (
    <FilterContext.Provider value={{
      selectedDate, setSelectedDate,
      timePeriod, setTimePeriod,
      availableDates, setAvailableDates,
      availableTimePeriods, setAvailableTimePeriods,
      isSelectionEnabled, setIsSelectionEnabled
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilter = () => useContext(FilterContext);