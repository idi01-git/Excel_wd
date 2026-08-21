"use client";

import Tabs, { TabItem } from "@/components/ui/tabs";
import { useState } from "react";
import SubSelectToggle, { MenuItem } from ".";

const TABS: [MenuItem, MenuItem] = [
  { label: "Free", value: "free" },
  { label: "Premium", value: "premium" },
];

const SUB_TABS: Record<string, [MenuItem, MenuItem]> = {
  free: [
    { label: "Basic", value: "basic" },
    { label: "Standard", value: "standard" },
  ],
  premium: [
    { label: "Monthly", value: "monthly" },
    { label: "Annual", value: "annual" },
  ],
};

const TDATA: TabItem[] = [
  { name: "0.5s", value: 0.5 },
  { name: "2s", value: 2 },
];

const SubSelectToggleDemo = () => {
  const [dur, setDur] = useState(TDATA[0]);
  const [tab, setTab] = useState(TABS[0]);
  const [subTab, setSubTab] = useState(SUB_TABS.premium[0]);

  return (
    <div className="box bg-d-sheet relative flex min-h-[400px] items-center justify-center py-8">
      <div className="absolute top-0 right-0 m-4">
        <Tabs tabs={TDATA} tab={dur} setTab={setDur} small />
      </div>
      <SubSelectToggle
        tabs={TABS}
        subTabs={SUB_TABS}
        activeMainTab={tab}
        setActiveMainTab={setTab}
        activeSubTab={subTab}
        setActiveSubTab={setSubTab}
        transition={{ type: "spring", bounce: 0.1, duration: dur.value }}
      />
    </div>
  );
};
export default SubSelectToggleDemo;
