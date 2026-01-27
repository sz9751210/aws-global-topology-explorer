import React from 'react';
import { Instance, SecurityRule } from './types';

interface Props {
    instance: Instance;
}

export const DetailPanel: React.FC<Props> = ({ instance }) => {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Instance Details</h2>

            <div className="bg-white p-4 rounded shadow mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="block text-gray-500">Name</span>
                        <span className="font-medium">{instance.name}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Instance ID</span>
                        <span className="font-medium font-mono">{instance.id}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Type</span>
                        <span className="font-medium">{instance.type}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">State</span>
                        <span className={`font-medium ${instance.state === 'running' ? 'text-green-600' : 'text-gray-600'}`}>
                            {instance.state}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Private IP</span>
                        <span className="font-medium">{instance.private_ip}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Public IP</span>
                        <span className="font-medium">{instance.public_ip || '-'}</span>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold mb-2 text-gray-800">Security Rules (Inbound)</h3>
            <div className="space-y-4">
                {instance.security_rules.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No Inbound Rules found.</p>
                ) : (
                    instance.security_rules.map((rule, idx) => (
                        <div key={idx} className="bg-white border-l-4 border-indigo-500 p-3 shadow-sm rounded-r">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-gray-700 text-sm">{rule.protocol.toUpperCase()} {rule.from_port === rule.to_port ? rule.from_port : `${rule.from_port}-${rule.to_port}`}</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{rule.sg_name} ({rule.sg_id})</span>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                                Sources:
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {rule.source.map((src, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs">
                                        {src}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 border-t pt-1">
                                Description: {rule.description}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
