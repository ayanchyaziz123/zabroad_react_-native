import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

// Default user — replaced when onboarding completes
const DEFAULT_USER = {
  name: 'Azizur Rahman',
  handle: '@azizur_r',
  avatar: '🧑‍💻',
  homeCountry: { flag: '🇧🇩', name: 'Bangladesh' },
  livesIn: 'Queens, NY',
  visaStatus: 'OPT',
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(DEFAULT_USER);

  function updateUser(fields) {
    setUser(prev => ({ ...prev, ...fields }));
  }

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
