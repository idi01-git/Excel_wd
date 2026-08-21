// src/components/ui/tabs.tsx
"use client";

import React from "react";

export interface TabItem {
  name: string;
  value: any;
}

interface TabsProps {
  tabs: TabItem[];
  tab: TabItem;
  setTab: (tab: TabItem) => void;
  small?: boolean;
}

export default function Tabs({ tabs, tab, setTab, small }: TabsProps) {
  return (
    <div className={`flex rounded-full bg-black/5 dark:bg-white/10 p-1 ${small ? 'text-xs' : 'text-sm'}`}>
      {tabs.map((t) => (
        <button
          key={t.name}
          onClick={() => setTab(t)}
          className={`px-3 py-1 rounded-full font-mono transition-colors ${
            tab.name === t.name
              ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
