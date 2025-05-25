import React from 'react';

const CustomTabs = ({ tabs, activeTab, onTabChange }) => (
    <div className="mb-6 border-b border-gray-300">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${
                            activeTab === tab.key
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    </div>
);

export default CustomTabs;
