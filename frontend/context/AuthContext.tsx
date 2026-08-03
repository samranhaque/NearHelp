'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Run refresh on mount to restore session silently via httpOnly cookie
        const restoreSession = async () => {
            try {
                const { data } = await api.post('/auth/refresh');
                setAccessToken(data.token);
                // The refresh endpoint only gives token. We must fetch /me
                const userRes = await api.get('/auth/me');
                setUser(userRes.data);
                connectSocket(data.token);
            } catch (error) {
                console.log('No active session found.');
                // Do not redirect here, let middleware or page-level components handle it
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setAccessToken(data.token);
            setUser({ 
                _id: data._id, 
                name: data.name, 
                email: data.email, 
                phone: data.phone, 
                location: data.location,
                age: data.age,
                blood_group: data.blood_group,
                health_conditions: data.health_conditions,
                is_physically_disabled: data.is_physically_disabled,
                skills: data.skills
            });
            connectSocket(data.token);
            // Mark online immediately on login
            api.put('/users/location', data.location || { lat: 0, lng: 0 }).catch(console.error);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const register = async (formData: any) => {
        try {
            const { data } = await api.post('/auth/register', formData);
            // Assuming register auto-logs in or returns token based on backend
            // Our backend registers and sets cookies + accessToken
            setAccessToken(data.token);
            setUser({ 
                _id: data._id, 
                name: data.name, 
                email: data.email, 
                phone: data.phone,
                age: data.age,
                blood_group: data.blood_group,
                health_conditions: data.health_conditions,
                is_physically_disabled: data.is_physically_disabled,
                skills: data.skills
            });
            connectSocket(data.token);
            // Mark online immediately on register
            api.put('/users/location', { lat: 0, lng: 0 }).catch(console.error);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout API failed:', error);
        } finally {
            setAccessToken(null);
            setUser(null);
            disconnectSocket();
            router.push('/auth/login');
        }
    };

    // Heartbeat to keep user online while tab is active
    useEffect(() => {
        if (!user) return;

        const heartbeat = setInterval(() => {
            if (user.location?.lat) {
                api.put('/users/location', user.location).catch(() => { });
            }
        }, 120000);

        // Proactive token refresh every 12 mins (15m expiry)
        const refreshInterval = setInterval(async () => {
            try {
                console.log('Proactively refreshing access token...');
                const { data } = await api.post('/auth/refresh');
                setAccessToken(data.token);
                // Update socket with the fresh token
                connectSocket(data.token);
            } catch (err) {
                console.error('Proactive refresh failed:', err);
            }
        }, 12 * 60 * 1000);

        return () => {
            clearInterval(heartbeat);
            clearInterval(refreshInterval);
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
