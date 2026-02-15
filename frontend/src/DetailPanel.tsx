import React from 'react';
import { Instance } from './types';
import { Shield, Server, Network } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    instance: Instance;
}

export const DetailPanel: React.FC<Props> = ({ instance }) => {
    const DetailRow = ({ label, value, mono = false, highlight = false }: any) => (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</span>
            <span className={clsx(
                "text-sm",
                mono && "font-mono",
                highlight ? "text-white font-medium" : "text-slate-300"
            )}>{value || '-'}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Main Info Card */}
            <div className="glass-card p-5 rounded-xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Server size={64} className="text-indigo-500" />
                </div>

                <div className="relative z-10 flex items-start justify-between mb-4">
                    <div>
                        <h4 className="text-white font-bold text-lg flex items-center gap-2">
                            {instance.name || 'Unnamed Instance'}
                        </h4>
                        <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mt-1 inline-block">
                            {instance.id}
                        </span>
                    </div>
                    <div className={clsx(
                        "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-[0_0_10px_inset_rgba(0,0,0,0.2)]",
                        instance.state === 'running'
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10"
                            : "bg-slate-700/30 text-slate-400 border-slate-600 shadow-none"
                    )}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full", instance.state === 'running' ? "bg-emerald-400 animate-pulse" : "bg-slate-500")}></div>
                        {instance.state.toUpperCase()}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <DetailRow label="Instance Type" value={instance.type} mono highlight />
                    <DetailRow label="Private IP" value={instance.private_ip} mono />
                    <DetailRow label="Public IP" value={instance.public_ip} mono />
                    <DetailRow label="Subnet ID" value={instance.subnet_id} mono />
                </div>
            </div>

            {/* Security Groups Section */}
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Shield size={14} /> Security Configuration
                </h3>

                <div className="space-y-3">
                    {instance.security_rules.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-700 text-slate-500 text-sm text-center italic bg-white/5">
                            No Inbound Rules found.
                        </div>
                    ) : (
                        instance.security_rules.map((rule, idx) => (
                            <div key={idx} className="glass-card p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-0.5 rounded shadow-lg shadow-indigo-500/20">
                                            {rule.protocol.toUpperCase()}
                                        </span>
                                        <span className="font-mono text-indigo-300 text-sm">
                                            {rule.from_port === rule.to_port ? rule.from_port : `${rule.from_port}-${rule.to_port}`}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 bg-black/20 px-2 py-1 rounded border border-white/5">
                                        {rule.sg_name}
                                    </span>
                                </div>

                                <div className="mb-2">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Allowed Sources</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(rule.source || []).map((src: string, i: number) => (
                                            <span key={i} className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded text-[10px] font-mono flex items-center gap-1">
                                                <Network size={10} /> {src}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {rule.description && (
                                    <p className="text-xs text-slate-500 border-t border-white/5 pt-2 mt-2 leading-relaxed">
                                        {rule.description}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
