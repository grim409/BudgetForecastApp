import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@group_id';

interface GroupContextType {
  groupId: string | null;
  createGroup: () => string;
  joinGroup: (id: string) => void;
}

const GroupContext = createContext<GroupContextType>({
  groupId: null,
  createGroup: () => '',
  joinGroup: () => {},
});

export const GroupProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(id => {
      if (id) setGroupId(id);
    });
  }, []);

  const createGroup = (): string => {
    const id = uuidv4();
    AsyncStorage.setItem(STORAGE_KEY, id);
    setGroupId(id);
    return id;
  };

  const joinGroup = (id: string): void => {
    AsyncStorage.setItem(STORAGE_KEY, id);
    setGroupId(id);
  };

  return (
    <GroupContext.Provider value={{ groupId, createGroup, joinGroup }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext);
