"use client";

import React from "react";
import { motion, MotionConfig, Transition } from "framer-motion";

export interface MenuItem {
  label: string;
  value: string;
}

interface Props {
  tabs: [MenuItem, MenuItem];
  subTabs: {
    [key: string]: [MenuItem, MenuItem] | undefined;
  };
  activeMainTab: MenuItem;
  setActiveMainTab: (tab: MenuItem) => void;
  activeSubTab: MenuItem;
  setActiveSubTab: (tab: MenuItem) => void;
  transition?: Transition;
}

const SubSelectToggle = ({
  tabs,
  subTabs,
  activeMainTab,
  activeSubTab,
  setActiveMainTab,
  setActiveSubTab,
  transition = { type: "spring", stiffness: 380, damping: 28, mass: 0.8 },
}: Props) => {
  return (
    <div className="w-full max-w-xl mx-auto select-none">
      <MotionConfig transition={transition}>
        <div className="relative flex h-14 sm:h-16 rounded-full bg-neutral-100/90 dark:bg-[#121212] backdrop-blur-2xl p-1.5 border border-neutral-200/90 dark:border-neutral-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
          {tabs.map((t) => {
            const isActive = t.value === activeMainTab.value;
            const tSubTabs = subTabs[t.value];

            return (
              <div
                key={t.value}
                onClick={() => {
                  if (!isActive) {
                    setActiveMainTab(t);
                    if (tSubTabs && tSubTabs.length > 0) {
                      setActiveSubTab(tSubTabs[0]);
                    } else {
                      setActiveSubTab(t);
                    }
                  }
                }}
                className="relative flex-1 h-full rounded-full cursor-pointer group"
              >
                {/* Active Outer Pill Background */}
                {isActive && (
                  <motion.div
                    layoutId="main-tab-active-pill"
                    className="absolute inset-0 rounded-full bg-white dark:bg-[#1f1f1f] border border-neutral-200/80 dark:border-neutral-700/70 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)] z-0"
                  />
                )}

                {/* Subtle Inactive Hover Tint */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-full bg-neutral-200/40 dark:bg-neutral-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}

                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {/* Case 1: Tab without subTabs */}
                  {!tSubTabs ? (
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-wide transition-colors duration-200 ${
                        isActive
                          ? "text-neutral-950 dark:text-white"
                          : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
                      }`}
                    >
                      {t.label}
                    </span>
                  ) : !isActive ? (
                    /* Case 2: Inactive Tab with subTabs */
                    <motion.div
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      className="flex flex-col items-center justify-center text-center px-3"
                    >
                      <span className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors duration-200">
                        {t.label}
                      </span>
                      <span className="text-[9.5px] font-mono tracking-widest text-neutral-400 dark:text-neutral-500 uppercase mt-0.5 truncate max-w-[140px] sm:max-w-none">
                        {tSubTabs[0].label} • {tSubTabs[1].label}
                      </span>
                    </motion.div>
                  ) : (
                    /* Case 3: Active Tab with subTabs */
                    <div className="flex w-full h-full p-0.5 gap-1">
                      {tSubTabs.map((st) => {
                        const isSubActive = st.value === activeSubTab.value;
                        return (
                          <button
                            type="button"
                            key={st.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSubTab(st);
                            }}
                            className={`relative flex-1 h-full rounded-full flex items-center justify-center px-2.5 sm:px-3 text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                              isSubActive
                                ? "text-white dark:text-neutral-950"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40"
                            }`}
                          >
                            {isSubActive && (
                              <motion.div
                                layoutId="sub-tab-active-pill"
                                className="absolute inset-0 rounded-full bg-neutral-950 dark:bg-white shadow-[0_2px_12px_rgba(0,0,0,0.18)] dark:shadow-[0_2px_14px_rgba(255,255,255,0.25)] z-0"
                              />
                            )}
                            <span className="relative z-10 whitespace-nowrap truncate">
                              {st.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </MotionConfig>
    </div>
  );
};

export default SubSelectToggle;
