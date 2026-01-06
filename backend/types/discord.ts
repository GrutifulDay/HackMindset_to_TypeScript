export type BlockedIPNotification = {
    ip: string;
    city: string;
    userAgent: string;
    reason: string;
    method: string;
    path: string;
    headers: Record<string, unknown>;
    requests: unknown[];
};

export type BlockMeta = {
    ip?: string;
    city?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    headers?: Record<string, unknown>;
}; 
  
  